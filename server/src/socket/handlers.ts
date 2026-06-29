import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@uno/shared';
import { verifyToken } from '../utils/auth';
import { roomManager } from '../game/RoomManager';
import { toClientGameState } from '../utils/gameState';
import { recordGameResult } from '../controllers/statsController';
import { v4 as uuidv4 } from 'uuid';

interface SocketPlayer {
  playerId: string;
  username: string;
  avatar: string;
}

export function registerSocketHandlers(io: Server): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        socket.data.user = payload;
        socket.data.playerId = payload.userId;
        socket.data.username = payload.username;
      }
    }

    if (!socket.data.playerId) {
      const authPlayerId = socket.handshake.auth?.playerId as string | undefined;
      socket.data.playerId = authPlayerId ?? `guest_${uuidv4().slice(0, 8)}`;
      socket.data.username = `Player${Math.floor(Math.random() * 9000) + 1000}`;
    }

    socket.data.avatar = socket.handshake.auth?.avatar ?? '🎮';
    next();
  });

  io.on('connection', (socket: Socket) => {
    const playerId = socket.data.playerId as string;
    const username = socket.data.username as string;
    const avatar = socket.data.avatar as string;

    console.log(`Player connected: ${username} (${playerId})`);

    // Reconnect to existing room
    const existingRoom = roomManager.getRoomByPlayer(playerId);
    if (existingRoom) {
      roomManager.updateSocketId(playerId, socket.id);
      socket.join(existingRoom.code);
      socket.emit(SOCKET_EVENTS.ROOM_UPDATED, {
        code: existingRoom.code,
        hostId: existingRoom.hostId,
        players: Array.from(existingRoom.players.values()).map((e) => ({
          id: e.player.id,
          name: e.player.name,
          avatar: e.player.avatar,
          isReady: e.player.isReady,
          isConnected: e.player.isConnected,
        })),
        settings: existingRoom.settings,
        isPublic: existingRoom.isPublic,
        status: existingRoom.status,
      });
      if (existingRoom.gameState) {
        socket.emit(SOCKET_EVENTS.GAME_STATE, toClientGameState(existingRoom.gameState, playerId));
      }
    }

    socket.on(SOCKET_EVENTS.ROOM_CREATE, (data: { isPublic?: boolean; settings?: Record<string, unknown> }, callback) => {
      const room = roomManager.createRoom(playerId, socket.id, username, avatar, data?.isPublic, data?.settings as never);
      socket.join(room.code);
      io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, room);
      callback?.({ success: true, room });
    });

    socket.on(SOCKET_EVENTS.ROOM_JOIN, (data: { code: string }, callback) => {
      const result = roomManager.joinRoom(data.code.toUpperCase(), playerId, socket.id, username, avatar);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { error: result.error });
        return;
      }
      socket.join(data.code.toUpperCase());
      io.to(data.code.toUpperCase()).emit(SOCKET_EVENTS.ROOM_UPDATED, result.room);
      callback?.({ success: true, room: result.room });
    });

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
      const result = roomManager.leaveRoom(playerId);
      if (result.code) {
        socket.leave(result.code);
        if (result.room) {
          io.to(result.code).emit(SOCKET_EVENTS.ROOM_UPDATED, result.room);
        }
      }
    });

    socket.on(SOCKET_EVENTS.PLAYER_READY, (data: { isReady: boolean }) => {
      const room = roomManager.setReady(playerId, data.isReady);
      if (room) {
        const code = room.code;
        io.to(code).emit(SOCKET_EVENTS.ROOM_UPDATED, room);
      }
    });

    socket.on(SOCKET_EVENTS.GAME_START, (callback) => {
      const result = roomManager.startGame(playerId);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        return;
      }

      const room = roomManager.getRoomByPlayer(playerId);
      if (!room || !result.state) return;

      const socketMap = roomManager.getPlayerSocketIds(room);
      for (const [pid, sid] of socketMap) {
        io.to(sid).emit(SOCKET_EVENTS.GAME_STATE, toClientGameState(result.state, pid));
      }
      callback?.({ success: true });
    });

    socket.on(SOCKET_EVENTS.GAME_PLAY, (data: { cardId: string; chosenColor?: string }, callback) => {
      const result = roomManager.handlePlay(playerId, data.cardId, data.chosenColor);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { error: result.error });
        return;
      }
      broadcastGameState(io, playerId, result.state!);
      callback?.({ success: true });
    });

    socket.on(SOCKET_EVENTS.GAME_DRAW, (callback) => {
      const result = roomManager.handleDraw(playerId);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        return;
      }
      broadcastGameState(io, playerId, result.state!);
      callback?.({ success: true, drawn: result.drawn });
    });

    socket.on(SOCKET_EVENTS.GAME_CALL_UNO, (callback) => {
      const result = roomManager.handleCallUno(playerId);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        return;
      }
      broadcastGameState(io, playerId, result.state!);
      callback?.({ success: true });
    });

    socket.on(SOCKET_EVENTS.GAME_CHALLENGE, (callback) => {
      const result = roomManager.handleChallenge(playerId);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        return;
      }
      broadcastGameState(io, playerId, result.state!);
      callback?.({ success: true, challengeSuccess: result.success });
    });

    socket.on('game:penalize_uno', (data: { targetId: string }, callback) => {
      const result = roomManager.handlePenalizeUno(playerId, data.targetId);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        return;
      }
      broadcastGameState(io, playerId, result.state!);
      callback?.({ success: true });
    });

    socket.on('game:next_round', (callback) => {
      const result = roomManager.handleNextRound(playerId);
      if (result.error) {
        callback?.({ success: false, error: result.error });
        return;
      }
      broadcastGameState(io, playerId, result.state!);
      callback?.({ success: true });
    });

    socket.on(SOCKET_EVENTS.CHAT_SEND, (data: { text: string }) => {
      const room = roomManager.getRoomByPlayer(playerId);
      if (!room) return;

      const message = {
        id: uuidv4(),
        playerId,
        playerName: username,
        text: data.text.slice(0, 500),
        timestamp: Date.now(),
      };

      io.to(room.code).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
    });

    socket.on(SOCKET_EVENTS.MATCHMAKING_JOIN, (data: { playerCount: number }, callback) => {
      const result = roomManager.addToMatchmaking(data.playerCount, playerId, socket.id, username, avatar);
      if (result.matched) {
        socket.join(result.matched.code);
        io.to(result.matched.code).emit(SOCKET_EVENTS.MATCHMAKING_MATCHED, result.matched);
        io.to(result.matched.code).emit(SOCKET_EVENTS.ROOM_UPDATED, result.matched);
        callback?.({ success: true, matched: true, room: result.matched });
      } else {
        callback?.({ success: true, waiting: true });
      }
    });

    socket.on(SOCKET_EVENTS.MATCHMAKING_LEAVE, () => {
      roomManager.removeFromMatchmaking(playerId);
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${username}`);
      const room = roomManager.getRoomByPlayer(playerId);
      if (room) {
        const entry = room.players.get(playerId);
        if (entry) entry.player.isConnected = false;

        io.to(room.code).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, { playerId });

        if (room.gameState) {
          const p = room.gameState.players.find((pl) => pl.id === playerId);
          if (p) p.isConnected = false;
        }
      }
    });
  });
}

function broadcastGameState(io: Server, playerId: string, state: import('@uno/shared').GameState): void {
  const room = roomManager.getRoomByPlayer(playerId);
  if (!room) return;

  const socketMap = roomManager.getPlayerSocketIds(room);
  for (const [pid, sid] of socketMap) {
    io.to(sid).emit(SOCKET_EVENTS.GAME_STATE, toClientGameState(state, pid));
  }

  if (state.status === 'round_end' || state.status === 'finished') {
    const duration = Date.now() - (room.createdAt ?? Date.now());
    const playerIds = state.players
      .filter((p) => p.type === 'human' && !p.id.startsWith('guest_'))
      .map((p) => p.id);

    if (state.winnerId && playerIds.length > 0) {
      recordGameResult(state.winnerId, playerIds, duration).catch(console.error);
    }

    if (state.status === 'finished') {
      io.to(room.code).emit(SOCKET_EVENTS.GAME_END, { winnerId: state.winnerId });
    }
  }
}

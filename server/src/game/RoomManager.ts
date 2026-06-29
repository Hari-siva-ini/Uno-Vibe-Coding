import { v4 as uuidv4 } from 'uuid';
import type { GameState, GameSettings, Player, RoomInfo } from '@uno/shared';
import {
  createDefaultSettings,
  createGameState,
  createPlayer,
  startGame,
  generateRoomCode,
  playCard,
  drawCards,
  callUno,
  challengeWildDrawFour,
  penalizeForgottenUno,
  startNextRound,
  checkTournamentEnd,
} from '@uno/shared';
import { serializeLobbyPlayer } from '../utils/gameState';

interface Room {
  code: string;
  hostId: string;
  players: Map<string, { player: Player; socketId: string }>;
  gameState: GameState | null;
  isPublic: boolean;
  settings: GameSettings;
  status: 'lobby' | 'playing' | 'finished';
  createdAt: number;
}

/** In-memory room and matchmaking manager */
export class RoomManager {
  private rooms = new Map<string, Room>();
  private playerRooms = new Map<string, string>();
  private matchmakingQueues = new Map<number, Array<{ playerId: string; socketId: string; name: string; avatar: string }>>();

  createRoom(
    hostId: string,
    socketId: string,
    name: string,
    avatar: string,
    isPublic = false,
    settings?: Partial<GameSettings>
  ): RoomInfo {
    const code = this.generateUniqueCode();
    const gameSettings = createDefaultSettings(settings);

    const host = createPlayer(hostId, name, 0, 'human', avatar);
    host.isReady = true;

    const room: Room = {
      code,
      hostId,
      players: new Map([[hostId, { player: host, socketId }]]),
      gameState: null,
      isPublic,
      settings: gameSettings,
      status: 'lobby',
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.playerRooms.set(hostId, code);

    return this.toRoomInfo(room);
  }

  joinRoom(
    code: string,
    playerId: string,
    socketId: string,
    name: string,
    avatar: string
  ): { room?: RoomInfo; error?: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'lobby') return { error: 'Game already in progress' };
    if (room.players.size >= room.settings.maxPlayers) return { error: 'Room is full' };

  const existing = room.players.get(playerId);
    if (existing) {
      existing.socketId = socketId;
      existing.player.isConnected = true;
      this.playerRooms.set(playerId, code);
      return { room: this.toRoomInfo(room) };
    }

    const seatIndex = room.players.size;
    const player = createPlayer(playerId, name, seatIndex, 'human', avatar);
    room.players.set(playerId, { player, socketId });
    this.playerRooms.set(playerId, code);

    return { room: this.toRoomInfo(room) };
  }

  leaveRoom(playerId: string): { code?: string; room?: RoomInfo; hostChanged?: boolean } {
    const code = this.playerRooms.get(playerId);
    if (!code) return {};

    const room = this.rooms.get(code);
    if (!room) return { code };

    room.players.delete(playerId);
    this.playerRooms.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(code);
      return { code };
    }

    // Host migration
    let hostChanged = false;
    if (room.hostId === playerId) {
      const nextHost = room.players.keys().next().value;
      if (nextHost) {
        room.hostId = nextHost;
        hostChanged = true;
      }
    }

    if (room.gameState) {
      const p = room.gameState.players.find((pl) => pl.id === playerId);
      if (p) p.isConnected = false;
    }

    return { code, room: this.toRoomInfo(room), hostChanged };
  }

  setReady(playerId: string, isReady: boolean): RoomInfo | null {
    const code = this.playerRooms.get(playerId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) return null;

    const entry = room.players.get(playerId);
    if (entry) entry.player.isReady = isReady;

    return this.toRoomInfo(room);
  }

  startGame(playerId: string): { state?: GameState; error?: string } {
    const code = this.playerRooms.get(playerId);
    if (!code) return { error: 'Not in a room' };

    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== playerId) return { error: 'Only host can start' };
    if (room.players.size < 2) return { error: 'Need at least 2 players' };

    const allReady = Array.from(room.players.values()).every((e) => e.player.isReady);
    if (!allReady) return { error: 'All players must be ready' };

    const players = Array.from(room.players.values()).map((e) => ({ ...e.player }));
    const gameState = createGameState(
      uuidv4(),
      room.hostId,
      players,
      'online',
      room.settings,
      room.code
    );

    room.gameState = startGame(gameState);
    room.status = 'playing';

    return { state: room.gameState };
  }

  getGameState(playerId: string): GameState | null {
    const code = this.playerRooms.get(playerId);
    if (!code) return null;
    const room = this.rooms.get(code);
    return room?.gameState ?? null;
  }

  getRoomByPlayer(playerId: string): Room | null {
    const code = this.playerRooms.get(playerId);
    if (!code) return null;
    return this.rooms.get(code) ?? null;
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code) ?? null;
  }

  updateSocketId(playerId: string, socketId: string): void {
    const code = this.playerRooms.get(playerId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;
    const entry = room.players.get(playerId);
    if (entry) {
      entry.socketId = socketId;
      entry.player.isConnected = true;
    }
  }

  handlePlay(playerId: string, cardId: string, chosenColor?: string): {
    state?: GameState;
    error?: string;
  } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.gameState) return { error: 'No active game' };

    const result = playCard(room.gameState, playerId, { cardId, chosenColor: chosenColor as GameState['currentColor'] });
    if (result.error) return { error: result.error };

    room.gameState = result.state;
    if (result.state.status === 'round_end') {
      if (checkTournamentEnd(result.state)) {
        room.status = 'finished';
      }
    }
    return { state: room.gameState };
  }

  handleDraw(playerId: string): { state?: GameState; error?: string; drawn?: unknown } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.gameState) return { error: 'No active game' };

    const result = drawCards(room.gameState, playerId);
    if (result.error) return { error: result.error };

    room.gameState = result.state;
    return { state: room.gameState, drawn: result.drawn };
  }

  handleCallUno(playerId: string): { state?: GameState; error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.gameState) return { error: 'No active game' };

    const result = callUno(room.gameState, playerId);
    if (result.error) return { error: result.error };

    room.gameState = result.state;
    return { state: room.gameState };
  }

  handleChallenge(playerId: string): { state?: GameState; error?: string; success?: boolean } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.gameState) return { error: 'No active game' };

    const result = challengeWildDrawFour(room.gameState, playerId);
    if (result.error) return { error: result.error };

    room.gameState = result.state;
    return { state: room.gameState, success: result.success };
  }

  handlePenalizeUno(reporterId: string, targetId: string): { state?: GameState; error?: string } {
    const room = this.getRoomByPlayer(reporterId);
    if (!room?.gameState) return { error: 'No active game' };

    const result = penalizeForgottenUno(room.gameState, targetId, reporterId);
    if (result.error) return { error: result.error };

    room.gameState = result.state;
    return { state: room.gameState };
  }

  handleNextRound(playerId: string): { state?: GameState; error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.gameState) return { error: 'No active game' };
    if (room.hostId !== playerId) return { error: 'Only host can start next round' };

    room.gameState = startNextRound(room.gameState);
    room.status = 'playing';
    return { state: room.gameState };
  }

  addToMatchmaking(
    playerCount: number,
    playerId: string,
    socketId: string,
    name: string,
    avatar: string
  ): { matched?: RoomInfo; waiting?: boolean } {
    const queue = this.matchmakingQueues.get(playerCount) ?? [];
    queue.push({ playerId, socketId, name, avatar });
    this.matchmakingQueues.set(playerCount, queue);

    if (queue.length >= playerCount) {
      const matched = queue.splice(0, playerCount);
      this.matchmakingQueues.set(playerCount, queue);

      const host = matched[0];
      const roomInfo = this.createRoom(host.playerId, host.socketId, host.name, host.avatar, true);

      for (let i = 1; i < matched.length; i++) {
        const p = matched[i];
        this.joinRoom(roomInfo.code, p.playerId, p.socketId, p.name, p.avatar);
      }

      const room = this.rooms.get(roomInfo.code);
      if (room) {
        Array.from(room.players.values()).forEach((e) => (e.player.isReady = true));
      }

      return { matched: this.toRoomInfo(this.rooms.get(roomInfo.code)!) };
    }

    return { waiting: true };
  }

  removeFromMatchmaking(playerId: string): void {
    for (const [count, queue] of this.matchmakingQueues) {
      const filtered = queue.filter((p) => p.playerId !== playerId);
      this.matchmakingQueues.set(count, filtered);
    }
  }

  getSocketIds(code: string): string[] {
    const room = this.rooms.get(code);
    if (!room) return [];
    return Array.from(room.players.values()).map((e) => e.socketId);
  }

  getPlayerSocketIds(room: Room): Map<string, string> {
    const map = new Map<string, string>();
    for (const [id, entry] of room.players) {
      map.set(id, entry.socketId);
    }
    return map;
  }

  getPublicRooms(): Array<{ code: string; players: number; maxPlayers: number }> {
    return Array.from(this.rooms.values())
      .filter((r) => r.isPublic && r.status === 'lobby')
      .map((r) => ({
        code: r.code,
        players: r.players.size,
        maxPlayers: r.settings.maxPlayers,
      }));
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getPlayerCount(): number {
    return this.playerRooms.size;
  }

  private generateUniqueCode(): string {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));
    return code;
  }

  private toRoomInfo(room: Room): RoomInfo {
    return {
      code: room.code,
      hostId: room.hostId,
      players: Array.from(room.players.values()).map((e) => serializeLobbyPlayer(e.player)),
      settings: room.settings,
      isPublic: room.isPublic,
      status: room.status,
    };
  }
}

export const roomManager = new RoomManager();

import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@uno/shared';
import type { ClientGameState, RoomInfo } from '@uno/shared';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useSocketPlayerStore } from '../store/socketPlayerStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

function getPlayerAuth() {
  const { token, user } = useAuthStore.getState();
  const guestId = useSocketPlayerStore.getState().getOrCreatePlayerId();
  return {
    token,
    avatar: user?.avatar ?? '🎮',
    playerId: user?.id ?? guestId,
  };
}

export function getSocket(): Socket {
  if (!socket) {
    const auth = getPlayerAuth();

    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth,
      transports: ['websocket', 'polling'],
    });

    socket.on(SOCKET_EVENTS.ROOM_UPDATED, (room: RoomInfo) => {
      useGameStore.getState().setRoom(room);
    });

    socket.on(SOCKET_EVENTS.ROOM_ERROR, (data: { error: string }) => {
      useGameStore.getState().setError(data.error);
    });

    socket.on(SOCKET_EVENTS.GAME_STATE, (state: ClientGameState) => {
      useGameStore.getState().setGameState(state);
    });

    socket.on(SOCKET_EVENTS.GAME_ERROR, (data: { error: string }) => {
      useGameStore.getState().setError(data.error);
    });

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg) => {
      useGameStore.getState().addChatMessage(msg);
    });

    socket.on(SOCKET_EVENTS.MATCHMAKING_MATCHED, (room: RoomInfo) => {
      useGameStore.getState().setRoom(room);
      useGameStore.getState().setMatchmaking(false);
    });

    socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, () => {
      // Room update will follow
    });

    socket.on(SOCKET_EVENTS.GAME_END, () => {
      // Handled via game state
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = getPlayerAuth();
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function createRoom(isPublic = false, settings?: Record<string, unknown>) {
  return new Promise<{ success: boolean; room?: RoomInfo; error?: string }>((resolve) => {
    const s = connectSocket();
    s.emit(SOCKET_EVENTS.ROOM_CREATE, { isPublic, settings }, resolve);
  });
}

export function joinRoom(code: string) {
  return new Promise<{ success: boolean; room?: RoomInfo; error?: string }>((resolve) => {
    const s = connectSocket();
    s.emit(SOCKET_EVENTS.ROOM_JOIN, { code }, resolve);
  });
}

export function leaveRoom() {
  const s = getSocket();
  s.emit(SOCKET_EVENTS.ROOM_LEAVE);
  useGameStore.getState().reset();
}

export function setReady(isReady: boolean) {
  getSocket().emit(SOCKET_EVENTS.PLAYER_READY, { isReady });
}

export function startGame() {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    getSocket().emit(SOCKET_EVENTS.GAME_START, resolve);
  });
}

export function playCard(cardId: string, chosenColor?: string) {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    getSocket().emit(SOCKET_EVENTS.GAME_PLAY, { cardId, chosenColor }, resolve);
  });
}

export function drawCard() {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    getSocket().emit(SOCKET_EVENTS.GAME_DRAW, resolve);
  });
}

export function callUno() {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    getSocket().emit(SOCKET_EVENTS.GAME_CALL_UNO, resolve);
  });
}

export function challengeWild() {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    getSocket().emit(SOCKET_EVENTS.GAME_CHALLENGE, resolve);
  });
}

export function sendChat(text: string) {
  getSocket().emit(SOCKET_EVENTS.CHAT_SEND, { text });
}

export function joinMatchmaking(playerCount: number) {
  return new Promise<{ success: boolean; waiting?: boolean; matched?: boolean; room?: RoomInfo }>((resolve) => {
    useGameStore.getState().setMatchmaking(true);
    getSocket().emit(SOCKET_EVENTS.MATCHMAKING_JOIN, { playerCount }, resolve);
  });
}

export function leaveMatchmaking() {
  useGameStore.getState().setMatchmaking(false);
  getSocket().emit(SOCKET_EVENTS.MATCHMAKING_LEAVE);
}

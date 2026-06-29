import type { Color } from './types';

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

export const COLOR_HEX: Record<Color, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
};

export const CARDS_PER_PLAYER = 7;
export const UNO_PENALTY_CARDS = 2;
export const ROOM_CODE_LENGTH = 6;
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

export const AVATAR_OPTIONS = [
  '🎮', '🃏', '👑', '⭐', '🔥', '💎', '🎯', '🚀',
  '🌟', '🎪', '🎨', '🦊', '🐯', '🐸', '🦄', '🐙',
];

export const SOCKET_EVENTS = {
  // Room
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATED: 'room:updated',
  ROOM_ERROR: 'room:error',
  // Matchmaking
  MATCHMAKING_JOIN: 'matchmaking:join',
  MATCHMAKING_LEAVE: 'matchmaking:leave',
  MATCHMAKING_MATCHED: 'matchmaking:matched',
  // Game
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_PLAY: 'game:play',
  GAME_DRAW: 'game:draw',
  GAME_CALL_UNO: 'game:call_uno',
  GAME_CHALLENGE: 'game:challenge',
  GAME_PASS: 'game:pass',
  GAME_END: 'game:end',
  GAME_ERROR: 'game:error',
  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_SEND: 'chat:send',
  // Player
  PLAYER_READY: 'player:ready',
  PLAYER_RECONNECT: 'player:reconnect',
  PLAYER_DISCONNECTED: 'player:disconnected',
} as const;

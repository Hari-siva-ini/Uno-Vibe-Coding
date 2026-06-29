/** Core type definitions shared between client and server */

export type Color = 'red' | 'blue' | 'green' | 'yellow';
export type WildColor = Color | 'wild';
export type CardType =
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw_two'
  | 'wild'
  | 'wild_draw_four';

export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'single' | 'local' | 'online' | 'practice';
export type GameStatus = 'waiting' | 'playing' | 'round_end' | 'finished';
export type PlayerType = 'human' | 'ai';

export interface Card {
  id: string;
  color: WildColor;
  type: CardType;
  /** 0–9 for number cards */
  value?: number;
}

export interface HouseRules {
  stackDrawTwo: boolean;
  stackDrawFour: boolean;
  jumpIn: boolean;
  sevenSwap: boolean;
  zeroRotation: boolean;
  progressiveDraw: boolean;
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  stackDrawTwo: false,
  stackDrawFour: false,
  jumpIn: false,
  sevenSwap: false,
  zeroRotation: false,
  progressiveDraw: false,
};

export interface Player {
  id: string;
  name: string;
  avatar: string;
  type: PlayerType;
  hand: Card[];
  isReady: boolean;
  isConnected: boolean;
  hasCalledUno: boolean;
  unoPenaltyPending: boolean;
  score: number;
  /** AI difficulty when type is 'ai' */
  aiDifficulty?: AIDifficulty;
  /** Seat order index */
  seatIndex: number;
}

export interface GameSettings {
  maxPlayers: number;
  aiCount: number;
  aiDifficulty: AIDifficulty;
  houseRules: HouseRules;
  practiceMode: boolean;
  timerEnabled: boolean;
  timerSeconds: number;
  hintsEnabled: boolean;
}

export interface GameState {
  id: string;
  roomCode?: string;
  mode: GameMode;
  status: GameStatus;
  settings: GameSettings;
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  discardPile: Card[];
  drawPile: Card[];
  /** Active color after wild plays */
  currentColor: Color;
  /** Accumulated draw penalty (+2/+4 stacking) */
  pendingDraw: number;
  /** Last played card type for special handling */
  lastPlayedType?: CardType;
  /** Player who must respond to +4 challenge */
  wildDrawFourPlayerId?: string;
  winnerId?: string;
  roundNumber: number;
  turnStartedAt?: number;
  hostId: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface RoomInfo {
  code: string;
  hostId: string;
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    isReady: boolean;
    isConnected: boolean;
  }>;
  settings: GameSettings;
  isPublic: boolean;
  status: 'lobby' | 'playing' | 'finished';
}

/** Client-visible state — hands hidden for opponents */
export interface ClientGameState extends Omit<GameState, 'players'> {
  players: Array<
    Omit<Player, 'hand'> & {
      handCount: number;
      hand?: Card[];
    }
  >;
  myPlayerId: string;
}

export interface PlayCardAction {
  cardId: string;
  chosenColor?: Color;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  highestStreak: number;
  currentStreak: number;
  averageScore: number;
  favoriteColor?: Color;
  totalPlayTime: number;
}

export const ACHIEVEMENT_IDS = [
  'first_win',
  'wins_100',
  'uno_master',
  'lucky_winner',
  'perfect_game',
  'card_collector',
  'champion',
] as const;

export type AchievementId = typeof ACHIEVEMENT_IDS[number];

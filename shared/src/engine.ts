import type {
  Card,
  Color,
  GameSettings,
  GameState,
  Player,
  PlayCardAction,
  AIDifficulty,
  GameMode,
} from './types';
import { DEFAULT_HOUSE_RULES } from './types';
import {
  CARDS_PER_PLAYER,
  COLORS,
} from './constants';
import {
  createDeck,
  shuffleDeck,
  pickStartingCard,
  reshuffleDiscardIntoDraw,
  generateCardId,
} from './deck';
import {
  canPlayCard,
  getPlayableCards,
  getNextPlayerIndex,
  hasColorInHand,
  applyUnoPenalty,
  calculateRoundScore,
} from './rules';

/** Create default game settings */
export function createDefaultSettings(
  overrides: Partial<GameSettings> = {}
): GameSettings {
  return {
    maxPlayers: 4,
    aiCount: 0,
    aiDifficulty: 'medium',
    houseRules: { ...DEFAULT_HOUSE_RULES },
    practiceMode: false,
    timerEnabled: true,
    timerSeconds: 30,
    hintsEnabled: false,
    ...overrides,
  };
}

/** Create a new player */
export function createPlayer(
  id: string,
  name: string,
  seatIndex: number,
  type: 'human' | 'ai' = 'human',
  avatar = '🎮',
  aiDifficulty?: AIDifficulty
): Player {
  return {
    id,
    name,
    avatar,
    type,
    hand: [],
    isReady: type === 'ai',
    isConnected: true,
    hasCalledUno: false,
    unoPenaltyPending: false,
    score: 0,
    aiDifficulty,
    seatIndex,
  };
}

/** Initialize a new game state */
export function createGameState(
  id: string,
  hostId: string,
  players: Player[],
  mode: GameMode,
  settings: GameSettings,
  roomCode?: string
): GameState {
  return {
    id,
    roomCode,
    mode,
    status: 'waiting',
    settings,
    players,
    currentPlayerIndex: 0,
    direction: 1,
    discardPile: [],
    drawPile: [],
    currentColor: 'red',
    pendingDraw: 0,
    roundNumber: 1,
    hostId,
    messages: [],
  };
}

/** Start the game — shuffle, deal, pick starting card */
export function startGame(state: GameState): GameState {
  const deck = shuffleDeck(createDeck());
  const { startCard, remaining } = pickStartingCard(deck);

  let drawPile = remaining;
  const players = state.players.map((p) => ({ ...p, hand: [] as Card[], hasCalledUno: false }));

  // Deal cards
  for (let round = 0; round < CARDS_PER_PLAYER; round++) {
    for (const player of players) {
      if (drawPile.length === 0) break;
      player.hand.push(drawPile.pop()!);
    }
  }

  // Handle starting card special effects
  let direction: 1 | -1 = 1;
  let currentPlayerIndex = Math.floor(Math.random() * players.length);
  let pendingDraw = 0;
  let currentColor: Color = startCard.color === 'wild' ? COLORS[0] : startCard.color;

  if (startCard.type === 'reverse') {
    if (players.length === 2) {
      currentPlayerIndex = getNextPlayerIndex(currentPlayerIndex, players.length, 1, true);
    } else {
      direction = -1;
    }
  } else if (startCard.type === 'skip') {
    currentPlayerIndex = getNextPlayerIndex(currentPlayerIndex, players.length, 1, true);
  } else if (startCard.type === 'draw_two') {
    pendingDraw = 2;
    currentPlayerIndex = getNextPlayerIndex(currentPlayerIndex, players.length, 1);
  }

  return {
    ...state,
    status: 'playing',
    players,
    discardPile: [startCard],
    drawPile,
    currentColor,
    currentPlayerIndex,
    direction,
    pendingDraw,
    turnStartedAt: Date.now(),
    winnerId: undefined,
    wildDrawFourPlayerId: undefined,
  };
}

/** Draw cards from pile (with reshuffle if needed) */
function drawFromPile(state: GameState, count: number): {
  state: GameState;
  drawn: Card[];
} {
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      const reshuffled = reshuffleDiscardIntoDraw(discardPile, drawPile);
      discardPile = reshuffled.discardPile;
      drawPile = reshuffled.drawPile;
    }
    if (drawPile.length === 0) break;
    drawn.push(drawPile.pop()!);
  }

  return {
    state: { ...state, drawPile, discardPile },
    drawn,
  };
}

/** Execute draw action for current player */
export function drawCards(state: GameState, playerId: string, count?: number): {
  state: GameState;
  error?: string;
  drawn?: Card[];
} {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { state, error: 'Player not found' };
  if (state.status !== 'playing') return { state, error: 'Game not in progress' };
  if (playerIndex !== state.currentPlayerIndex) return { state, error: 'Not your turn' };

  const drawCount = count ?? (state.pendingDraw > 0 ? state.pendingDraw : 1);
  let newState = { ...state };
  const { state: afterDraw, drawn } = drawFromPile(newState, drawCount);

  const players = [...afterDraw.players];
  players[playerIndex] = {
    ...players[playerIndex],
    hand: [...players[playerIndex].hand, ...drawn],
    hasCalledUno: false,
  };

  // Clear pending draw and advance turn
  const nextIndex = getNextPlayerIndex(
    playerIndex,
    players.length,
    afterDraw.direction
  );

  return {
    state: {
      ...afterDraw,
      players,
      pendingDraw: 0,
      currentPlayerIndex: nextIndex,
      turnStartedAt: Date.now(),
      wildDrawFourPlayerId: undefined,
    },
    drawn,
  };
}

/** Play a card */
export function playCard(
  state: GameState,
  playerId: string,
  action: PlayCardAction
): { state: GameState; error?: string } {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { state, error: 'Player not found' };
  if (state.status !== 'playing') return { state, error: 'Game not in progress' };
  if (playerIndex !== state.currentPlayerIndex) return { state, error: 'Not your turn' };

  const player = state.players[playerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === action.cardId);
  if (cardIndex === -1) return { state, error: 'Card not in hand' };

  const card = player.hand[cardIndex];
  const validation = canPlayCard(card, player.hand, state);
  if (!validation.valid) return { state, error: validation.reason };

  // Remove card from hand
  const newHand = player.hand.filter((c) => c.id !== action.cardId);
  let players = [...state.players];
  players[playerIndex] = {
    ...player,
    hand: newHand,
    hasCalledUno: newHand.length === 1 ? player.hasCalledUno : false,
    unoPenaltyPending: newHand.length === 1 && !player.hasCalledUno,
  };

  let direction = state.direction;
  let pendingDraw = state.pendingDraw;
  let currentColor = state.currentColor;
  let skipNext = false;
  let wildDrawFourPlayerId: string | undefined = undefined;

  // Set color for wild cards
  if (card.type === 'wild' || card.type === 'wild_draw_four') {
    currentColor = action.chosenColor ?? COLORS[Math.floor(Math.random() * COLORS.length)];
    if (card.type === 'wild_draw_four') {
      wildDrawFourPlayerId = playerId;
    }
  } else {
    currentColor = card.color as Color;
  }

  // Apply card effects
  switch (card.type) {
    case 'skip':
      skipNext = true;
      break;
    case 'reverse':
      if (players.length === 2) {
        skipNext = true;
      } else {
        direction = (direction * -1) as 1 | -1;
      }
      break;
    case 'draw_two':
      pendingDraw += 2;
      break;
    case 'wild_draw_four':
      pendingDraw += 4;
      break;
    case 'number':
      if (state.settings.houseRules.zeroRotation && card.value === 0) {
        direction = (direction * -1) as 1 | -1;
      }
      if (state.settings.houseRules.sevenSwap && card.value === 7) {
        // Hand swap handled separately — flag for UI
      }
      break;
  }

  // Stack handling for draw two/four
  if (state.pendingDraw > 0 && (card.type === 'draw_two' || card.type === 'wild_draw_four')) {
    pendingDraw = state.pendingDraw + (card.type === 'draw_two' ? 2 : 4);
  }

  const discardPile = [...state.discardPile, card];

  // Check win
  if (newHand.length === 0) {
    const winner = players[playerIndex];
    const opponents = players.filter((p) => p.id !== playerId);
    const roundScore = calculateRoundScore(winner, opponents);
    players[playerIndex] = { ...winner, score: winner.score + roundScore };

    return {
      state: {
        ...state,
        players,
        discardPile,
        direction,
        pendingDraw: 0,
        currentColor,
        status: 'round_end',
        winnerId: playerId,
        lastPlayedType: card.type,
        wildDrawFourPlayerId: undefined,
      },
    };
  }

  const nextIndex = getNextPlayerIndex(
    playerIndex,
    players.length,
    direction,
    skipNext
  );

  return {
    state: {
      ...state,
      players,
      discardPile,
      direction,
      pendingDraw,
      currentColor,
      currentPlayerIndex: nextIndex,
      lastPlayedType: card.type,
      turnStartedAt: Date.now(),
      wildDrawFourPlayerId,
    },
  };
}

/** Call UNO */
export function callUno(state: GameState, playerId: string): {
  state: GameState;
  error?: string;
} {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { state, error: 'Player not found' };

  const player = state.players[playerIndex];
  if (player.hand.length !== 1) return { state, error: 'Must have exactly 1 card to call UNO' };

  const players = [...state.players];
  players[playerIndex] = {
    ...player,
    hasCalledUno: true,
    unoPenaltyPending: false,
  };

  return { state: { ...state, players } };
}

/** Challenge Wild Draw Four */
export function challengeWildDrawFour(
  state: GameState,
  challengerId: string
): { state: GameState; error?: string; success?: boolean } {
  if (!state.wildDrawFourPlayerId) return { state, error: 'No challenge available' };

  const challengerIndex = state.players.findIndex((p) => p.id === challengerId);
  if (challengerIndex === -1) return { state, error: 'Player not found' };

  const offender = state.players.find((p) => p.id === state.wildDrawFourPlayerId);
  if (!offender) return { state, error: 'Offender not found' };

  const topCard = state.discardPile[state.discardPile.length - 1];
  const challengedColor = state.currentColor;

  // Check if offender had matching color when they played +4
  const hadMatchingColor = offender.hand.some(
    (c) => c.color === challengedColor && c.type !== 'wild' && c.type !== 'wild_draw_four'
  );

  // We need to check hand BEFORE the play — use discard pile context
  // If offender still has cards of that color in current hand, challenge succeeds
  const challengeSuccess = hasColorInHand(
    offender.hand.filter((c) => c.id !== topCard.id),
    challengedColor
  ) || hadMatchingColor;

  if (challengeSuccess) {
    // Offender draws 4 instead of challenger
    const offenderIndex = state.players.findIndex((p) => p.id === state.wildDrawFourPlayerId);
    const { state: afterDraw, drawn } = drawFromPile(state, 4);
    const players = [...afterDraw.players];
    players[offenderIndex] = {
      ...players[offenderIndex],
      hand: [...players[offenderIndex].hand, ...drawn],
    };
    return {
      state: {
        ...afterDraw,
        players,
        pendingDraw: 0,
        wildDrawFourPlayerId: undefined,
      },
      success: true,
    };
  }

  // Challenge failed — challenger draws 6 (4+2 penalty)
  const { state: afterDraw, drawn } = drawFromPile(state, 6);
  const players = [...afterDraw.players];
  players[challengerIndex] = {
    ...players[challengerIndex],
    hand: [...players[challengerIndex].hand, ...drawn],
  };

  return {
    state: {
      ...afterDraw,
      players,
      pendingDraw: 0,
      wildDrawFourPlayerId: undefined,
    },
    success: false,
  };
}

/** Penalize player who forgot UNO */
export function penalizeForgottenUno(
  state: GameState,
  targetPlayerId: string,
  reporterId: string
): { state: GameState; error?: string } {
  const targetIndex = state.players.findIndex((p) => p.id === targetPlayerId);
  if (targetIndex === -1) return { state, error: 'Player not found' };

  const target = state.players[targetIndex];
  if (!target.unoPenaltyPending) return { state, error: 'No UNO penalty pending' };
  if (target.id === reporterId) return { state, error: 'Cannot report yourself' };

  const { player, drawPile, drawn } = applyUnoPenalty(target, state.drawPile);
  const players = [...state.players];
  players[targetIndex] = player;

  return { state: { ...state, players, drawPile } };
}

/** Start next round */
export function startNextRound(state: GameState): GameState {
  if (state.status !== 'round_end') return state;

  const deck = shuffleDeck(createDeck());
  const { startCard, remaining } = pickStartingCard(deck);
  let drawPile = remaining;

  const players = state.players.map((p) => ({
    ...p,
    hand: [] as Card[],
    hasCalledUno: false,
    unoPenaltyPending: false,
  }));

  for (let round = 0; round < CARDS_PER_PLAYER; round++) {
    for (const player of players) {
      if (drawPile.length === 0) break;
      player.hand.push(drawPile.pop()!);
    }
  }

  const winnerIndex = state.players.findIndex((p) => p.id === state.winnerId);
  const currentPlayerIndex =
    winnerIndex >= 0
      ? getNextPlayerIndex(winnerIndex, players.length, 1)
      : Math.floor(Math.random() * players.length);

  return {
    ...state,
    status: 'playing',
    players,
    discardPile: [startCard],
    drawPile,
    currentColor: startCard.color === 'wild' ? COLORS[0] : startCard.color,
    currentPlayerIndex,
    direction: 1,
    pendingDraw: 0,
    roundNumber: state.roundNumber + 1,
    winnerId: undefined,
    turnStartedAt: Date.now(),
    wildDrawFourPlayerId: undefined,
  };
}

/** Check if game tournament is finished (first to 500 points) */
export function checkTournamentEnd(state: GameState): boolean {
  return state.players.some((p) => p.score >= 500);
}

/** Generate room code */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Setup single player game with AI */
export function setupSinglePlayerGame(
  humanId: string,
  humanName: string,
  aiCount: number,
  difficulty: AIDifficulty,
  settings?: Partial<GameSettings>
): GameState {
  const gameSettings = createDefaultSettings({
    ...settings,
    aiCount,
    aiDifficulty: difficulty,
    maxPlayers: aiCount + 1,
    practiceMode: settings?.practiceMode ?? false,
  });

  const players: Player[] = [
    createPlayer(humanId, humanName, 0, 'human'),
  ];

  for (let i = 0; i < aiCount; i++) {
    players.push(
      createPlayer(
        `ai_${i}_${generateCardId()}`,
        `AI ${i + 1}`,
        i + 1,
        'ai',
        '🤖',
        difficulty
      )
    );
  }

  const state = createGameState(
    `game_${Date.now()}`,
    humanId,
    players,
    settings?.practiceMode ? 'practice' : 'single',
    gameSettings
  );

  return startGame(state);
}

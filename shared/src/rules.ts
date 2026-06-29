import type { Card, Color, GameState, HouseRules, Player } from './types';
import { UNO_PENALTY_CARDS } from './constants';
import { cardsMatch, getCardColor } from './deck';

/**
 * Check if a player has any card matching the given color (for +4 validation).
 */
export function hasColorInHand(hand: Card[], color: Color): boolean {
  return hand.some(
    (c) => c.color === color || c.color === 'wild' || c.type === 'wild_draw_four'
  );
}

/**
 * Validate Wild Draw Four — player must have no cards of current color.
 */
export function canPlayWildDrawFour(
  hand: Card[],
  currentColor: Color
): boolean {
  return !hand.some(
    (c) =>
      c.color === currentColor &&
      c.type !== 'wild' &&
      c.type !== 'wild_draw_four'
  );
}

/**
 * Get all cards a player can legally play.
 */
export function getPlayableCards(
  hand: Card[],
  topCard: Card,
  currentColor: Color,
  pendingDraw: number,
  houseRules: HouseRules
): Card[] {
  if (pendingDraw > 0) {
    // Must draw or stack if house rules allow
    if (houseRules.stackDrawTwo && pendingDraw % 2 === 0) {
      return hand.filter((c) => c.type === 'draw_two' || c.type === 'wild_draw_four');
    }
    if (houseRules.stackDrawFour && pendingDraw % 4 === 0) {
      return hand.filter((c) => c.type === 'wild_draw_four');
    }
    return [];
  }

  return hand.filter((c) => cardsMatch(c, topCard, currentColor));
}

/**
 * Check if a specific card can be played.
 */
export function canPlayCard(
  card: Card,
  hand: Card[],
  state: GameState
): { valid: boolean; reason?: string } {
  const topCard = state.discardPile[state.discardPile.length - 1];
  const playable = getPlayableCards(
    hand,
    topCard,
    state.currentColor,
    state.pendingDraw,
    state.settings.houseRules
  );

  if (!playable.find((c) => c.id === card.id)) {
    return { valid: false, reason: 'Card cannot be played' };
  }

  if (card.type === 'wild_draw_four') {
    if (!canPlayWildDrawFour(hand, state.currentColor)) {
      return { valid: false, reason: 'Wild Draw Four requires no matching color cards' };
    }
  }

  return { valid: true };
}

/**
 * Apply UNO penalty to a player who forgot to call UNO.
 */
export function applyUnoPenalty(player: Player, drawPile: Card[]): {
  player: Player;
  drawPile: Card[];
  drawn: Card[];
} {
  const drawn: Card[] = [];
  const pile = [...drawPile];
  for (let i = 0; i < UNO_PENALTY_CARDS && pile.length > 0; i++) {
    drawn.push(pile.pop()!);
  }
  return {
    player: {
      ...player,
      hand: [...player.hand, ...drawn],
      unoPenaltyPending: false,
    },
    drawPile: pile,
    drawn,
  };
}

/**
 * Calculate score from remaining cards in opponents' hands.
 */
export function calculateRoundScore(winner: Player, opponents: Player[]): number {
  let score = 0;
  for (const opp of opponents) {
    for (const card of opp.hand) {
      switch (card.type) {
        case 'number':
          score += card.value ?? 0;
          break;
        case 'skip':
        case 'reverse':
        case 'draw_two':
          score += 20;
          break;
        case 'wild':
        case 'wild_draw_four':
          score += 50;
          break;
      }
    }
  }
  return score;
}

/**
 * Get next player index considering direction and skip.
 */
export function getNextPlayerIndex(
  currentIndex: number,
  playerCount: number,
  direction: 1 | -1,
  skip: boolean = false
): number {
  const step = skip ? 2 * direction : direction;
  return (currentIndex + step + playerCount) % playerCount;
}

/**
 * Filter game state for a specific player (hide opponent hands).
 */
export function filterStateForPlayer(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) => {
      if (p.id === playerId) return p;
      return { ...p, hand: [] };
    }),
  };
}

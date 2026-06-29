import type { Card, Color, GameState, Player, PlayCardAction } from './types';
import { COLORS } from './constants';
import { getPlayableCards } from './rules';
import { callUno, drawCards, playCard } from './engine';

/**
 * AI opponent logic with three difficulty levels.
 */

function buildPlayAction(card: Card, chosenColor?: Color): PlayCardAction {
  if (card.type === 'wild' || card.type === 'wild_draw_four') {
    return {
      cardId: card.id,
      chosenColor: chosenColor ?? COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }
  return { cardId: card.id };
}

function pickBestColor(hand: Card[]): Color {
  const counts: Record<Color, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const card of hand) {
    if (card.color !== 'wild') counts[card.color]++;
  }
  return COLORS.reduce((best, c) => (counts[c] > counts[best] ? c : best), COLORS[0]);
}

function easyMove(
  hand: Card[],
  topCard: Card,
  currentColor: Color,
  pendingDraw: number,
  houseRules: GameState['settings']['houseRules']
): PlayCardAction | 'draw' {
  const playable = getPlayableCards(hand, topCard, currentColor, pendingDraw, houseRules);
  if (playable.length === 0) return 'draw';
  return buildPlayAction(playable[Math.floor(Math.random() * playable.length)]);
}

function mediumMove(
  hand: Card[],
  topCard: Card,
  currentColor: Color,
  pendingDraw: number,
  houseRules: GameState['settings']['houseRules']
): PlayCardAction | 'draw' {
  const playable = getPlayableCards(hand, topCard, currentColor, pendingDraw, houseRules);
  if (playable.length === 0) return 'draw';

  const numbers = playable.filter((c) => c.type === 'number');
  if (numbers.length > 0) {
    const matching = numbers.filter((c) => c.color === currentColor);
    return buildPlayAction(matching.length > 0 ? matching[0] : numbers[0]);
  }

  const specials = playable.filter((c) => c.type !== 'wild' && c.type !== 'wild_draw_four');
  if (specials.length > 0) return buildPlayAction(specials[0]);
  return buildPlayAction(playable[0]);
}

function hardMove(
  hand: Card[],
  topCard: Card,
  currentColor: Color,
  pendingDraw: number,
  houseRules: GameState['settings']['houseRules'],
  opponents: Player[]
): PlayCardAction | 'draw' {
  const playable = getPlayableCards(hand, topCard, currentColor, pendingDraw, houseRules);
  if (playable.length === 0) return 'draw';

  const dangerOpponent = opponents.find((p) => p.hand.length === 1);
  if (dangerOpponent) {
    const blockers = playable.filter(
      (c) => c.type === 'skip' || c.type === 'draw_two' || c.type === 'wild_draw_four'
    );
    if (blockers.length > 0) {
      return buildPlayAction(blockers[0], pickBestColor(hand));
    }
  }

  const nonWild = playable.filter((c) => c.type !== 'wild' && c.type !== 'wild_draw_four');
  if (nonWild.length > 0) {
    const colorMatch = nonWild.filter((c) => c.color === currentColor);
    return buildPlayAction(colorMatch.length > 0 ? colorMatch[0] : nonWild[0]);
  }

  const wilds = playable.filter((c) => c.type === 'wild' || c.type === 'wild_draw_four');
  if (wilds.length > 0) {
    const preferred = wilds.find((c) => c.type === 'wild_draw_four') ?? wilds[0];
    return buildPlayAction(preferred, pickBestColor(hand));
  }

  return buildPlayAction(playable[0]);
}

/** Get AI move for current player */
export function getAIMove(
  state: GameState,
  playerId: string
): PlayCardAction | 'draw' | 'call_uno' {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.type !== 'ai') return 'draw';

  if (player.hand.length === 1 && !player.hasCalledUno) return 'call_uno';

  const topCard = state.discardPile[state.discardPile.length - 1];
  const difficulty = player.aiDifficulty ?? 'medium';
  const opponents = state.players.filter((p) => p.id !== playerId);

  switch (difficulty) {
    case 'easy':
      return easyMove(player.hand, topCard, state.currentColor, state.pendingDraw, state.settings.houseRules);
    case 'medium':
      return mediumMove(player.hand, topCard, state.currentColor, state.pendingDraw, state.settings.houseRules);
    case 'hard':
      return hardMove(player.hand, topCard, state.currentColor, state.pendingDraw, state.settings.houseRules, opponents);
    default:
      return mediumMove(player.hand, topCard, state.currentColor, state.pendingDraw, state.settings.houseRules);
  }
}

/** Process AI turns until human turn or game ends */
export function processAITurns(state: GameState): GameState {
  let current = state;
  let safety = 0;

  while (safety < 20) {
    safety++;
    const currentPlayer = current.players[current.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== 'ai') break;
    if (current.status !== 'playing') break;

    const move = getAIMove(current, currentPlayer.id);

    if (move === 'call_uno') {
      current = callUno(current, currentPlayer.id).state;
      continue;
    }

    if (move === 'draw') {
      const result = drawCards(current, currentPlayer.id);
      if (result.error) break;
      current = result.state;
      continue;
    }

    const result = playCard(current, currentPlayer.id, move);
    if (result.error) {
      current = drawCards(current, currentPlayer.id).state;
    } else {
      current = result.state;
    }

    if (current.status === 'round_end') break;
  }

  return current;
}

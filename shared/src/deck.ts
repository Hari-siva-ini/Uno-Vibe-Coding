import type { Card, Color } from './types';
import { COLORS } from './constants';

let cardIdCounter = 0;

/** Generate a unique card ID */
export function generateCardId(): string {
  return `card_${++cardIdCounter}_${Date.now().toString(36)}`;
}

/** Reset card ID counter (for tests) */
export function resetCardIdCounter(): void {
  cardIdCounter = 0;
}

/** Create a standard 108-card UNO deck */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of COLORS) {
    // One 0 per color
    deck.push({ id: generateCardId(), color, type: 'number', value: 0 });

    // Two of each 1–9 per color
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 2; i++) {
        deck.push({ id: generateCardId(), color, type: 'number', value });
      }
    }

    // Two of each special per color
    for (const type of ['skip', 'reverse', 'draw_two'] as const) {
      for (let i = 0; i < 2; i++) {
        deck.push({ id: generateCardId(), color, type });
      }
    }
  }

  // Four wild and four wild draw four
  for (let i = 0; i < 4; i++) {
    deck.push({ id: generateCardId(), color: 'wild', type: 'wild' });
    deck.push({ id: generateCardId(), color: 'wild', type: 'wild_draw_four' });
  }

  return deck;
}

/** Fisher-Yates shuffle */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Find first non-special card to start the game */
export function pickStartingCard(deck: Card[]): { startCard: Card; remaining: Card[] } {
  const remaining = [...deck];
  let startIndex = remaining.findIndex(
    (c) => c.type === 'number' || c.type === 'reverse' || c.type === 'skip'
  );
  if (startIndex === -1) startIndex = 0;

  const startCard = remaining[startIndex];
  remaining.splice(startIndex, 1);
  return { startCard, remaining };
}

/** Reshuffle discard pile into draw pile (leave top card) */
export function reshuffleDiscardIntoDraw(
  discardPile: Card[],
  drawPile: Card[]
): { discardPile: Card[]; drawPile: Card[] } {
  if (discardPile.length <= 1) return { discardPile, drawPile };

  const topCard = discardPile[discardPile.length - 1];
  const toShuffle = discardPile.slice(0, -1);
  const newDraw = shuffleDeck([...drawPile, ...toShuffle]);
  return { discardPile: [topCard], drawPile: newDraw };
}

/** Get effective color of a card on the discard pile */
export function getCardColor(card: Card, currentColor: Color): Color {
  if (card.color === 'wild') return currentColor;
  return card.color;
}

/** Check if two cards match for play */
export function cardsMatch(
  card: Card,
  topCard: Card,
  currentColor: Color
): boolean {
  if (card.type === 'wild' || card.type === 'wild_draw_four') return true;
  if (card.color === currentColor) return true;
  if (topCard.type === 'number' && card.type === 'number' && card.value === topCard.value) {
    return true;
  }
  if (card.type !== 'number' && card.type === topCard.type) return true;
  return false;
}

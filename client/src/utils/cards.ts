import type { Card, Color } from '@uno/shared';
import { COLOR_HEX } from '@uno/shared';

export function getCardLabel(card: Card): string {
  if (card.type === 'number') return String(card.value);
  switch (card.type) {
    case 'skip': return '⊘';
    case 'reverse': return '↺';
    case 'draw_two': return '+2';
    case 'wild': return 'W';
    case 'wild_draw_four': return '+4';
    default: return '';
  }
}

export function getCardColorClass(card: Card): string {
  if (card.color === 'wild') return 'from-purple-600 to-indigo-700';
  const map: Record<Color, string> = {
    red: 'from-red-500 to-red-700',
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    yellow: 'from-yellow-400 to-yellow-600',
  };
  return map[card.color] ?? 'from-gray-500 to-gray-700';
}

export function getCardBorderColor(card: Card): string {
  if (card.color === 'wild') return '#8b5cf6';
  return COLOR_HEX[card.color as Color] ?? '#64748b';
}

export function formatWinRate(wins: number, games: number): string {
  if (games === 0) return '0%';
  return `${((wins / games) * 100).toFixed(1)}%`;
}

import { useState } from 'react';
import type { Card as CardType, Color, ClientGameState } from '@uno/shared';
import { getPlayableCards } from '@uno/shared';
import { Card } from '../cards/Card';
import { ColorPicker } from './ColorPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';

interface PlayerHandProps {
  gameState: ClientGameState;
  onPlayCard: (cardId: string, color?: Color) => void;
  onDraw: () => void;
  onCallUno: () => void;
  isMyTurn: boolean;
}

export function PlayerHand({
  gameState,
  onPlayCard,
  onDraw,
  onCallUno,
  isMyTurn,
}: PlayerHandProps) {
  const [pendingWild, setPendingWild] = useState<CardType | null>(null);
  const { hintsEnabled } = gameState.settings;
  const { animations } = useSettingsStore();

  const myPlayer = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const hand = myPlayer?.hand ?? [];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const playableCards = isMyTurn
    ? getPlayableCards(
        hand,
        topCard,
        gameState.currentColor,
        gameState.pendingDraw,
        gameState.settings.houseRules
      )
    : [];

  const playableIds = new Set(playableCards.map((c) => c.id));

  const handleCardClick = (card: CardType) => {
    if (!isMyTurn) return;
    if (!playableIds.has(card.id)) return;

    if (card.type === 'wild' || card.type === 'wild_draw_four') {
      setPendingWild(card);
    } else {
      onPlayCard(card.id);
    }
  };

  const handleColorSelect = (color: Color) => {
    if (pendingWild) {
      onPlayCard(pendingWild.id, color);
      setPendingWild(null);
    }
  };

  // Fan layout calculation
  const maxRotation = Math.min(hand.length * 3, 30);
  const startAngle = -maxRotation / 2;

  return (
    <div className="relative w-full flex flex-col items-center gap-4 pb-4">
      <AnimatePresence>
        {pendingWild && (
          <ColorPicker
            onSelect={handleColorSelect}
            onCancel={() => setPendingWild(null)}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {hand.length === 1 && !myPlayer?.hasCalledUno && isMyTurn && (
          <motion.button
            type="button"
            className="btn-uno"
            onClick={onCallUno}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            UNO!
          </motion.button>
        )}
        {isMyTurn && (
          <button type="button" className="btn-secondary" onClick={onDraw}>
            Draw Card
          </button>
        )}
      </div>

      {/* Hand fan */}
      <div className="flex items-end justify-center h-32 sm:h-36 px-4 overflow-x-auto max-w-full">
        <div className="flex items-end" style={{ perspective: '1000px' }}>
          {hand.map((card, i) => {
            const angle = hand.length > 1
              ? startAngle + (maxRotation / (hand.length - 1)) * i
              : 0;
            const playable = playableIds.has(card.id);
            const showHint = hintsEnabled && playable;

            return (
              <motion.div
                key={card.id}
                className="relative"
                style={{
                  transform: `rotate(${angle}deg)`,
                  marginLeft: i > 0 ? '-12px' : '0',
                  zIndex: i,
                }}
                whileHover={animations ? { y: -20, zIndex: 100 } : undefined}
              >
                <Card
                  card={card}
                  index={i}
                  playable={playable || showHint}
                  onClick={() => handleCardClick(card)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {hand.length === 0 && (
        <p className="text-slate-400 text-sm">No cards in hand</p>
      )}
    </div>
  );
}

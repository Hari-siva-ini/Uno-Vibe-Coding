import { motion } from 'framer-motion';
import type { Card as CardType } from '@uno/shared';
import { getCardLabel, getCardColorClass } from '../utils/cards';
import { cardVariants } from '../animations/variants';
import { useSettingsStore } from '../store/settingsStore';

interface CardProps {
  card: CardType;
  index?: number;
  playable?: boolean;
  selected?: boolean;
  faceDown?: boolean;
  small?: boolean;
  onClick?: () => void;
  onPlay?: () => void;
}

export function Card({
  card,
  index = 0,
  playable = false,
  selected = false,
  faceDown = false,
  small = false,
  onClick,
}: CardProps) {
  const { animations, colorBlindMode } = useSettingsStore();
  const size = small ? 'w-12 h-16 sm:w-14 sm:h-20' : 'w-16 h-24 sm:w-20 sm:h-28';

  if (faceDown) {
    return (
      <motion.div
        className={`${size} rounded-lg bg-gradient-to-br from-indigo-800 to-purple-900 border-2 border-white/20 shadow-lg flex items-center justify-center`}
        variants={animations ? cardVariants : undefined}
        custom={index}
        initial={animations ? 'hidden' : false}
        animate={animations ? 'visible' : false}
      >
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
          UNO
        </div>
      </motion.div>
    );
  }

  const colorClass = getCardColorClass(card);
  const colorblindClass = colorBlindMode ? `card-${card.color}` : '';

  return (
    <motion.button
      type="button"
      className={`
        ${size} rounded-lg bg-gradient-to-br ${colorClass} ${colorblindClass}
        border-2 shadow-xl flex flex-col items-center justify-center
        font-display font-bold text-white relative overflow-hidden
        transition-shadow cursor-pointer select-none
        ${playable ? 'ring-2 ring-white/60 animate-pulse-glow' : ''}
        ${selected ? 'ring-4 ring-yellow-400 -translate-y-4' : ''}
        ${playable || onClick ? 'hover:-translate-y-3 hover:shadow-2xl' : ''}
        disabled:cursor-default
      `}
      variants={animations ? cardVariants : undefined}
      custom={index}
      initial={animations ? 'hidden' : false}
      animate={animations ? 'visible' : false}
      whileHover={animations && (playable || onClick) ? 'hover' : undefined}
      whileTap={animations && onClick ? 'tap' : undefined}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${card.color} ${card.type} ${card.value ?? ''}`}
    >
      <div className="absolute inset-0 bg-white/10 rounded-lg" />
      <span className="text-lg sm:text-2xl z-10 drop-shadow-md">
        {getCardLabel(card)}
      </span>
      <span className="text-[10px] sm:text-xs opacity-70 z-10 capitalize">
        {card.color !== 'wild' ? card.color : 'wild'}
      </span>
      {/* Corner marks */}
      <span className="absolute top-1 left-1.5 text-[10px] opacity-80">{getCardLabel(card)}</span>
      <span className="absolute bottom-1 right-1.5 text-[10px] opacity-80 rotate-180">{getCardLabel(card)}</span>
    </motion.button>
  );
}

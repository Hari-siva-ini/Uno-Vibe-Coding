import type { Card as CardType, Color } from '@uno/shared';
import { COLOR_HEX } from '@uno/shared';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';

interface ColorPickerProps {
  onSelect: (color: Color) => void;
  onCancel: () => void;
}

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

export function ColorPicker({ onSelect, onCancel }: ColorPickerProps) {
  const { animations } = useSettingsStore();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass p-8 max-w-sm w-full mx-4"
        initial={animations ? { scale: 0.8, opacity: 0 } : false}
        animate={animations ? { scale: 1, opacity: 1 } : false}
      >
        <h3 className="text-xl font-display font-bold text-center mb-6">
          Choose a Color
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {COLORS.map((color, i) => (
            <motion.button
              key={color}
              type="button"
              className="h-20 rounded-xl font-bold text-white text-lg capitalize shadow-lg"
              style={{ backgroundColor: COLOR_HEX[color] }}
              onClick={() => onSelect(color)}
              initial={animations ? { opacity: 0, y: 20 } : false}
              animate={animations ? { opacity: 1, y: 0 } : false}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {color}
            </motion.button>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary w-full mt-4"
          onClick={onCancel}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

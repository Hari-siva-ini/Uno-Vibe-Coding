import { useEffect } from 'react';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { useSettingsStore } from '../store/settingsStore';
import { DEFAULT_HOUSE_RULES } from '@uno/shared';
import { fadeInUp } from '../animations/variants';
import { motion } from 'framer-motion';

const HOUSE_RULE_LABELS: Record<string, string> = {
  stackDrawTwo: 'Stack Draw Two',
  stackDrawFour: 'Stack Draw Four',
  jumpIn: 'Jump In',
  sevenSwap: 'Seven Swap',
  zeroRotation: 'Zero Rotation',
  progressiveDraw: 'Progressive Draw',
};

export function SettingsPage() {
  const settings = useSettingsStore();
  const { fontSize, colorBlindMode, highContrast, houseRules, setSetting, setHouseRule } = settings;

  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorBlindMode);
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [colorBlindMode, highContrast, fontSize]);

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />
      <main className="pt-24 px-4 pb-8 max-w-2xl mx-auto space-y-6">
        <motion.div className="glass p-6 space-y-4" variants={fadeInUp} initial="hidden" animate="visible">
          <h2 className="font-display font-bold text-xl">Audio</h2>
          {[
            { key: 'sound' as const, label: 'Sound Effects' },
            { key: 'music' as const, label: 'Music' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSetting(key, e.target.checked)}
                className="w-5 h-5 accent-indigo-500"
              />
            </label>
          ))}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => setSetting('volume', parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </motion.div>

        <motion.div className="glass p-6 space-y-4" variants={fadeInUp} initial="hidden" animate="visible">
          <h2 className="font-display font-bold text-xl">Display</h2>
          {[
            { key: 'animations' as const, label: 'Animations' },
            { key: 'colorBlindMode' as const, label: 'Color Blind Mode' },
            { key: 'highContrast' as const, label: 'High Contrast' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSetting(key, e.target.checked)}
                className="w-5 h-5 accent-indigo-500"
              />
            </label>
          ))}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Font Size</label>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`flex-1 py-2 rounded-xl capitalize ${
                    fontSize === size ? 'bg-indigo-600' : 'bg-white/10'
                  }`}
                  onClick={() => setSetting('fontSize', size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div className="glass p-6 space-y-4" variants={fadeInUp} initial="hidden" animate="visible">
          <h2 className="font-display font-bold text-xl">House Rules</h2>
          {(Object.keys(DEFAULT_HOUSE_RULES) as Array<keyof typeof DEFAULT_HOUSE_RULES>).map((key) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span>{HOUSE_RULE_LABELS[key] ?? key}</span>
              <input
                type="checkbox"
                checked={houseRules[key]}
                onChange={(e) => setHouseRule(key, e.target.checked)}
                className="w-5 h-5 accent-indigo-500"
              />
            </label>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

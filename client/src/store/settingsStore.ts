import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HouseRules } from '@uno/shared';
import { DEFAULT_HOUSE_RULES } from '@uno/shared';

interface SettingsState {
  sound: boolean;
  music: boolean;
  darkMode: boolean;
  animations: boolean;
  timer: boolean;
  language: string;
  colorBlindMode: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  volume: number;
  houseRules: HouseRules;
  setSetting: <K extends keyof Omit<SettingsState, 'setSetting' | 'setHouseRule'>>(
    key: K,
    value: SettingsState[K]
  ) => void;
  setHouseRule: (key: keyof HouseRules, value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sound: true,
      music: true,
      darkMode: true,
      animations: true,
      timer: true,
      language: 'en',
      colorBlindMode: false,
      highContrast: false,
      fontSize: 'medium',
      volume: 0.7,
      houseRules: { ...DEFAULT_HOUSE_RULES },
      setSetting: (key, value) => set({ [key]: value }),
      setHouseRule: (key, value) =>
        set((state) => ({
          houseRules: { ...state.houseRules, [key]: value },
        })),
    }),
    { name: 'uno-settings' }
  )
);

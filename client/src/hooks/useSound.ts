import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { soundManager } from '../utils/sound';

export function useSoundInit() {
  const { sound, volume } = useSettingsStore();

  useEffect(() => {
    soundManager.init(sound, volume);
  }, [sound, volume]);
}

export function useKeyboard(
  handlers: Record<string, () => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const handler = handlers[e.key.toLowerCase()];
      if (handler && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers, enabled]);
}

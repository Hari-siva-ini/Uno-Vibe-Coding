import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SocketPlayerState {
  playerId: string;
  setPlayerId: (id: string) => void;
  getOrCreatePlayerId: () => string;
}

export const useSocketPlayerStore = create<SocketPlayerState>()(
  persist(
    (set, get) => ({
      playerId: '',
      setPlayerId: (id) => set({ playerId: id }),
      getOrCreatePlayerId: () => {
        const current = get().playerId;
        if (current) return current;
        const id = `guest_${Math.random().toString(36).slice(2, 10)}`;
        set({ playerId: id });
        return id;
      },
    }),
    { name: 'uno-player-id' }
  )
);

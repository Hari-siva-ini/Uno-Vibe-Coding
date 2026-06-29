import { create } from 'zustand';
import type { ClientGameState, RoomInfo, ChatMessage } from '@uno/shared';

interface GameStore {
  room: RoomInfo | null;
  gameState: ClientGameState | null;
  chatMessages: ChatMessage[];
  isMatchmaking: boolean;
  error: string | null;
  selectedCardId: string | null;
  showColorPicker: boolean;
  showUnoFlash: boolean;

  setRoom: (room: RoomInfo | null) => void;
  setGameState: (state: ClientGameState | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setMatchmaking: (v: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedCard: (id: string | null) => void;
  setShowColorPicker: (v: boolean) => void;
  setShowUnoFlash: (v: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  gameState: null,
  chatMessages: [],
  isMatchmaking: false,
  error: null,
  selectedCardId: null,
  showColorPicker: false,
  showUnoFlash: false,

  setRoom: (room) => set({ room }),
  setGameState: (gameState) => set({ gameState }),
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setMatchmaking: (isMatchmaking) => set({ isMatchmaking }),
  setError: (error) => set({ error }),
  setSelectedCard: (selectedCardId) => set({ selectedCardId }),
  setShowColorPicker: (showColorPicker) => set({ showColorPicker }),
  setShowUnoFlash: (showUnoFlash) => set({ showUnoFlash }),
  reset: () =>
    set({
      room: null,
      gameState: null,
      chatMessages: [],
      isMatchmaking: false,
      error: null,
      selectedCardId: null,
      showColorPicker: false,
      showUnoFlash: false,
    }),
}));

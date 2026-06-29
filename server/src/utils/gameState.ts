import type { GameState, ClientGameState, Player } from '@uno/shared';

/** Build client-safe game state for a specific player */
export function toClientGameState(state: GameState, playerId: string): ClientGameState {
  return {
    ...state,
    myPlayerId: playerId,
    players: state.players.map((p) => ({
      ...p,
      handCount: p.hand.length,
      hand: p.id === playerId ? p.hand : undefined,
    })),
  };
}

/** Serialize player for room lobby */
export function serializeLobbyPlayer(p: Player) {
  return {
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isReady: p.isReady,
    isConnected: p.isConnected,
    type: p.type,
    seatIndex: p.seatIndex,
  };
}

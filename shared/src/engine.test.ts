import { describe, it, expect, beforeEach } from 'vitest';
import { createDeck, shuffleDeck, resetCardIdCounter } from './deck';
import { setupSinglePlayerGame, playCard, drawCards, callUno, startGame, createGameState, createPlayer, createDefaultSettings } from './engine';
import { COLORS } from './constants';

describe('UNO Deck', () => {
  beforeEach(() => resetCardIdCounter());

  it('creates 108 cards', () => {
    expect(createDeck().length).toBe(108);
  });

  it('shuffles without losing cards', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(108);
  });
});

describe('UNO Game Engine', () => {
  beforeEach(() => resetCardIdCounter());

  it('starts single player game with correct player count', () => {
    const state = setupSinglePlayerGame('human1', 'Player', 2, 'easy');
    expect(state.players.length).toBe(3);
    expect(state.status).toBe('playing');
    state.players.forEach((p) => expect(p.hand.length).toBe(7));
  });

  it('deals 7 cards per player', () => {
    const players = [
      createPlayer('p1', 'P1', 0),
      createPlayer('p2', 'P2', 1),
    ];
    const state = startGame(
      createGameState('g1', 'p1', players, 'local', createDefaultSettings())
    );
    state.players.forEach((p) => expect(p.hand.length).toBe(7));
  });

  it('allows drawing on turn', () => {
    const state = setupSinglePlayerGame('human1', 'Player', 1, 'easy');
    const currentId = state.players[state.currentPlayerIndex].id;
    const result = drawCards(state, currentId);
    expect(result.error).toBeUndefined();
    expect(result.drawn?.length).toBeGreaterThan(0);
  });

  it('calls UNO with one card', () => {
    const state = setupSinglePlayerGame('human1', 'Player', 1, 'easy');
    const playerIndex = state.players.findIndex((p) => p.id === 'human1');
    const players = [...state.players];
    players[playerIndex] = {
      ...players[playerIndex],
      hand: players[playerIndex].hand.slice(0, 1),
    };
    const modified = { ...state, players };
    const result = callUno(modified, 'human1');
    expect(result.error).toBeUndefined();
    expect(result.state.players[playerIndex].hasCalledUno).toBe(true);
  });
});

describe('Card colors', () => {
  it('has four colors', () => {
    expect(COLORS).toEqual(['red', 'blue', 'green', 'yellow']);
  });
});

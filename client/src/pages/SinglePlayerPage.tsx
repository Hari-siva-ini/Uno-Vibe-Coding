import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  setupSinglePlayerGame,
  playCard,
  drawCards,
  callUno,
  processAITurns,
  startNextRound,
  type ClientGameState,
  type GameState,
  type Color,
} from '@uno/shared';
import { uuidv4 } from '../utils/id';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { GameBoard } from '../components/GameBoard';
import { PlayerHand } from '../components/PlayerHand';
import { WinnerOverlay } from '../components/Confetti';
import { fadeInUp } from '../animations/variants';
import { soundManager } from '../utils/sound';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

function toClientState(state: GameState, myId: string): ClientGameState {
  return {
    ...state,
    myPlayerId: myId,
    players: state.players.map((p) => ({
      ...p,
      handCount: p.hand.length,
      hand: p.id === myId ? p.hand : undefined,
    })),
  };
}

export function SinglePlayerPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { houseRules } = useSettingsStore();
  const [aiCount, setAiCount] = useState(1);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [practiceMode, setPracticeMode] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [humanId, setHumanId] = useState('');

  const startGame = () => {
    const id = user?.id ?? `guest_${uuidv4().slice(0, 8)}`;
    setHumanId(id);
    const state = setupSinglePlayerGame(
      id,
      user?.username ?? 'Player',
      aiCount,
      difficulty,
      { practiceMode, houseRules, hintsEnabled: practiceMode }
    );
    let processed = processAITurns(state);
    setGameState(toClientState(processed, id));
    soundManager.lobbyJoin();
  };

  const updateState = (state: GameState) => {
    let processed = processAITurns(state);
    setGameState(toClientState(processed, humanId));
  };

  const handlePlay = (cardId: string, color?: Color) => {
    if (!gameState) return;
    const raw = { ...gameState, players: gameState.players.map((p) => ({
      ...p,
      hand: p.hand ?? [],
    })) } as GameState;
    const result = playCard(raw, humanId, { cardId, chosenColor: color });
    if (!result.error) {
      soundManager.cardPlay();
      updateState(result.state);
    }
  };

  const handleDraw = () => {
    if (!gameState) return;
    const raw = { ...gameState, players: gameState.players.map((p) => ({
      ...p,
      hand: p.hand ?? [],
    })) } as GameState;
    const result = drawCards(raw, humanId);
    if (!result.error) {
      soundManager.cardDraw();
      updateState(result.state);
    }
  };

  const handleCallUno = () => {
    if (!gameState) return;
    const raw = { ...gameState, players: gameState.players.map((p) => ({
      ...p,
      hand: p.hand ?? [],
    })) } as GameState;
    const result = callUno(raw, humanId);
    if (!result.error) {
      soundManager.uno();
      setGameState(toClientState(result.state, humanId));
    }
  };

  const handleNextRound = () => {
    if (!gameState) return;
    const raw = { ...gameState, players: gameState.players.map((p) => ({
      ...p,
      hand: p.hand ?? [],
    })) } as GameState;
    const next = startNextRound(raw);
    updateState(next);
  };

  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === humanId;
  const winner = gameState?.winnerId
    ? gameState.players.find((p) => p.id === gameState.winnerId)
    : null;

  if (!gameState) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="pt-20 px-4 pb-8">
          <motion.div
            className="max-w-lg mx-auto glass p-8 space-y-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-3xl font-display font-bold text-center">Single Player</h1>

            <div>
              <label className="block text-sm text-slate-400 mb-2">AI Opponents</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      aiCount === n ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                    onClick={() => setAiCount(n)}
                  >
                    {n} AI
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`flex-1 py-3 rounded-xl font-medium capitalize transition-all ${
                      difficulty === d ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={practiceMode}
                onChange={(e) => setPracticeMode(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-500"
              />
              <span>Practice Mode (hints enabled, no timer)</span>
            </label>

            <button type="button" className="btn-primary w-full" onClick={startGame}>
              Start Game
            </button>
            <button type="button" className="btn-secondary w-full" onClick={() => navigate('/')}>
              Back
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />
      <main className="pt-16 px-2 sm:px-4 pb-4 max-w-6xl mx-auto">
        <GameBoard gameState={gameState} />
        <PlayerHand
          gameState={gameState}
          onPlayCard={handlePlay}
          onDraw={handleDraw}
          onCallUno={handleCallUno}
          isMyTurn={isMyTurn}
        />
      </main>

      {gameState.status === 'round_end' && winner && (
        <WinnerOverlay
          winnerName={winner.name}
          isWinner={winner.id === humanId}
          onNextRound={handleNextRound}
          onHome={() => {
            setGameState(null);
            navigate('/');
          }}
        />
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { Lobby } from '../components/Lobby';
import { GameBoard } from '../components/GameBoard';
import { PlayerHand } from '../components/PlayerHand';
import { WinnerOverlay } from '../components/Confetti';
import { useGameStore } from '../store/gameStore';
import { connectSocket, joinRoom, playCard, drawCard, callUno, leaveRoom } from '../socket/client';
import { soundManager } from '../utils/sound';

export function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, gameState } = useGameStore();

  useEffect(() => {
    connectSocket();
    if (code && !room) {
      joinRoom(code.toUpperCase()).catch(console.error);
    }
  }, [code, room]);

  const isPlaying = gameState && (gameState.status === 'playing' || gameState.status === 'round_end');
  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === gameState?.myPlayerId;
  const winner = gameState?.winnerId
    ? gameState.players.find((p) => p.id === gameState.winnerId)
    : null;

  if (isPlaying && gameState) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="pt-16 px-2 sm:px-4 pb-4 max-w-6xl mx-auto">
          <GameBoard gameState={gameState} />
          {gameState.status === 'playing' && (
            <PlayerHand
              gameState={gameState}
              onPlayCard={(cardId, color) => {
                soundManager.cardPlay();
                playCard(cardId, color);
              }}
              onDraw={() => {
                soundManager.cardDraw();
                drawCard();
              }}
              onCallUno={() => {
                soundManager.uno();
                callUno();
              }}
              isMyTurn={isMyTurn ?? false}
            />
          )}
        </main>

        {gameState.status === 'round_end' && winner && (
          <WinnerOverlay
            winnerName={winner.name}
            isWinner={winner.id === gameState.myPlayerId}
            onHome={() => {
              leaveRoom();
              navigate('/');
            }}
          />
        )}
      </div>
    );
  }

  if (!room && code) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="pt-24 px-4 text-center">
          <p className="text-slate-400">Connecting to room {code}...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />
      <main className="pt-24 px-4 pb-8">
        {room && <Lobby room={room} />}
      </main>
    </div>
  );
}

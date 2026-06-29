import { motion } from 'framer-motion';
import type { ClientGameState } from '@uno/shared';
import { COLOR_HEX } from '@uno/shared';
import { Card } from '../cards/Card';

interface GameBoardProps {
  gameState: ClientGameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Opponents */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full max-w-4xl">
        {gameState.players
          .filter((p) => p.id !== gameState.myPlayerId)
          .map((player) => {
            const isActive = player.id === currentPlayer?.id;
            return (
              <motion.div
                key={player.id}
                className={`glass-card p-4 flex flex-col items-center gap-2 min-w-[100px]
                  ${isActive ? 'ring-2 ring-indigo-400 animate-pulse-glow' : ''}
                  ${!player.isConnected ? 'opacity-50' : ''}`}
                animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="text-2xl">{player.avatar}</span>
                <span className="text-sm font-medium truncate max-w-[100px]">
                  {player.name}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(player.handCount, 7) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-4 rounded-sm bg-indigo-600/60 border border-white/20"
                    />
                  ))}
                  {player.handCount > 7 && (
                    <span className="text-xs text-slate-400">+{player.handCount - 7}</span>
                  )}
                </div>
                {player.handCount === 1 && (
                  <span className="text-xs text-yellow-400 font-bold">UNO!</span>
                )}
                <span className="text-xs text-slate-400">Score: {player.score}</span>
              </motion.div>
            );
          })}
      </div>

      {/* Center play area */}
      <div className="flex items-center gap-6 sm:gap-12">
        {/* Draw pile */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Card card={{ id: 'draw', color: 'blue', type: 'number', value: 0 }} faceDown index={0} />
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-xs px-2 py-0.5 rounded-full border border-white/20">
              {gameState.drawPile.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Draw</span>
        </div>

        {/* Current color indicator */}
        <div className="flex flex-col items-center gap-3">
          {topCard && (
            <motion.div
              key={topCard.id}
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring' }}
            >
              <Card card={topCard} index={0} />
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Color:</span>
            <div
              className="w-6 h-6 rounded-full border-2 border-white/30 shadow-lg"
              style={{ backgroundColor: COLOR_HEX[gameState.currentColor] }}
            />
          </div>
          {gameState.pendingDraw > 0 && (
            <span className="text-red-400 font-bold text-sm animate-pulse">
              Draw {gameState.pendingDraw}!
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>{gameState.direction === 1 ? '↻' : '↺'}</span>
            <span>Round {gameState.roundNumber}</span>
          </div>
        </div>

        {/* Discard count */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
            <span className="text-slate-500 text-sm">{gameState.discardPile.length}</span>
          </div>
          <span className="text-xs text-slate-400">Discard</span>
        </div>
      </div>

      {/* Turn indicator */}
      {currentPlayer && (
        <motion.p
          className="text-center text-sm text-slate-300"
          key={currentPlayer.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {currentPlayer.id === gameState.myPlayerId
            ? "It's your turn!"
            : `${currentPlayer.name}'s turn`}
        </motion.p>
      )}
    </div>
  );
}

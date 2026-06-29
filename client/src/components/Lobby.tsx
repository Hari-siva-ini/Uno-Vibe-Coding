import { useState } from 'react';
import type { RoomInfo } from '@uno/shared';
import { motion } from 'framer-motion';
import { setReady, startGame, sendChat, leaveRoom } from '../socket/client';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useSocketPlayerStore } from '../store/socketPlayerStore';
import { fadeInUp } from '../animations/variants';

interface LobbyProps {
  room: RoomInfo;
}

export function Lobby({ room }: LobbyProps) {
  const [chatInput, setChatInput] = useState('');
  const { chatMessages } = useGameStore();
  const { user } = useAuthStore();
  const playerId = user?.id ?? useSocketPlayerStore.getState().getOrCreatePlayerId();
  const isHost = room.hostId === playerId;
  const myPlayer = room.players.find((p) => p.id === playerId);
  const allReady = room.players.every((p) => p.isReady);
  const canStart = room.players.length >= 2 && allReady;

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput('');
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/lobby/${room.code}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {/* Room info */}
      <div className="glass p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold">Room Lobby</h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-3xl font-mono font-bold tracking-widest text-indigo-400">
              {room.code}
            </span>
            <button
              type="button"
              onClick={copyInviteLink}
              className="btn-secondary text-xs py-1 px-2"
              title="Copy invite link"
            >
              📋
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {room.players.length}/{room.settings.maxPlayers} players
          </p>
        </div>

        {/* Player list */}
        <div className="space-y-3">
          {room.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <span className="text-2xl">{player.avatar}</span>
              <div className="flex-1">
                <p className="font-medium">
                  {player.name}
                  {player.id === room.hostId && (
                    <span className="text-xs text-yellow-400 ml-2">Host</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {player.isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  player.isReady
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {player.isReady ? 'Ready' : 'Not Ready'}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => setReady(!myPlayer?.isReady)}
          >
            {myPlayer?.isReady ? 'Not Ready' : 'Ready Up'}
          </button>

          {isHost && (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={!canStart}
              onClick={() => startGame()}
            >
              Start Game
            </button>
          )}

          <button type="button" className="btn-secondary w-full" onClick={() => leaveRoom()}>
            Leave Room
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className="glass p-6 flex flex-col h-[400px]">
        <h3 className="font-display font-bold mb-4">Room Chat</h3>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className="text-indigo-400 font-medium">{msg.playerName}: </span>
              <span className="text-slate-300">{msg.text}</span>
            </div>
          ))}
          {chatMessages.length === 0 && (
            <p className="text-slate-500 text-sm">No messages yet...</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="button" className="btn-primary py-2 px-4" onClick={handleSendChat}>
            Send
          </button>
        </div>
      </div>
    </motion.div>
  );
}

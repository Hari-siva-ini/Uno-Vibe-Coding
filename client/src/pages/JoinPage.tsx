import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { joinRoom, connectSocket } from '../socket/client';
import { fadeInUp } from '../animations/variants';
import { soundManager } from '../utils/sound';

export function JoinPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    soundManager.buttonClick();
    connectSocket();
    const result = await joinRoom(code.toUpperCase());
    setLoading(false);
    if (result.success && result.room) {
      soundManager.lobbyJoin();
      navigate(`/lobby/${result.room.code}`);
    } else {
      setError(result.error ?? 'Failed to join room');
      soundManager.error();
    }
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />
      <main className="pt-24 px-4 pb-8">
        <motion.div
          className="max-w-md mx-auto glass p-8 space-y-6"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-2xl font-display font-bold text-center">Join Room</h1>
          <p className="text-slate-400 text-center text-sm">
            Enter the 6-character room code from your friend
          </p>

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ROOM CODE"
            className="w-full text-center text-2xl font-mono font-bold tracking-widest bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
            maxLength={6}
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="button"
            className="btn-primary w-full"
            onClick={handleJoin}
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>

          <button type="button" className="btn-secondary w-full" onClick={() => navigate('/')}>
            Back
          </button>
        </motion.div>
      </main>
    </div>
  );
}

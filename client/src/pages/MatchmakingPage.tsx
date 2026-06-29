import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { useGameStore } from '../store/gameStore';
import { leaveMatchmaking } from '../socket/client';
import { motion } from 'framer-motion';

export function MatchmakingPage() {
  const navigate = useNavigate();
  const { isMatchmaking, room } = useGameStore();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (room) {
      navigate(`/lobby/${room.code}`);
    }
  }, [room, navigate]);

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />
      <main className="pt-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          className="glass p-12 text-center max-w-md"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="text-6xl mb-6">⚡</div>
          <h2 className="text-2xl font-display font-bold mb-2">
            Finding Match{dots}
          </h2>
          <p className="text-slate-400 mb-6">Looking for players...</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              leaveMatchmaking();
              navigate('/');
            }}
          >
            Cancel
          </button>
        </motion.div>
      </main>
    </div>
  );
}

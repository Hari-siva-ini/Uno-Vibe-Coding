import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { fadeInUp, scaleIn } from '../animations/variants';
import { createRoom, joinMatchmaking } from '../socket/client';
import { connectSocket } from '../socket/client';
import { soundManager } from '../utils/sound';

const gameModes = [
  {
    title: 'Single Player',
    description: 'Play against 1-3 AI opponents',
    icon: '🤖',
    path: '/single-player',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    title: 'Create Room',
    description: 'Private room with friends',
    icon: '🏠',
    action: 'create',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    title: 'Join Room',
    description: 'Enter a room code',
    icon: '🔗',
    action: 'join',
    color: 'from-green-600 to-emerald-600',
  },
  {
    title: 'Quick Match',
    description: 'Public matchmaking',
    icon: '⚡',
    action: 'matchmaking',
    color: 'from-orange-600 to-red-600',
  },
];

export function HomePage() {
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    soundManager.buttonClick();
    connectSocket();
    const result = await createRoom(false);
    if (result.success && result.room) {
      navigate(`/lobby/${result.room.code}`);
    }
  };

  const handleQuickMatch = async () => {
    soundManager.buttonClick();
    connectSocket();
    const result = await joinMatchmaking(4);
    if (result.room) {
      navigate(`/lobby/${result.room.code}`);
    } else if (result.waiting) {
      navigate('/matchmaking');
    }
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />

      <main className="pt-24 px-4 pb-12">
        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-5xl sm:text-7xl font-display font-bold mb-4">
            <span className="bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 bg-clip-text text-transparent">
              UNO
            </span>
            <span className="text-white"> Online</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Modern multiplayer card game with smooth animations, AI opponents, and real-time online play.
          </p>
        </motion.div>

        {/* Game mode cards */}
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4 sm:gap-6">
          {gameModes.map((mode, i) => (
            <motion.button
              key={mode.title}
              type="button"
              className={`glass p-6 text-left group hover:scale-[1.02] transition-transform`}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                if (mode.path) navigate(mode.path);
                else if (mode.action === 'create') handleCreateRoom();
                else if (mode.action === 'join') navigate('/join');
                else if (mode.action === 'matchmaking') handleQuickMatch();
              }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {mode.icon}
              </div>
              <h3 className="text-xl font-display font-bold mb-1">{mode.title}</h3>
              <p className="text-slate-400 text-sm">{mode.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Features */}
        <motion.div
          className="max-w-4xl mx-auto mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          {[
            { icon: '🃏', label: 'Official Rules' },
            { icon: '🌐', label: 'Online Play' },
            { icon: '🎨', label: 'Modern UI' },
            { icon: '🏆', label: 'Leaderboards' },
          ].map((f) => (
            <div key={f.label} className="glass-card p-4 text-center">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-sm text-slate-300 mt-2">{f.label}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

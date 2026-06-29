import { useEffect, useState } from 'react';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';
import { formatWinRate } from '../utils/cards';
import { fadeInUp } from '../animations/variants';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ProfileData {
  statistics: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    highestStreak: number;
    averageScore: number;
    totalPlayTime: number;
  } | null;
  achievements: Array<{ id: string; name?: string; description?: string; unlockedAt: string }>;
}

export function ProfilePage() {
  const { token, user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [token, isAuthenticated]);

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen relative">
        <ParticleBackground />
        <Header />
        <main className="pt-24 px-4 text-center text-slate-400">
          Please login to view your profile
        </main>
      </div>
    );
  }

  const stats = data?.statistics;

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />
      <main className="pt-24 px-4 pb-8 max-w-2xl mx-auto space-y-6">
        <motion.div className="glass p-8 text-center" variants={fadeInUp} initial="hidden" animate="visible">
          <span className="text-6xl">{user?.avatar}</span>
          <h1 className="text-2xl font-display font-bold mt-4">{user?.username}</h1>
          <p className="text-slate-400">{user?.email}</p>
        </motion.div>

        {stats && (
          <motion.div className="glass p-6 grid grid-cols-2 sm:grid-cols-4 gap-4" variants={fadeInUp} initial="hidden" animate="visible">
            {[
              { label: 'Games', value: stats.gamesPlayed },
              { label: 'Wins', value: stats.wins },
              { label: 'Win Rate', value: formatWinRate(stats.wins, stats.gamesPlayed) },
              { label: 'Best Streak', value: stats.highestStreak },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-indigo-400">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {data?.achievements && data.achievements.length > 0 && (
          <motion.div className="glass p-6" variants={fadeInUp} initial="hidden" animate="visible">
            <h2 className="font-display font-bold mb-4">Achievements</h2>
            <div className="grid grid-cols-2 gap-3">
              {data.achievements.map((a) => (
                <div key={a.id} className="glass-card p-3 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-medium text-sm">{a.name ?? a.id}</p>
                    <p className="text-xs text-slate-400">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

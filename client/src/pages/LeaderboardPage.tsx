import { useEffect, useState } from 'react';
import { ParticleBackground } from '../components/ParticleBackground';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';
import { fadeInUp } from '../animations/variants';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;
}

export function LeaderboardPage() {
  const { token } = useAuthStore();
  const [period, setPeriod] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${API_URL}/leaderboard?period=${period}`, { headers })
      .then((r) => r.json())
      .then(setEntries)
      .catch(console.error);
  }, [period, token]);

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Header />
      <main className="pt-24 px-4 pb-8 max-w-2xl mx-auto">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <h1 className="text-3xl font-display font-bold text-center mb-6">Leaderboard</h1>

          <div className="flex gap-2 mb-6 justify-center">
            {(['all', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  period === p ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'
                }`}
                onClick={() => setPeriod(p)}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          <div className="glass overflow-hidden">
            {entries.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No data yet. Play some games!</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                    <th className="p-4">#</th>
                    <th className="p-4">Player</th>
                    <th className="p-4 text-right">Wins</th>
                    <th className="p-4 text-right hidden sm:table-cell">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.rank} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 font-bold text-indigo-400">
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                      </td>
                      <td className="p-4 flex items-center gap-2">
                        <span>{entry.avatar}</span>
                        <span>{entry.username}</span>
                      </td>
                      <td className="p-4 text-right font-medium">{entry.wins}</td>
                      <td className="p-4 text-right hidden sm:table-cell text-slate-400">
                        {entry.winRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

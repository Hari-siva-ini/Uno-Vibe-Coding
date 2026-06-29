import { Response } from 'express';
import mongoose from 'mongoose';
import { Statistics } from '../models/Statistics';
import { AuthRequest } from '../middleware/auth';

export async function getStatistics(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const stats = await Statistics.findOne({ userId: req.user.userId });
  if (!stats) {
    res.status(404).json({ error: 'Statistics not found' });
    return;
  }

  res.json({
    gamesPlayed: stats.gamesPlayed,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0,
    highestStreak: stats.highestStreak,
    currentStreak: stats.currentStreak,
    averageScore: stats.gamesPlayed > 0 ? stats.totalScore / stats.gamesPlayed : 0,
    favoriteColor: stats.favoriteColor,
    totalPlayTime: stats.totalPlayTime,
  });
}

export async function getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
  const period = (req.query.period as string) || 'all';
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  let sortField = 'wins';
  if (period === 'weekly') sortField = 'weeklyWins';
  if (period === 'monthly') sortField = 'monthlyWins';

  const stats = await Statistics.find()
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('userId', 'username avatar');

  res.json(
    stats.map((s, index) => ({
      rank: index + 1,
      username: (s.userId as { username?: string })?.username ?? 'Unknown',
      avatar: (s.userId as { avatar?: string })?.avatar ?? '🎮',
      wins: s.wins,
      gamesPlayed: s.gamesPlayed,
      winRate: s.gamesPlayed > 0 ? (s.wins / s.gamesPlayed) * 100 : 0,
      score: s[sortField as keyof typeof s] as number,
    }))
  );
}

/** Update stats after game end */
export async function recordGameResult(
  winnerId: string,
  playerIds: string[],
  duration: number
): Promise<void> {
  if (!mongoose.connection.readyState) return;

  for (const playerId of playerIds) {
    const isWinner = playerId === winnerId;
    const stats = await Statistics.findOne({ userId: playerId });
    if (!stats) continue;

    stats.gamesPlayed += 1;
    if (isWinner) {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.weeklyWins += 1;
      stats.monthlyWins += 1;
      if (stats.currentStreak > stats.highestStreak) {
        stats.highestStreak = stats.currentStreak;
      }
    } else {
      stats.losses += 1;
      stats.currentStreak = 0;
    }
    stats.totalPlayTime += duration;
    await stats.save();
  }
}

import { Response } from 'express';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Statistics } from '../models/Statistics';
import { Achievement } from '../models/Achievement';
import { ACHIEVEMENT_DEFS } from '../models/Achievement';
import { AuthRequest } from '../middleware/auth';
import { hashPassword, comparePassword, signToken } from '../utils/auth';
import { AVATAR_OPTIONS } from '@uno/shared';

export async function register(req: AuthRequest, res: Response): Promise<void> {
  if (!mongoose.connection.readyState) {
    res.status(503).json({ error: 'Database not available' });
    return;
  }

  const { username, email, password } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    res.status(409).json({ error: 'Username or email already exists' });
    return;
  }

  const hashed = await hashPassword(password);
  const avatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];

  const user = await User.create({ username, email, password: hashed, avatar });
  await Statistics.create({ userId: user._id });

  const token = signToken({
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
  });

  res.status(201).json({
    token,
    user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
  });
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  if (!mongoose.connection.readyState) {
    res.status(503).json({ error: 'Database not available' });
    return;
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.isBanned) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
  });

  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
  });
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = await User.findById(req.user.userId).select('-password');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const stats = await Statistics.findOne({ userId: user._id });
  const achievements = await Achievement.find({ userId: user._id });

  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      settings: user.settings,
    },
    statistics: stats
      ? {
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          losses: stats.losses,
          winRate: stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0,
          highestStreak: stats.highestStreak,
          currentStreak: stats.currentStreak,
          averageScore: stats.gamesPlayed > 0 ? stats.totalScore / stats.gamesPlayed : 0,
          favoriteColor: stats.favoriteColor,
          totalPlayTime: stats.totalPlayTime,
        }
      : null,
    achievements: achievements.map((a) => ({
      id: a.achievementId,
      unlockedAt: a.unlockedAt,
      ...ACHIEVEMENT_DEFS.find((d) => d.id === a.achievementId),
    })),
  });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { avatar, settings } = req.body;
  const update: Partial<IUser> = {};
  if (avatar) update.avatar = avatar;
  if (settings) update.settings = settings as IUser['settings'];

  const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true }).select('-password');
  res.json({ user });
}

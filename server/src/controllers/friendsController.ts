import { Response } from 'express';
import mongoose from 'mongoose';
import { Friend } from '../models/Friend';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export async function getFriends(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const friendships = await Friend.find({
    userId: req.user.userId,
    status: 'accepted',
  }).populate('friendId', 'username avatar');

  res.json(
    friendships.map((f) => {
      const friend = f.friendId as unknown as { _id: string; username: string; avatar: string };
      return {
        id: friend._id,
        username: friend.username,
        avatar: friend.avatar,
      };
    })
  );
}

export async function addFriend(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { username } = req.body;
  const friend = await User.findOne({ username });
  if (!friend) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (friend._id.toString() === req.user.userId) {
    res.status(400).json({ error: 'Cannot add yourself' });
    return;
  }

  const existing = await Friend.findOne({
    userId: req.user.userId,
    friendId: friend._id,
  });

  if (existing) {
    res.status(409).json({ error: 'Friend request already exists' });
    return;
  }

  await Friend.create({
    userId: req.user.userId,
    friendId: friend._id,
    status: 'pending',
  });

  res.status(201).json({ message: 'Friend request sent' });
}

export async function acceptFriend(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { friendId } = req.params;
  const request = await Friend.findOne({
    userId: friendId,
    friendId: req.user.userId,
    status: 'pending',
  });

  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  request.status = 'accepted';
  await request.save();

  await Friend.create({
    userId: req.user.userId,
    friendId: friendId,
    status: 'accepted',
  });

  res.json({ message: 'Friend accepted' });
}

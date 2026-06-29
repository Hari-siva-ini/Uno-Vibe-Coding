import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { roomManager } from '../game/RoomManager';

export async function getActiveRooms(req: AuthRequest, res: Response): Promise<void> {
  const rooms = roomManager.getPublicRooms();
  res.json(rooms);
}

export async function getServerStatus(req: AuthRequest, res: Response): Promise<void> {
  res.json({
    status: 'online',
    activeRooms: roomManager.getRoomCount(),
    activePlayers: roomManager.getPlayerCount(),
    uptime: process.uptime(),
  });
}

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  // Admin stub — extend with role check
  res.json({ message: 'Admin endpoint', activePlayers: roomManager.getPlayerCount() });
}

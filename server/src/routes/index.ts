import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController';
import { getStatistics, getLeaderboard } from '../controllers/statsController';
import { getFriends, addFriend, acceptFriend } from '../controllers/friendsController';
import { getActiveRooms, getServerStatus, getUsers } from '../controllers/adminController';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema } from '@uno/shared';

const router = Router();

// Auth
router.post('/auth/register', validateBody(registerSchema), register);
router.post('/auth/login', validateBody(loginSchema), login);
router.get('/auth/profile', authMiddleware, getProfile);
router.patch('/auth/profile', authMiddleware, updateProfile);

// Stats & Leaderboard
router.get('/stats', authMiddleware, getStatistics);
router.get('/leaderboard', optionalAuth, getLeaderboard);

// Friends
router.get('/friends', authMiddleware, getFriends);
router.post('/friends', authMiddleware, addFriend);
router.post('/friends/:friendId/accept', authMiddleware, acceptFriend);

// Admin
router.get('/admin/rooms', authMiddleware, getActiveRooms);
router.get('/admin/status', getServerStatus);
router.get('/admin/users', authMiddleware, getUsers);

export default router;

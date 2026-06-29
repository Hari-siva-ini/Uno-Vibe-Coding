import { z } from 'zod';

export const colorSchema = z.enum(['red', 'blue', 'green', 'yellow']);

export const houseRulesSchema = z.object({
  stackDrawTwo: z.boolean(),
  stackDrawFour: z.boolean(),
  jumpIn: z.boolean(),
  sevenSwap: z.boolean(),
  zeroRotation: z.boolean(),
  progressiveDraw: z.boolean(),
});

export const gameSettingsSchema = z.object({
  maxPlayers: z.number().min(2).max(4),
  aiCount: z.number().min(0).max(3),
  aiDifficulty: z.enum(['easy', 'medium', 'hard']),
  houseRules: houseRulesSchema,
  practiceMode: z.boolean(),
  timerEnabled: z.boolean(),
  timerSeconds: z.number().min(10).max(120),
  hintsEnabled: z.boolean(),
});

export const playCardSchema = z.object({
  cardId: z.string(),
  chosenColor: colorSchema.optional(),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const roomCreateSchema = z.object({
  isPublic: z.boolean().optional(),
  settings: gameSettingsSchema.partial().optional(),
});

export const roomJoinSchema = z.object({
  code: z.string().length(6),
});

export const chatMessageSchema = z.object({
  text: z.string().min(1).max(500),
});

export const matchmakingSchema = z.object({
  playerCount: z.number().min(2).max(4),
});

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStatistics extends Document {
  userId: Types.ObjectId;
  gamesPlayed: number;
  wins: number;
  losses: number;
  highestStreak: number;
  currentStreak: number;
  totalScore: number;
  favoriteColor?: string;
  totalPlayTime: number;
  weeklyWins: number;
  monthlyWins: number;
}

const statisticsSchema = new Schema<IStatistics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    highestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    favoriteColor: { type: String },
    totalPlayTime: { type: Number, default: 0 },
    weeklyWins: { type: Number, default: 0 },
    monthlyWins: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Statistics = mongoose.model<IStatistics>('Statistics', statisticsSchema);

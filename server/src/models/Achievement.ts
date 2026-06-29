import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAchievement extends Document {
  userId: Types.ObjectId;
  achievementId: string;
  unlockedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    achievementId: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);

export const ACHIEVEMENT_DEFS = [
  { id: 'first_win', name: 'First Win', description: 'Win your first game' },
  { id: 'wins_100', name: '100 Wins', description: 'Win 100 games' },
  { id: 'uno_master', name: 'UNO Master', description: 'Call UNO 50 times' },
  { id: 'lucky_winner', name: 'Lucky Winner', description: 'Win with a wild card' },
  { id: 'perfect_game', name: 'Perfect Game', description: 'Win without drawing cards' },
  { id: 'card_collector', name: 'Card Collector', description: 'Play 1000 cards' },
  { id: 'champion', name: 'Champion', description: 'Reach 500 points in tournament' },
];

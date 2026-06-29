import mongoose, { Schema, Document } from 'mongoose';

export interface IGameRecord extends Document {
  roomCode: string;
  mode: string;
  players: Array<{ id: string; name: string; score: number; isWinner: boolean }>;
  winnerId: string;
  duration: number;
  roundCount: number;
  startedAt: Date;
  finishedAt: Date;
}

const gameRecordSchema = new Schema<IGameRecord>(
  {
    roomCode: { type: String },
    mode: { type: String, required: true },
    players: [{
      id: String,
      name: String,
      score: Number,
      isWinner: Boolean,
    }],
    winnerId: { type: String, required: true },
    duration: { type: Number, default: 0 },
    roundCount: { type: Number, default: 1 },
    startedAt: { type: Date },
    finishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const GameRecord = mongoose.model<IGameRecord>('GameRecord', gameRecordSchema);

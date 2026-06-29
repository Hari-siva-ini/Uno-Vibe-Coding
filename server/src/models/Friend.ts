import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFriend extends Document {
  userId: Types.ObjectId;
  friendId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'blocked';
}

const friendSchema = new Schema<IFriend>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    friendId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
  },
  { timestamps: true }
);

friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export const Friend = mongoose.model<IFriend>('Friend', friendSchema);

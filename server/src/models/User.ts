import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  googleId?: string;
  isBanned: boolean;
  settings: {
    sound: boolean;
    music: boolean;
    darkMode: boolean;
    animations: boolean;
    timer: boolean;
    language: string;
    colorBlindMode: boolean;
    highContrast: boolean;
    fontSize: string;
    houseRules: Record<string, boolean>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '🎮' },
    googleId: { type: String, sparse: true },
    isBanned: { type: Boolean, default: false },
    settings: {
      sound: { type: Boolean, default: true },
      music: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
      animations: { type: Boolean, default: true },
      timer: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
      colorBlindMode: { type: Boolean, default: false },
      highContrast: { type: Boolean, default: false },
      fontSize: { type: String, default: 'medium' },
      houseRules: { type: Object, default: {} },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);

import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Allow server to run without DB in dev for local/single-player
    if (config.nodeEnv === 'production') throw error;
    console.warn('Running without MongoDB — auth/stats disabled');
  }
}

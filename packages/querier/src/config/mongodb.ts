import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baskt';

let isConnecting = false;
let maxRetries = 5;
let retryDelay = 2 * 1000;

export const connectMongoDB = async (retries = maxRetries) => {
  if (isConnecting || mongoose.connection.readyState === 1) {
    return;
  }

  isConnecting = true;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected successfully');
      isConnecting = false;
      break;
    } catch (error) {
      console.error(`MongoDB connection error (attempt ${attempt}):`, error);
      if (attempt === retries) {
        isConnecting = false;
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
};

export const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    throw error;
  }
};

export const getMongoConnection = () => {
  return mongoose.connection;
};

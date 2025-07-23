import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baskt';

// Connection options for MongoDB
const mongooseOptions = {
  maxIdleTimeMS: 2 * 60 * 60 * 1000, // Close connections after 60 minutes of inactivity
};

export const connectMongoDB = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      console.log('MongoDB connected successfully');
    } else {
      console.log('MongoDB already connected');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected successfully');
    } else {
      console.log('MongoDB not connected');
    }
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};

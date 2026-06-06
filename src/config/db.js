import mongoose from 'mongoose';
import winston from 'winston';
import { seedDatabase } from '../utils/seedData.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sanchara-setu';
    
    mongoose.connection.on('connected', () => {
      winston.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      winston.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      winston.warn('MongoDB disconnected');
    });

    const conn = await mongoose.connect(mongoUri);
    
    // Seed default data if needed
    await seedDatabase();

    return conn;
  } catch (error) {
    winston.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

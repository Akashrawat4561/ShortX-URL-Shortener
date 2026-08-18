import mongoose from 'mongoose';

let isFallbackMode = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urlshortener';
  
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[DB] Connected to MongoDB database successfully.');
  } catch (error) {
    console.warn('[DB Warning] MongoDB connection failed:', error.message);
    console.warn('[DB Warning] Operating in hybrid fallback memory mode for local resilience.');
    isFallbackMode = true;
  }
};

export const getFallbackState = () => isFallbackMode;

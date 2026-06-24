import mongoose from 'mongoose';

export async function connectDatabase() {
  const databaseUri = process.env.MONGODB_URI;

  if (!databaseUri) {
    console.warn(
      'MONGODB_URI is missing. Server will continue without database storage.'
    );

    return false;
  }

  try {
    await mongoose.connect(databaseUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('MongoDB connected successfully.');

    return true;
  } catch (error) {
    console.error(
      'MongoDB connection failed:',
      error.message
    );

    console.warn(
      'Arduino and Express will continue running without MongoDB.'
    );

    return false;
  }
}
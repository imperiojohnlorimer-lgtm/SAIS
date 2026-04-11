import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 50,  // Increased from 10 to handle concurrent requests
      minPoolSize: 5,   // Increased from 2 for better performance
      maxIdleTimeMS: 10000,  // Reduced from 30000 to close idle connections faster
      socketTimeoutMS: 20000,  // Reduced from 45000 to fail fast on slow queries
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,  // Added for faster server selection
      retryWrites: true,
      w: 'majority',
      // Additional connection pool settings
      waitQueueTimeoutMS: 10000  // Timeout for waiting for connection availability
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Log connection pool status
    const db = mongoose.connection;
    db.on('connected', () => {
      console.log('✅ MongoDB connection established');
    });
    db.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost');
    });
    db.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDatabase;

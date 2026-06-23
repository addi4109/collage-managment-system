import mongoose from 'mongoose';
import dns from 'dns';

// Force Node's DNS resolver to utilize public DNS servers,
// bypassing local/ISP DNS resolution failures for Atlas SRV lookups.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('CRITICAL STARTUP ERROR: MONGODB_URI environment variable is missing!');
    process.exit(1);
  }

  if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
    console.error('CRITICAL STARTUP ERROR: Localhost database URLs are disallowed! Please configure a valid MongoDB Atlas connection string in MONGODB_URI.');
    process.exit(1);
  }

  // Optimized settings for connection pooling, reconnects, and Atlas timeouts
  const mongooseOptions = {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  };

  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`Connecting to MongoDB Atlas (Attempt ${retryCount + 1}/${maxRetries})...`);
      const conn = await mongoose.connect(mongoURI, mongooseOptions);
      console.log('MongoDB Atlas Connected Successfully');
      console.log(`Database Name: ${conn.connection.name}`);
      return conn;
    } catch (err) {
      retryCount++;
      console.error(`MongoDB connection failed (Attempt ${retryCount}/${maxRetries}):`, err.message);
      if (retryCount >= maxRetries) {
        console.error('CRITICAL ERROR: Max database connection retries exceeded. Exiting startup.');
        process.exit(1);
      }
      console.log('Retrying connection in 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

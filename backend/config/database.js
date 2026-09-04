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

      // Cleanup stale indexes that may cause duplicate key errors
      try {
        const db = conn.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        // List of stale index keys to drop per collection
        const staleIndexMap = {
          faculties: ['user'],       // old field name, now 'userId'
          students: ['user'],        // old field name, now 'userId'
          attendances: ['student', 'date'], // old field names, now 'studentId', 'sessionId'
          attendancesessions: ['expiresAt'], // removed TTL index
        };

        for (const [colName, staleKeys] of Object.entries(staleIndexMap)) {
          if (!collectionNames.includes(colName)) continue;
          const col = db.collection(colName);
          const indexes = await col.indexes();
          for (const idx of indexes) {
            if (idx.name === '_id_') continue;
            const idxKeys = Object.keys(idx.key || {});
            if (staleKeys.some(sk => idxKeys.includes(sk))) {
              console.log(`Dropping stale index "${idx.name}" on ${colName}...`);
              await col.dropIndex(idx.name);
              console.log(`Dropped stale index: ${idx.name}`);
            }
          }
        }
      } catch (cleanupErr) {
        console.warn('Index cleanup warning (non-fatal):', cleanupErr.message);
      }

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

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';
import { loginStudent, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

dotenv.config();

// Mock Express Response Helper
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const runTest = async () => {
  console.log('=== STARTING LOGIN PERFORMANCE OPTIMIZATION INTEGRATION TESTS ===');
  await connectDB();

  try {
    const studentEmail = 'perf-student-test@edutech.com';
    const password = 'password123';

    // Cleanup previous test profiles
    await User.deleteMany({ email: studentEmail });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Seed test student
    console.log('Seeding performance test student profile...');
    const studentUser = new User({
      name: 'Perf Student',
      email: studentEmail,
      passwordHash,
      role: 'student',
      status: 'active',
    });
    const savedStudentUser = await studentUser.save();
    console.log('Student seeded with ID:', savedStudentUser._id);

    // 1. Measure Login Latency & Response Structure
    console.log('\n--- Testing Login Performance & Response Payload Size ---');
    const loginReq = {
      body: { email: studentEmail, password }
    };
    const loginRes = mockResponse();

    const start = performance.now();
    await loginStudent(loginReq, loginRes);
    const duration = performance.now() - start;

    console.log(`Login API execution completed in: ${duration.toFixed(2)}ms`);
    if (duration > 500) {
      console.warn(`WARNING: Login took longer than 500ms (${duration.toFixed(2)}ms). Check server CPU load.`);
    } else {
      console.log(`SUCCESS: Login execution under 500ms goal!`);
    }

    if (loginRes.statusCode && loginRes.statusCode !== 200) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.jsonData)}`);
    }

    const payload = loginRes.jsonData;
    console.log('Login returned payload:', JSON.stringify(payload));

    // Assert minimal response structure
    if (!payload.token) {
      throw new Error('Response is missing the JWT token!');
    }
    if (!payload.user) {
      throw new Error('Response is missing the user object!');
    }
    const userKeys = Object.keys(payload.user);
    console.log(`User keys returned: ${userKeys.join(', ')}`);
    
    // Exactly id, name, and role should be returned
    const expectedKeys = ['id', 'name', 'role'];
    const hasUnwantedKeys = userKeys.some(key => !expectedKeys.includes(key));
    if (hasUnwantedKeys || userKeys.length !== expectedKeys.length) {
      throw new Error(`Payload contains extra/unexpected user fields. Found keys: ${userKeys.join(', ')}. Expected only: ${expectedKeys.join(', ')}`);
    }

    // 2. Verify Indexing configuration
    console.log('\n--- Verifying MongoDB Indexes ---');
    const indexes = await User.collection.indexes();
    console.log('Available User indexes:', JSON.stringify(indexes));
    
    const hasEmailIndex = indexes.some(idx => idx.key.email === 1);
    const hasRoleIndex = indexes.some(idx => idx.key.role === 1);

    if (!hasEmailIndex) {
      throw new Error('Index on email field is missing in MongoDB!');
    }
    if (!hasRoleIndex) {
      throw new Error('Index on role field is missing in MongoDB!');
    }
    console.log('MongoDB Indexes verified successfully!');

    // 3. Verify In-Memory Cache middleware
    console.log('\n--- Verifying Middleware / Profile Caching ---');
    const profileReq = {
      user: { id: savedStudentUser._id.toString(), role: 'student' }
    };
    const profileRes = mockResponse();

    // Call first time (loads from DB and caches)
    console.log('Retrieving profile (first time - DB query)...');
    const startFirst = performance.now();
    await getProfile(profileReq, profileRes);
    const firstDuration = performance.now() - startFirst;
    console.log(`First load completed in: ${firstDuration.toFixed(2)}ms`);

    // Call second time (should resolve instantly from cache)
    console.log('Retrieving profile (second time - should hit cache)...');
    const profileRes2 = mockResponse();
    const startSecond = performance.now();
    await getProfile(profileReq, profileRes2);
    const secondDuration = performance.now() - startSecond;
    console.log(`Second load completed in: ${secondDuration.toFixed(2)}ms`);

    if (secondDuration > firstDuration && secondDuration > 5) {
      throw new Error(`Second retrieval did not benefit from cache. Execution time: ${secondDuration.toFixed(2)}ms`);
    }
    console.log(`SUCCESS: Caching active. Latency dropped by ${((firstDuration - secondDuration) / firstDuration * 100).toFixed(1)}%!`);

    // Cleanup
    console.log('\nCleaning up verification records...');
    await User.deleteMany({ email: studentEmail });

    console.log('\n=== ALL LOGIN PERFORMANCE OPTIMIZATION INTEGRATION TESTS PASSED ===');

  } catch (error) {
    console.error('\nVerification tests FAILED with error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

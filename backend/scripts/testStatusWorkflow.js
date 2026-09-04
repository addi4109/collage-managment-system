import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { connectDB } from '../config/database.js';
import { loginStudent } from '../controllers/authController.js';

dotenv.config();

// Mock express response helper
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
  console.log('Starting Status Workflow verification tests...');
  await connectDB();

  try {
    const testEmail = 'test-status@edutech.com';
    const testPassword = 'password123';

    // Cleanup old test user
    await User.deleteMany({ email: testEmail });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testPassword, salt);

    // Create the test student user template
    const userDoc = new User({
      name: 'Test Status Student',
      email: testEmail,
      passwordHash,
      role: 'student',
      status: 'pending',
    });
    const savedUser = await userDoc.save();

    const studentDoc = new Student({
      user: savedUser._id,
      rollNumber: 'TST999999',
      department: 'Testing Science',
    });
    await studentDoc.save();

    const statusesToTest = [
      {
        status: 'pending',
        expectedCode: 403,
        expectedMessage: 'Your account is pending administrator approval.',
      },
      {
        status: 'rejected',
        expectedCode: 403,
        expectedMessage: 'Your account request has been rejected.',
      },
      {
        status: 'suspended',
        expectedCode: 403,
        expectedMessage: 'Your account has been suspended. Contact administration.',
      },
      {
        status: 'approved',
        expectedCode: 200,
      },
      {
        status: 'active',
        expectedCode: 200,
      },
    ];

    for (const testCase of statusesToTest) {
      console.log(`\nTesting status: [${testCase.status}]`);
      
      // Update database status
      await User.findByIdAndUpdate(savedUser._id, { status: testCase.status });

      // Run controller
      const req = {
        body: {
          email: testEmail,
          password: testPassword,
        },
      };
      const res = mockResponse();

      await loginStudent(req, res);

      const code = res.statusCode || 200;
      const data = res.jsonData || {};

      console.log(`Response Code: ${code}`);
      console.log(`Response Body: ${JSON.stringify(data)}`);

      if (code !== testCase.expectedCode) {
        throw new Error(`Test failed: Expected status code ${testCase.expectedCode}, got ${code}`);
      }

      if (testCase.expectedMessage && data.message !== testCase.expectedMessage) {
        throw new Error(`Test failed: Expected message "${testCase.expectedMessage}", got "${data.message}"`);
      }

      console.log(`Status [${testCase.status}] verification passed!`);
    }

    // Clean up
    await Student.deleteOne({ user: savedUser._id });
    await User.deleteOne({ _id: savedUser._id });
    console.log('\nVerification completed successfully! All status workflow cases verified.');

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

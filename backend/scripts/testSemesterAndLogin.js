import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { connectDB } from '../config/database.js';
import { registerStudent, loginStudent } from '../controllers/authController.js';

dotenv.config();

// Mock Express Response helper
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
  console.log('=== Starting Semester and Login Integration Tests ===');
  await connectDB();

  try {
    const studentEmail = 'test-semester-student@edutech.com';
    const studentPassword = 'Password123!';
    const studentName = 'Test Semester Student';
    const studentDept = 'Electrical Engineering';
    const studentSem = 'Semester 6';

    // Cleanup old test records
    const existingStudent = await User.findOne({ email: studentEmail });
    if (existingStudent) {
      await Student.deleteMany({ user: existingStudent._id });
      await User.deleteMany({ _id: existingStudent._id });
    }

    // 1. Verify Student Registration with Semester & Department
    console.log('\n--- 1. Testing Student Registration with Semester ---');
    const registerReq = {
      body: {
        name: studentName,
        email: studentEmail,
        password: studentPassword,
        department: studentDept,
        semester: studentSem,
      },
    };
    const registerRes = mockResponse();
    await registerStudent(registerReq, registerRes);

    if (registerRes.statusCode && registerRes.statusCode !== 201) {
      throw new Error(`Student registration failed: ${JSON.stringify(registerRes.jsonData)}`);
    }

    console.log('Student Registration Response:', registerRes.jsonData);

    const registeredStudentUser = await User.findOne({ email: studentEmail });
    if (!registeredStudentUser) {
      throw new Error('Student User document not found in DB');
    }
    if (registeredStudentUser.department !== studentDept || registeredStudentUser.semester !== studentSem) {
      throw new Error(`User document has wrong department or semester. Dept: ${registeredStudentUser.department}, Sem: ${registeredStudentUser.semester}`);
    }

    const registeredStudentProfile = await Student.findOne({ user: registeredStudentUser._id });
    if (!registeredStudentProfile) {
      throw new Error('Student collection profile document not found in DB');
    }
    if (registeredStudentProfile.department !== studentDept || registeredStudentProfile.semester !== studentSem) {
      throw new Error(`Student profile has wrong department or semester. Dept: ${registeredStudentProfile.department}, Sem: ${registeredStudentProfile.semester}`);
    }
    console.log('✓ Student registered and saved correctly in both collections.');

    // 2. Testing Student Login
    console.log('\n--- 2. Testing Student Login & Semester Return ---');
    
    // Set status to approved so login succeeds
    await User.findByIdAndUpdate(registeredStudentUser._id, { status: 'approved' });

    const loginReq = {
      body: {
        email: studentEmail,
        password: studentPassword,
      },
    };
    const loginRes = mockResponse();
    await loginStudent(loginReq, loginRes);

    if (loginRes.statusCode === 401 || loginRes.statusCode === 403) {
      throw new Error(`Student login failed: ${JSON.stringify(loginRes.jsonData)}`);
    }

    console.log('Login Response payload:', loginRes.jsonData);
    if (!loginRes.jsonData.token) {
      throw new Error('Login response missing JWT token');
    }
    if (loginRes.jsonData.user.semester !== studentSem || loginRes.jsonData.user.department !== studentDept) {
      throw new Error(`Login response has wrong user metadata. Sem: ${loginRes.jsonData.user.semester}`);
    }
    console.log('✓ Student logged in successfully and semester metadata returned correctly.');

    console.log('\n=== All Semester and Login Integration Tests Passed Successfully! ===');
  } catch (err) {
    console.error('Integration Test Failed:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

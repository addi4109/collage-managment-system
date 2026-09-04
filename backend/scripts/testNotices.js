import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Notice from '../models/Notice.js';
import { connectDB } from '../config/database.js';
import { createNotice, getAllNotices, deleteNotice } from '../controllers/noticeController.js';

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
  console.log('Starting Notice Board verification tests...');
  await connectDB();

  let facultyA, facultyB, studentUser, adminUser;

  try {
    // 1. Cleanup old test users and notices
    const emails = [
      'fac-a-test@edutech.com',
      'fac-b-test@edutech.com',
      'stu-test@edutech.com',
      'adm-test@edutech.com'
    ];
    await User.deleteMany({ email: { $in: emails } });
    await Notice.deleteMany({ title: { $regex: 'Test Notice' } });

    // 2. Seed test users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    facultyA = await new User({
      name: 'Faculty A',
      email: 'fac-a-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    facultyB = await new User({
      name: 'Faculty B',
      email: 'fac-b-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    studentUser = await new User({
      name: 'Student User',
      email: 'stu-test@edutech.com',
      passwordHash,
      role: 'student',
      status: 'active'
    }).save();

    adminUser = await new User({
      name: 'Admin User',
      email: 'adm-test@edutech.com',
      passwordHash,
      role: 'admin',
      status: 'active'
    }).save();

    console.log('Test users seeded successfully.');

    let createdNoticeId;

    // --- TEST 1: Faculty A creates a high priority notice (Should succeed) ---
    console.log('\n--- Test 1: Faculty A creates notice ---');
    const req1 = {
      user: { id: facultyA._id.toString(), name: facultyA.name, role: facultyA.role },
      body: { title: 'Test Notice by Fac A', message: 'This is a test notice message', priority: 'high' }
    };
    const res1 = mockResponse();
    await createNotice(req1, res1);

    console.log(`Response Code: ${res1.statusCode || 201}`);
    console.log(`Response Body: ${JSON.stringify(res1.jsonData)}`);
    if ((res1.statusCode || 201) !== 201) {
      throw new Error('Test 1 failed: Expected status code 201');
    }
    createdNoticeId = res1.jsonData._id.toString();

    // --- TEST 2: Student tries to create a notice (Should fail with 403) ---
    console.log('\n--- Test 2: Student tries to create notice ---');
    const req2 = {
      user: { id: studentUser._id.toString(), name: studentUser.name, role: studentUser.role },
      body: { title: 'Test Notice by Student', message: 'Should not work' }
    };
    const res2 = mockResponse();
    await createNotice(req2, res2);

    console.log(`Response Code: ${res2.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res2.jsonData)}`);
    if (res2.statusCode !== 403) {
      throw new Error('Test 2 failed: Student should be blocked from creating notices (403)');
    }

    // --- TEST 3: All users (e.g. Student) fetch notices (Should succeed with 200) ---
    console.log('\n--- Test 3: Fetch notices as student ---');
    const req3 = {
      user: { id: studentUser._id.toString(), name: studentUser.name, role: studentUser.role }
    };
    const res3 = mockResponse();
    await getAllNotices(req3, res3);

    console.log(`Response Code: ${res3.statusCode || 200}`);
    console.log(`Notices Count: ${res3.jsonData.length}`);
    if ((res3.statusCode || 200) !== 200 || res3.jsonData.length === 0) {
      throw new Error('Test 3 failed: Fetch notices should succeed and return data');
    }

    // --- TEST 4: Faculty B tries to delete Faculty A\'s notice (Should fail with 403) ---
    console.log('\n--- Test 4: Faculty B deletes Faculty A notice ---');
    const req4 = {
      user: { id: facultyB._id.toString(), name: facultyB.name, role: facultyB.role },
      params: { id: createdNoticeId }
    };
    const res4 = mockResponse();
    await deleteNotice(req4, res4);

    console.log(`Response Code: ${res4.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res4.jsonData)}`);
    if (res4.statusCode !== 403) {
      throw new Error('Test 4 failed: Faculty B should be blocked from deleting Faculty A notice (403)');
    }

    // --- TEST 5: Student tries to delete Faculty A\'s notice (Should fail with 403) ---
    console.log('\n--- Test 5: Student deletes Faculty A notice ---');
    const req5 = {
      user: { id: studentUser._id.toString(), name: studentUser.name, role: studentUser.role },
      params: { id: createdNoticeId }
    };
    const res5 = mockResponse();
    await deleteNotice(req5, res5);

    console.log(`Response Code: ${res5.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res5.jsonData)}`);
    if (res5.statusCode !== 403) {
      throw new Error('Test 5 failed: Student should be blocked from deleting Faculty A notice (403)');
    }

    // --- TEST 6: Faculty A deletes their own notice (Should succeed) ---
    console.log('\n--- Test 6: Faculty A deletes own notice ---');
    const req6 = {
      user: { id: facultyA._id.toString(), name: facultyA.name, role: facultyA.role },
      params: { id: createdNoticeId }
    };
    const res6 = mockResponse();
    await deleteNotice(req6, res6);

    console.log(`Response Code: ${res6.statusCode || 200}`);
    console.log(`Response Body: ${JSON.stringify(res6.jsonData)}`);
    if ((res6.statusCode || 200) !== 200) {
      throw new Error('Test 6 failed: Faculty A should delete their own notice successfully (200)');
    }

    // --- TEST 7: Faculty A creates another notice, and Admin deletes it (Should succeed) ---
    console.log('\n--- Test 7: Admin deletes Faculty A notice ---');
    // Create new one first
    const resCreate = mockResponse();
    await createNotice(req1, resCreate);
    const secondNoticeId = resCreate.jsonData._id.toString();

    // Admin deletes it
    const req7 = {
      user: { id: adminUser._id.toString(), name: adminUser.name, role: adminUser.role },
      params: { id: secondNoticeId }
    };
    const res7 = mockResponse();
    await deleteNotice(req7, res7);

    console.log(`Response Code: ${res7.statusCode || 200}`);
    console.log(`Response Body: ${JSON.stringify(res7.jsonData)}`);
    if ((res7.statusCode || 200) !== 200) {
      throw new Error('Test 7 failed: Admin should delete notice successfully (200)');
    }

    console.log('\nAll Notice Board tests passed successfully!');

    // Cleanup
    await User.deleteMany({ email: { $in: emails } });
    await Notice.deleteMany({ title: { $regex: 'Test Notice' } });

  } catch (error) {
    console.error('Test execution failed:', error);
    // Attempt cleanup in case of failure
    if (facultyA) await User.deleteMany({ email: { $in: ['fac-a-test@edutech.com', 'fac-b-test@edutech.com', 'stu-test@edutech.com', 'adm-test@edutech.com'] } });
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

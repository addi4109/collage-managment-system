import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import LostFound from '../models/LostFound.js';
import { connectDB } from '../config/database.js';
import {
  createLostFound,
  updateLostFound,
  deleteLostFound,
  getAllLostFound,
  addReply,
  getReplies,
} from '../controllers/lostFoundController.js';

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
  console.log('Starting Lost & Found Board verification tests...');
  await connectDB();

  let facultyA, facultyB, studentUser, adminUser;

  try {
    // 1. Cleanup old test users and entries
    const emails = [
      'fac-a-lf-test@edutech.com',
      'fac-b-lf-test@edutech.com',
      'stu-lf-test@edutech.com',
      'adm-lf-test@edutech.com'
    ];
    await User.deleteMany({ email: { $in: emails } });
    await LostFound.deleteMany({ title: { $regex: 'Test LF Item' } });

    // 2. Seed test users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    facultyA = await new User({
      name: 'Faculty A',
      email: 'fac-a-lf-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    facultyB = await new User({
      name: 'Faculty B',
      email: 'fac-b-lf-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    studentUser = await new User({
      name: 'Student User',
      email: 'stu-lf-test@edutech.com',
      passwordHash,
      role: 'student',
      status: 'active'
    }).save();

    adminUser = await new User({
      name: 'Admin User',
      email: 'adm-lf-test@edutech.com',
      passwordHash,
      role: 'admin',
      status: 'active'
    }).save();

    console.log('Test users seeded successfully.');

    let createdItemId;

    // --- TEST 1: Faculty A creates lost item (Should succeed) ---
    console.log('\n--- Test 1: Faculty A creates LostFound entry ---');
    const req1 = {
      user: { id: facultyA._id.toString(), name: facultyA.name, role: facultyA.role },
      body: { title: 'Test LF Item 1', description: 'Keys found in class 404', type: 'found', location: 'Class 404', date: new Date().toISOString() }
    };
    const res1 = mockResponse();
    await createLostFound(req1, res1);

    console.log(`Response Code: ${res1.statusCode || 201}`);
    console.log(`Response Body: ${JSON.stringify(res1.jsonData)}`);
    if ((res1.statusCode || 201) !== 201) {
      throw new Error('Test 1 failed: Expected status code 201');
    }
    createdItemId = res1.jsonData._id.toString();

    // --- TEST 2: Student fetches all entries (Should succeed) ---
    console.log('\n--- Test 2: Student fetches all entries ---');
    const req2 = {
      user: { id: studentUser._id.toString(), name: studentUser.name, role: studentUser.role }
    };
    const res2 = mockResponse();
    await getAllLostFound(req2, res2);

    console.log(`Response Code: ${res2.statusCode || 200}`);
    console.log(`Items count: ${res2.jsonData.length}`);
    if ((res2.statusCode || 200) !== 200 || res2.jsonData.length === 0) {
      throw new Error('Test 2 failed: Fetching items should succeed and return items');
    }

    // --- TEST 3: Student tries to edit Faculty A\'s entry (Should fail 403) ---
    console.log('\n--- Test 3: Student tries to edit Faculty A entry ---');
    const req3 = {
      user: { id: studentUser._id.toString(), name: studentUser.name, role: studentUser.role },
      params: { id: createdItemId },
      body: { title: 'Hacked Title' }
    };
    const res3 = mockResponse();
    await updateLostFound(req3, res3);

    console.log(`Response Code: ${res3.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res3.jsonData)}`);
    if (res3.statusCode !== 403) {
      throw new Error('Test 3 failed: Student should be forbidden from editing entry (403)');
    }

    // --- TEST 4: Student successfully replies to the entry ---
    console.log('\n--- Test 4: Student replies to the entry ---');
    const req4 = {
      user: { id: studentUser._id.toString(), name: studentUser.name, role: studentUser.role },
      params: { id: createdItemId },
      body: { message: 'I lost my keys, this might be mine!', contactInfo: '555-0123' }
    };
    const res4 = mockResponse();
    await addReply(req4, res4);

    console.log(`Response Code: ${res4.statusCode || 201}`);
    console.log(`Response Body: ${JSON.stringify(res4.jsonData)}`);
    if ((res4.statusCode || 201) !== 201) {
      throw new Error('Test 4 failed: Student should reply successfully (201)');
    }

    // --- TEST 5: Faculty A fetches replies (Should succeed) ---
    console.log('\n--- Test 5: Faculty A fetches replies ---');
    const req5 = {
      user: { id: facultyA._id.toString(), name: facultyA.name, role: facultyA.role },
      params: { id: createdItemId }
    };
    const res5 = mockResponse();
    await getReplies(req5, res5);

    console.log(`Response Code: ${res5.statusCode || 200}`);
    console.log(`Replies Count: ${res5.jsonData.length}`);
    console.log(`Replies Body: ${JSON.stringify(res5.jsonData)}`);
    if ((res5.statusCode || 200) !== 200 || res5.jsonData.length !== 1) {
      throw new Error('Test 5 failed: Faculty A should view replies successfully');
    }

    // --- TEST 6: Faculty B tries to fetch replies (Should fail 403) ---
    console.log('\n--- Test 6: Faculty B tries to fetch replies ---');
    const req6 = {
      user: { id: facultyB._id.toString(), name: facultyB.name, role: facultyB.role },
      params: { id: createdItemId }
    };
    const res6 = mockResponse();
    await getReplies(req6, res6);

    console.log(`Response Code: ${res6.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res6.jsonData)}`);
    if (res6.statusCode !== 403) {
      throw new Error('Test 6 failed: Faculty B should be forbidden from viewing Faculty A replies (403)');
    }

    // --- TEST 7: Faculty B tries to delete entry (Should fail 403) ---
    console.log('\n--- Test 7: Faculty B deletes Faculty A entry ---');
    const req7 = {
      user: { id: facultyB._id.toString(), name: facultyB.name, role: facultyB.role },
      params: { id: createdItemId }
    };
    const res7 = mockResponse();
    await deleteLostFound(req7, res7);

    console.log(`Response Code: ${res7.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res7.jsonData)}`);
    if (res7.statusCode !== 403) {
      throw new Error('Test 7 failed: Faculty B should be forbidden from deleting Faculty A entry (403)');
    }

    // --- TEST 8: Admin deletes the entry (Should succeed) ---
    console.log('\n--- Test 8: Admin deletes entry ---');
    const req8 = {
      user: { id: adminUser._id.toString(), name: adminUser.name, role: adminUser.role },
      params: { id: createdItemId }
    };
    const res8 = mockResponse();
    await deleteLostFound(req8, res8);

    console.log(`Response Code: ${res8.statusCode || 200}`);
    console.log(`Response Body: ${JSON.stringify(res8.jsonData)}`);
    if ((res8.statusCode || 200) !== 200) {
      throw new Error('Test 8 failed: Admin should delete entry card successfully (200)');
    }

    console.log('\nAll Lost & Found Board tests passed successfully!');

    // Cleanup
    await User.deleteMany({ email: { $in: emails } });
    await LostFound.deleteMany({ title: { $regex: 'Test LF Item' } });

  } catch (error) {
    console.error('Test execution failed:', error);
    await User.deleteMany({ email: { $in: ['fac-a-lf-test@edutech.com', 'fac-b-lf-test@edutech.com', 'stu-lf-test@edutech.com', 'adm-lf-test@edutech.com'] } });
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

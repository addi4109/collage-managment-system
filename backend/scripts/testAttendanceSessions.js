import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Attendance from '../models/Attendance.js';
import { connectDB } from '../config/database.js';
import { createSession, startSession, endSession, getSessions } from '../controllers/sessionController.js';
import { checkin } from '../controllers/attendanceController.js';

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
  console.log('=== STARTING STATEFUL ATTENDANCE SESSION INTEGRATION TESTS ===');
  await connectDB();

  try {
    const studentEmail = 'session-student-test@edutech.com';
    const facultyEmail = 'session-faculty-test@edutech.com';
    const password = 'password123';

    // Cleanup previous test profiles
    await User.deleteMany({ email: { $in: [studentEmail, facultyEmail] } });
    await AttendanceSession.deleteMany({});
    await Attendance.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Create student and faculty records
    console.log('Seeding test student and faculty user profiles...');
    const studentUser = new User({
      name: 'Session Student',
      email: studentEmail,
      passwordHash,
      role: 'student',
      status: 'active',
    });
    const savedStudentUser = await studentUser.save();

    const studentProfile = new Student({
      user: savedStudentUser._id,
      rollNumber: 'SES777777',
      department: 'Computer Science',
    });
    await studentProfile.save();

    const facultyUser = new User({
      name: 'Dr. Sessions',
      email: facultyEmail,
      passwordHash,
      role: 'faculty',
      status: 'active',
    });
    const savedFacultyUser = await facultyUser.save();
    console.log('Users seeded successfully.');

    // 2. Test Session Creation
    console.log('\n--- Testing Session Creation (Status: created) ---');
    const createReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      body: {
        facultyName: 'Dr. Sessions',
        courseName: 'CS202 - Database Systems',
        sessionTitle: 'Lecture 12: SQL Joins',
        department: 'Computer Science',
        date: '2026-06-23',
        startTime: '10:00',
        duration: 5,
        description: 'Introduction to Inner, Left, and Outer joins.',
      },
    };
    const createRes = mockResponse();
    await createSession(createReq, createRes);

    if (createRes.statusCode && createRes.statusCode !== 201) {
      throw new Error(`Session creation failed with code ${createRes.statusCode}: ${JSON.stringify(createRes.jsonData)}`);
    }
    const createdSession = createRes.jsonData;
    console.log('Session created successfully:', JSON.stringify(createdSession));
    if (createdSession.status !== 'created') {
      throw new Error(`Expected initial status to be "created", got "${createdSession.status}"`);
    }
    if (createdSession.sessionToken) {
      throw new Error('Expected sessionToken to be empty on creation.');
    }

    // 3. Test Retrieve My Sessions (Faculty)
    console.log('\n--- Testing Retrieve Sessions List (Faculty) ---');
    const listReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' }
    };
    const listRes = mockResponse();
    await getSessions(listReq, listRes);

    const sessionsList = listRes.jsonData || [];
    console.log(`Retrieved ${sessionsList.length} sessions.`);
    if (sessionsList.length === 0) {
      throw new Error('No sessions retrieved.');
    }
    console.log('Retrieve sessions list test passed!');

    // 4. Test Start Session (Status: active, token generated)
    console.log('\n--- Testing Start Session (Status: active) ---');
    const startReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      params: { id: createdSession._id.toString() }
    };
    const startRes = mockResponse();
    await startSession(startReq, startRes);

    const activeSession = startRes.jsonData;
    console.log('Session activated successfully:', JSON.stringify(activeSession));
    if (activeSession.status !== 'active') {
      throw new Error(`Expected active status to be "active", got "${activeSession.status}"`);
    }
    if (!activeSession.sessionToken) {
      throw new Error('Expected sessionToken to be generated.');
    }
    if (!activeSession.expiresAt) {
      throw new Error('Expected expiresAt date to be set.');
    }
    console.log('Start session test passed!');

    // 5. Test Student Check-In (Present status, session reference)
    console.log('\n--- Testing Student Check-In (Present) ---');
    const checkinReq = {
      user: { id: savedStudentUser._id.toString(), role: 'student' },
      body: { sessionToken: activeSession.sessionToken }
    };
    const checkinRes = mockResponse();
    await checkin(checkinReq, checkinRes);

    if (checkinRes.statusCode && checkinRes.statusCode !== 201) {
      throw new Error(`Check-in failed with code ${checkinRes.statusCode}: ${JSON.stringify(checkinRes.jsonData)}`);
    }
    console.log('Check-in successful response:', JSON.stringify(checkinRes.jsonData));

    // Verify record in Database
    const records = await Attendance.find({ student: savedStudentUser._id });
    if (records.length !== 1) {
      throw new Error(`Expected 1 attendance record for student, found ${records.length}`);
    }
    if (records[0].session.toString() !== activeSession._id.toString()) {
      throw new Error('Attendance record is not linked to the correct session ID.');
    }
    console.log('Student check-in test passed!');

    // 6. Test Prevent Duplicate Check-In
    console.log('\n--- Testing Duplicate Check-In Protection ---');
    const dupRes = mockResponse();
    await checkin(checkinReq, dupRes);

    if (dupRes.statusCode !== 400) {
      throw new Error(`Expected HTTP 400 on duplicate check-in, got ${dupRes.statusCode}`);
    }
    if (dupRes.jsonData?.message !== 'You have already checked in for this session.') {
      throw new Error(`Unexpected error message on duplicate checkin: ${JSON.stringify(dupRes.jsonData)}`);
    }
    console.log('Duplicate check-in protection verified successfully!');

    // 7. Test End Session (Status: ended, token invalidated)
    console.log('\n--- Testing End Session (Status: ended) ---');
    const endReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      params: { id: activeSession._id.toString() }
    };
    const endRes = mockResponse();
    await endSession(endReq, endRes);

    const endedSession = endRes.jsonData;
    console.log('Session ended successfully:', JSON.stringify(endedSession));
    if (endedSession.status !== 'ended') {
      throw new Error(`Expected status to be "ended", got "${endedSession.status}"`);
    }
    if (endedSession.sessionToken) {
      throw new Error('Expected sessionToken to be cleared/undefined after ending.');
    }
    console.log('End session test passed!');

    // 8. Test Check-In Fails on Ended Session
    console.log('\n--- Testing Check-In Fails After Session Ends ---');
    const expiredCheckReq = {
      user: { id: savedStudentUser._id.toString(), role: 'student' },
      body: { sessionToken: activeSession.sessionToken } // using old token
    };
    const expiredCheckRes = mockResponse();
    await checkin(expiredCheckReq, expiredCheckRes);

    if (expiredCheckRes.statusCode !== 404) {
      throw new Error(`Expected HTTP 404 on inactive/ended token check-in, got ${expiredCheckRes.statusCode}`);
    }
    console.log('Check-in rejection for ended session verified!');

    // Cleanup
    console.log('\nCleaning up verification records...');
    await Attendance.deleteMany({ student: savedStudentUser._id });
    await AttendanceSession.deleteMany({ facultyId: savedFacultyUser._id });
    await Student.deleteOne({ user: savedStudentUser._id });
    await User.deleteMany({ _id: { $in: [savedStudentUser._id, savedFacultyUser._id] } });

    console.log('\n=== ALL STATEFUL ATTENDANCE SESSION INTEGRATION TESTS PASSED ===');

  } catch (error) {
    console.error('\nVerification tests FAILED with error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

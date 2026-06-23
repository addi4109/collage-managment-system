import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Attendance from '../models/Attendance.js';
import { connectDB } from '../config/database.js';
import { createSession, startSession, endSession } from '../controllers/sessionController.js';
import { checkInStudent, getFacultySessions, getSessionAttendance } from '../controllers/attendanceController.js';

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
  console.log('=== STARTING SESSION ATTENDANCE INTEGRATION TESTS ===');
  await connectDB();

  try {
    const studentEmail = 'test-student-checkin@edutech.com';
    const facultyEmail = 'test-faculty-checkin@edutech.com';
    const otherFacultyEmail = 'test-other-faculty-checkin@edutech.com';
    const password = 'password123';

    // Cleanup previous test profiles
    await User.deleteMany({ email: { $in: [studentEmail, facultyEmail, otherFacultyEmail] } });
    await AttendanceSession.deleteMany({});
    await Attendance.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Create student and faculty records
    console.log('Seeding test student and faculty user profiles...');
    const studentUser = new User({
      name: 'Checkin Student',
      email: studentEmail,
      passwordHash,
      role: 'student',
      status: 'active',
    });
    const savedStudentUser = await studentUser.save();

    const studentProfile = new Student({
      user: savedStudentUser._id,
      rollNumber: 'CHK999999',
      department: 'Computer Science',
    });
    await studentProfile.save();

    const facultyUser = new User({
      name: 'Dr. Checkin',
      email: facultyEmail,
      passwordHash,
      role: 'faculty',
      status: 'active',
    });
    const savedFacultyUser = await facultyUser.save();

    const otherFacultyUser = new User({
      name: 'Dr. Unauthorized',
      email: otherFacultyEmail,
      passwordHash,
      role: 'faculty',
      status: 'active',
    });
    const savedOtherFacultyUser = await otherFacultyUser.save();
    console.log('Users seeded successfully.');

    // 2. Test Session Creation
    console.log('\n--- Testing Session Creation ---');
    const createReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      body: {
        facultyName: 'Dr. Checkin',
        courseName: 'CS301 - Web Engineering',
        sessionTitle: 'Session-based checkin demo',
        department: 'Computer Science',
        date: '2026-06-23',
        startTime: '14:00',
        duration: 10,
        description: 'Testing automatic session-based check-ins.',
      },
    };
    const createRes = mockResponse();
    await createSession(createReq, createRes);

    if (createRes.statusCode && createRes.statusCode !== 201) {
      throw new Error(`Session creation failed with code ${createRes.statusCode}: ${JSON.stringify(createRes.jsonData)}`);
    }
    const createdSession = createRes.jsonData;
    console.log('Session created successfully:', JSON.stringify(createdSession));

    // 3. Test Start Session
    console.log('\n--- Testing Start Session (to get sessionToken) ---');
    const startReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      params: { id: createdSession._id.toString() }
    };
    const startRes = mockResponse();
    await startSession(startReq, startRes);

    const activeSession = startRes.jsonData;
    console.log('Session started:', JSON.stringify(activeSession));

    // 4. Test Student Check-In
    console.log('\n--- Testing Student Check-In (Automatic Attendance) ---');
    const checkinReq = {
      user: {
        id: savedStudentUser._id.toString(),
        name: savedStudentUser.name,
        role: 'student',
        status: 'active',
        email: savedStudentUser.email
      },
      body: { sessionToken: activeSession.sessionToken }
    };
    const checkinRes = mockResponse();
    await checkInStudent(checkinReq, checkinRes);

    if (checkinRes.statusCode && checkinRes.statusCode !== 201) {
      throw new Error(`Check-in failed with code ${checkinRes.statusCode}: ${JSON.stringify(checkinRes.jsonData)}`);
    }
    console.log('Check-in successful response:', JSON.stringify(checkinRes.jsonData));

    // Verify record in Database has new fields
    const records = await Attendance.find({ studentId: savedStudentUser._id });
    if (records.length !== 1) {
      throw new Error(`Expected 1 attendance record for student, found ${records.length}`);
    }
    const record = records[0];
    console.log('Verifying saved Mongoose document fields:');
    console.log(`- studentId: ${record.studentId}`);
    console.log(`- student: ${record.student}`);
    console.log(`- studentName: ${record.studentName}`);
    console.log(`- facultyId: ${record.facultyId}`);
    console.log(`- faculty: ${record.faculty}`);
    console.log(`- sessionId: ${record.sessionId}`);
    console.log(`- session: ${record.session}`);
    console.log(`- status: ${record.status}`);
    console.log(`- checkInTime: ${record.checkInTime}`);

    if (record.studentName !== 'Checkin Student') {
      throw new Error(`Expected studentName to be 'Checkin Student', got '${record.studentName}'`);
    }
    if (record.sessionId.toString() !== activeSession._id.toString()) {
      throw new Error('Attendance record is not linked to correct sessionId.');
    }
    console.log('Database verification passed!');

    // 5. Test Prevent Duplicate Check-In
    console.log('\n--- Testing Duplicate Check-In Protection ---');
    const dupRes = mockResponse();
    await checkInStudent(checkinReq, dupRes);

    if (dupRes.statusCode !== 400) {
      throw new Error(`Expected HTTP 400 on duplicate check-in, got ${dupRes.statusCode}`);
    }
    if (dupRes.jsonData?.message !== 'You have already checked in for this session.') {
      throw new Error(`Unexpected error message on duplicate checkin: ${JSON.stringify(dupRes.jsonData)}`);
    }
    console.log('Duplicate check-in protection verified successfully!');

    // 6. Test Fetch Sessions (Faculty Panel)
    console.log('\n--- Testing Fetch Faculty Sessions ---');
    const getSessionsReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' }
    };
    const getSessionsRes = mockResponse();
    await getFacultySessions(getSessionsReq, getSessionsRes);

    if (getSessionsRes.statusCode === 500) {
      throw new Error('Failed to retrieve faculty sessions list.');
    }
    const facultySessions = getSessionsRes.jsonData;
    console.log(`Retrieved ${facultySessions.length} sessions for faculty.`);
    if (facultySessions[0]._id.toString() !== activeSession._id.toString()) {
      throw new Error('Sorted sessions did not return correct newest session first.');
    }
    console.log('Fetch faculty sessions test passed!');

    // 7. Test View Attendance (Faculty Panel)
    console.log('\n--- Testing View Session Attendance ---');
    const getAttendanceReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      params: { sessionId: activeSession._id.toString() }
    };
    const getAttendanceRes = mockResponse();
    await getSessionAttendance(getAttendanceReq, getAttendanceRes);

    const attendanceData = getAttendanceRes.jsonData;
    console.log('Attendance report payload:', JSON.stringify(attendanceData));
    if (attendanceData.totalPresent !== 1) {
      throw new Error(`Expected 1 student present, got ${attendanceData.totalPresent}`);
    }
    const studentCheckin = attendanceData.presentStudents[0];
    if (studentCheckin.rollNumber !== 'CHK999999' || studentCheckin.studentName !== 'Checkin Student') {
      throw new Error(`Incorrect student details returned: ${JSON.stringify(studentCheckin)}`);
    }
    console.log('View session attendance test passed!');

    // 8. Test Prevent Other Faculty from Accessing Session
    console.log('\n--- Testing Security: Prevent Unauthorized Access to Sessions ---');
    const unauthReq = {
      user: { id: savedOtherFacultyUser._id.toString(), role: 'faculty' },
      params: { sessionId: activeSession._id.toString() }
    };
    const unauthRes = mockResponse();
    await getSessionAttendance(unauthReq, unauthRes);

    if (unauthRes.statusCode !== 403) {
      throw new Error(`Expected HTTP 403 for unauthorized faculty session view, got ${unauthRes.statusCode}`);
    }
    console.log('Security access check verified successfully!');

    // 9. End Session & Reject Check-in
    console.log('\n--- Testing End Session and Check-in Rejection ---');
    const endReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      params: { id: activeSession._id.toString() }
    };
    const endRes = mockResponse();
    await endSession(endReq, endRes);

    const expiredCheckinRes = mockResponse();
    await checkInStudent(checkinReq, expiredCheckinRes);

    if (expiredCheckinRes.statusCode !== 404) {
      throw new Error(`Expected HTTP 404 for check-in on ended session, got ${expiredCheckinRes.statusCode}`);
    }
    console.log('Check-in rejection on ended session verified!');

    // Cleanup
    console.log('\nCleaning up verification records...');
    await Attendance.deleteMany({ studentId: savedStudentUser._id });
    await AttendanceSession.deleteMany({ facultyId: savedFacultyUser._id });
    await Student.deleteOne({ user: savedStudentUser._id });
    await User.deleteMany({ _id: { $in: [savedStudentUser._id, savedFacultyUser._id, savedOtherFacultyUser._id] } });

    console.log('\n=== ALL SESSION ATTENDANCE INTEGRATION TESTS PASSED ===');

  } catch (error) {
    console.error('\nVerification tests FAILED with error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import { connectDB } from '../config/database.js';
import { createAssignment, getAssignments } from '../controllers/assignmentController.js';
import { getStudents, markAttendance, getAttendanceRecords } from '../controllers/attendanceController.js';

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
  console.log('=== STARTING ASSIGNMENTS & ATTENDANCE INTEGRATION TESTS ===');
  await connectDB();

  try {
    const studentEmail = 'student-test@edutech.com';
    const facultyEmail = 'faculty-test@edutech.com';
    const password = 'password123';

    // Cleanup previous test profiles
    await User.deleteMany({ email: { $in: [studentEmail, facultyEmail] } });
    await Assignment.deleteMany({});
    await Attendance.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Create student and faculty records
    console.log('Seeding test student and faculty user profiles...');
    const studentUser = new User({
      name: 'John Student',
      email: studentEmail,
      passwordHash,
      role: 'student',
      status: 'active',
    });
    const savedStudentUser = await studentUser.save();

    const studentProfile = new Student({
      user: savedStudentUser._id,
      rollNumber: 'STU777777',
      department: 'Computer Science',
      enrolledCourses: ['CS101', 'CS102'],
    });
    await studentProfile.save();

    const facultyUser = new User({
      name: 'Dr. Faculty',
      email: facultyEmail,
      passwordHash,
      role: 'faculty',
      status: 'active',
    });
    const savedFacultyUser = await facultyUser.save();

    const facultyProfile = new Faculty({
      user: savedFacultyUser._id,
      employeeId: 'FAC8888',
      department: 'Computer Science',
    });
    await facultyProfile.save();

    console.log('Users seeded successfully.');

    // 2. Test Assignment Creation
    console.log('\n--- Testing Assignment Creation (Faculty) ---');
    const createReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      body: {
        title: 'Algorithms Homework 1',
        description: 'Solve questions 1-5 from chapter 4 of Cormen.',
        courseName: 'CS101 - Algorithms',
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
        attachment: 'data:text/plain;base64,aGVsbG8gd29ybGQ=', // Mock Base64
        attachmentName: 'instructions.txt',
      },
    };
    const createRes = mockResponse();
    await createAssignment(createReq, createRes);

    if (createRes.statusCode && createRes.statusCode !== 201) {
      throw new Error(`Assignment creation failed with code ${createRes.statusCode}: ${JSON.stringify(createRes.jsonData)}`);
    }
    const createdAssignment = createRes.jsonData;
    console.log('Assignment created successfully:', JSON.stringify(createdAssignment));

    // 3. Test Retrieve Assignments
    console.log('\n--- Testing Retrieve Assignments (Student/Faculty) ---');
    const getReq = {
      user: { id: savedStudentUser._id.toString(), role: 'student' }
    };
    const getRes = mockResponse();
    await getAssignments(getReq, getRes);

    const assignmentsList = getRes.jsonData || [];
    console.log(`Retrieved ${assignmentsList.length} assignments.`);
    if (assignmentsList.length === 0) {
      throw new Error('No assignments retrieved.');
    }
    if (assignmentsList[0].title !== 'Algorithms Homework 1') {
      throw new Error(`Expected assignment title "Algorithms Homework 1", got "${assignmentsList[0].title}"`);
    }
    console.log('Retrieve assignments test passed!');

    // 4. Test Fetch Students List for Attendance
    console.log('\n--- Testing Get Students List (Faculty) ---');
    const getStudentsReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' }
    };
    const getStudentsRes = mockResponse();
    await getStudents(getStudentsReq, getStudentsRes);

    const studentList = getStudentsRes.jsonData || [];
    console.log(`Fetched ${studentList.length} active students.`);
    const foundStudent = studentList.find(s => s.user?._id.toString() === savedStudentUser._id.toString());
    if (!foundStudent) {
      throw new Error('Test student not found in active student roster.');
    }
    console.log('Fetch student roster passed!');

    // 5. Test Mark Attendance (Faculty)
    console.log('\n--- Testing Mark Attendance (Faculty) ---');
    const markDate = '2026-06-23';
    const markReq = {
      user: { id: savedFacultyUser._id.toString(), role: 'faculty' },
      body: {
        date: markDate,
        records: [
          { studentId: savedStudentUser._id.toString(), status: 'Present' }
        ],
      },
    };
    const markRes = mockResponse();
    await markAttendance(markReq, markRes);

    if (markRes.jsonData?.message !== 'Attendance records saved successfully.') {
      throw new Error(`Failed to save attendance: ${JSON.stringify(markRes.jsonData)}`);
    }
    console.log('Attendance marked successfully!');

    // 6. Test Retrieve Attendance Records
    console.log('\n--- Testing Retrieve Attendance Records (Student) ---');
    const getAttReq = {
      user: { id: savedStudentUser._id.toString(), role: 'student' },
      query: {}
    };
    const getAttRes = mockResponse();
    await getAttendanceRecords(getAttReq, getAttRes);

    const attList = getAttRes.jsonData || [];
    console.log(`Retrieved ${attList.length} attendance records for student.`);
    if (attList.length === 0) {
      throw new Error('No attendance records retrieved.');
    }
    if (attList[0].status !== 'Present') {
      throw new Error(`Expected attendance status 'Present', got '${attList[0].status}'`);
    }
    console.log('Retrieve attendance test passed!');

    // Cleanup
    console.log('\nCleaning up verification records...');
    await Attendance.deleteMany({ student: savedStudentUser._id });
    await Assignment.deleteMany({ faculty: savedFacultyUser._id });
    await Student.deleteOne({ user: savedStudentUser._id });
    await Faculty.deleteOne({ user: savedFacultyUser._id });
    await User.deleteMany({ _id: { $in: [savedStudentUser._id, savedFacultyUser._id] } });

    console.log('\n=== ALL ASSIGNMENTS & ATTENDANCE BACKEND INTEGRATION TESTS PASSED ===');

  } catch (error) {
    console.error('\nVerification tests FAILED with error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

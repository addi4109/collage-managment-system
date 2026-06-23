import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Report from '../models/Report.js';
import { connectDB } from '../config/database.js';
import {
  createReport,
  updateReport,
  publishReport,
  fetchFacultyReports,
  fetchStudentReport,
  deleteReport,
  calculateAttendanceStats,
} from '../controllers/reportController.js';

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
  console.log('Starting Editable Report Card verification tests...');
  await connectDB();

  let facultyA, facultyB, studentUser, adminUser;

  try {
    // 1. Cleanup old test users, reports, and attendance
    const emails = [
      'fac-a-rep-test@edutech.com',
      'fac-b-rep-test@edutech.com',
      'stu-rep-test@edutech.com',
      'adm-rep-test@edutech.com'
    ];
    await User.deleteMany({ email: { $in: emails } });
    await Report.deleteMany({ courseName: 'CS Test Course' });
    
    // 2. Seed test users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    facultyA = await new User({
      name: 'Faculty A',
      email: 'fac-a-rep-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    facultyB = await new User({
      name: 'Faculty B',
      email: 'fac-b-rep-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    studentUser = await new User({
      name: 'Student User',
      email: 'stu-rep-test@edutech.com',
      passwordHash,
      role: 'student',
      status: 'active'
    }).save();

    adminUser = await new User({
      name: 'Admin User',
      email: 'adm-rep-test@edutech.com',
      passwordHash,
      role: 'admin',
      status: 'active'
    }).save();

    console.log('Test users seeded successfully.');

    // 3. Seed attendance records for June 2026: 2 Present, 1 Absent (66.67%)
    await Attendance.deleteMany({ student: studentUser._id });
    await new Attendance({ student: studentUser._id, faculty: facultyA._id, date: new Date('2026-06-05'), status: 'Present' }).save();
    await new Attendance({ student: studentUser._id, faculty: facultyA._id, date: new Date('2026-06-12'), status: 'Present' }).save();
    await new Attendance({ student: studentUser._id, faculty: facultyA._id, date: new Date('2026-06-19'), status: 'Absent' }).save();
    console.log('Attendance test records seeded.');

    let createdReportId;

    // --- TEST 1: Calculate attendance stats (66.67%) ---
    console.log('\n--- Test 1: Calculate attendance stats dynamically ---');
    const req1 = {
      query: { studentId: studentUser._id.toString(), month: 'June', year: '2026' }
    };
    const res1 = mockResponse();
    await calculateAttendanceStats(req1, res1);

    console.log(`Response Code: ${res1.statusCode || 200}`);
    console.log(`Response Body: ${JSON.stringify(res1.jsonData)}`);
    if (res1.jsonData.attendancePercentage !== 66.67) {
      throw new Error('Test 1 failed: Expected attendance percentage to be 66.67%');
    }

    // --- TEST 2: Faculty A creates draft report card ---
    console.log('\n--- Test 2: Faculty A creates draft report ---');
    const req2 = {
      user: { id: facultyA._id.toString(), name: facultyA.name, role: facultyA.role },
      body: {
        studentId: studentUser._id.toString(),
        courseName: 'CS Test Course',
        month: 'June',
        year: 2026,
        totalClasses: res1.jsonData.totalClasses,
        attendedClasses: res1.jsonData.attendedClasses,
        attendancePercentage: res1.jsonData.attendancePercentage,
        subjects: [
          { subjectName: 'Software Engineering', internalMarks: 25, externalMarks: 60, totalMarks: 85 }
        ],
        remarks: 'Excellent work this term.',
        performanceGrade: 'A'
      }
    };
    const res2 = mockResponse();
    await createReport(req2, res2);

    console.log(`Response Code: ${res2.statusCode || 201}`);
    console.log(`Response Body: ${JSON.stringify(res2.jsonData)}`);
    if ((res2.statusCode || 201) !== 201) {
      throw new Error('Test 2 failed: Expected status code 201');
    }
    createdReportId = res2.jsonData._id.toString();

    // --- TEST 3: Student fetches reports (draft report should not be visible) ---
    console.log('\n--- Test 3: Student fetches reports (should be empty list) ---');
    const req3 = {
      user: { id: studentUser._id.toString(), name: studentUser.name, role: studentUser.role },
      params: { id: studentUser._id.toString() }
    };
    const res3 = mockResponse();
    await fetchStudentReport(req3, res3);

    console.log(`Response Code: ${res3.statusCode || 200}`);
    console.log(`Reports found: ${res3.jsonData.length}`);
    if (res3.jsonData.length !== 0) {
      throw new Error('Test 3 failed: Draft reports should not be returned to students');
    }

    // --- TEST 4: Faculty B tries to update Faculty A\'s draft report (should fail 403) ---
    console.log('\n--- Test 4: Faculty B updates Faculty A report ---');
    const req4 = {
      user: { id: facultyB._id.toString(), name: facultyB.name, role: facultyB.role },
      params: { id: createdReportId },
      body: { remarks: 'Hacked comment' }
    };
    const res4 = mockResponse();
    await updateReport(req4, res4);

    console.log(`Response Code: ${res4.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res4.jsonData)}`);
    if (res4.statusCode !== 403) {
      throw new Error('Test 4 failed: Faculty B should be blocked from updating Faculty A report (403)');
    }

    // --- TEST 5: Faculty A updates draft report successfully ---
    console.log('\n--- Test 5: Faculty A updates own draft report ---');
    const req5 = {
      user: { id: facultyA._id.toString(), name: facultyA.name, role: facultyA.role },
      params: { id: createdReportId },
      body: { remarks: 'Excellent progress, highly proactive.', performanceGrade: 'A+' }
    };
    const res5 = mockResponse();
    await updateReport(req5, res5);

    console.log(`Response Code: ${res5.statusCode || 200}`);
    console.log(`Response Body: ${JSON.stringify(res5.jsonData)}`);
    if (res5.jsonData.performanceGrade !== 'A+') {
      throw new Error('Test 5 failed: Faculty A should update own report successfully');
    }

    // --- TEST 6: Faculty A publishes the report ---
    console.log('\n--- Test 6: Faculty A publishes report ---');
    const req6 = {
      user: { id: facultyA._id.toString(), name: facultyA.name, role: facultyA.role },
      params: { id: createdReportId }
    };
    const res6 = mockResponse();
    await publishReport(req6, res6);

    console.log(`Response Code: ${res6.statusCode || 200}`);
    console.log(`Status after publishing: ${res6.jsonData.status}`);
    if (res6.jsonData.status !== 'published') {
      throw new Error('Test 6 failed: Report status should be updated to published');
    }

    // --- TEST 7: Student fetches reports now (published report should be visible) ---
    console.log('\n--- Test 7: Student fetches reports (published report visible) ---');
    const res7 = mockResponse();
    await fetchStudentReport(req3, res7);

    console.log(`Response Code: ${res7.statusCode || 200}`);
    console.log(`Reports found: ${res7.jsonData.length}`);
    if (res7.jsonData.length !== 1) {
      throw new Error('Test 7 failed: Published reports should be returned to students');
    }

    // --- TEST 8: Faculty B tries to delete Faculty A\'s published report (should fail 403) ---
    console.log('\n--- Test 8: Faculty B deletes Faculty A report ---');
    const req8 = {
      user: { id: facultyB._id.toString(), name: facultyB.name, role: facultyB.role },
      params: { id: createdReportId }
    };
    const res8 = mockResponse();
    await deleteReport(req8, res8);

    console.log(`Response Code: ${res8.statusCode}`);
    console.log(`Response Body: ${JSON.stringify(res8.jsonData)}`);
    if (res8.statusCode !== 403) {
      throw new Error('Test 8 failed: Faculty B should be blocked from deleting Faculty A report (403)');
    }

    // --- TEST 9: Admin deletes Faculty A\'s published report (should succeed) ---
    console.log('\n--- Test 9: Admin deletes Faculty A report ---');
    const req9 = {
      user: { id: adminUser._id.toString(), name: adminUser.name, role: adminUser.role },
      params: { id: createdReportId }
    };
    const res9 = mockResponse();
    await deleteReport(req9, res9);

    console.log(`Response Code: ${res9.statusCode || 200}`);
    console.log(`Response Body: ${JSON.stringify(res9.jsonData)}`);
    if ((res9.statusCode || 200) !== 200) {
      throw new Error('Test 9 failed: Admin should delete report card successfully (200)');
    }

    console.log('\nAll Report Card tests passed successfully!');

    // Cleanup
    await User.deleteMany({ email: { $in: emails } });
    await Attendance.deleteMany({ student: studentUser._id });
    await Report.deleteMany({ courseName: 'CS Test Course' });

  } catch (error) {
    console.error('Test execution failed:', error);
    // Cleanup on failure
    await User.deleteMany({ email: { $in: ['fac-a-rep-test@edutech.com', 'fac-b-rep-test@edutech.com', 'stu-rep-test@edutech.com', 'adm-rep-test@edutech.com'] } });
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

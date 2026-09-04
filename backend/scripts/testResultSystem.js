import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Result from '../models/Result.js';
import { connectDB } from '../config/database.js';
import {
  createResult,
  updateResult,
  submitResult,
  getFacultyResults,
  getResultById,
  getDepartmentSummaries,
  getDepartmentDetails,
  verifyDepartment,
  declareDepartment,
  getStudentResults,
} from '../controllers/resultController.js';

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
  console.log('Starting Branch/Department Wise Result Verification System integration tests...');
  await connectDB();

  let facultyUser, studentUser, adminUser;
  const testEmails = [
    'res-fac-test@edutech.com',
    'res-stu-test@edutech.com',
    'res-adm-test@edutech.com'
  ];

  try {
    // 1. Cleanup old test data
    console.log('Cleaning up old test users and results...');
    await User.deleteMany({ email: { $in: testEmails } });
    await Student.deleteMany({ rollNumber: 'STU-RESULT-TEST' });

    // Seed test users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    facultyUser = await new User({
      name: 'Marks Faculty',
      email: 'res-fac-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    studentUser = await new User({
      name: 'Marks Student',
      email: 'res-stu-test@edutech.com',
      passwordHash,
      role: 'student',
      status: 'active'
    }).save();

    await new Student({
      user: studentUser._id,
      rollNumber: 'STU-RESULT-TEST',
      department: 'Computer Engineering'
    }).save();

    adminUser = await new User({
      name: 'Marks Admin',
      email: 'res-adm-test@edutech.com',
      passwordHash,
      role: 'admin',
      status: 'active'
    }).save();

    // Clean any existing results for this student
    await Result.deleteMany({ studentId: studentUser._id });

    console.log('Seed users and profile initialized.');

    let resultId;
    const initialSubjects = [
      { subjectCode: 'CS101', subjectName: 'Intro to Programming', maxMarks: 100, obtainedMarks: 85 },
      { subjectCode: 'CS102', subjectName: 'Discrete Maths', maxMarks: 100, obtainedMarks: 78 }
    ];

    // --- TEST 1: Faculty creates result draft ---
    console.log('\n--- Test 1: Faculty creates result draft ---');
    const req1 = {
      user: { id: facultyUser._id.toString(), name: facultyUser.name, role: facultyUser.role },
      body: {
        studentId: studentUser._id.toString(),
        studentName: studentUser.name,
        rollNumber: 'STU-RESULT-TEST',
        department: 'Computer Engineering',
        courseName: 'Computer Engineering',
        semester: 'Semester 6',
        academicYear: '2026-2027',
        subjects: initialSubjects,
        attendancePercentage: 92,
        internalMarksTotal: 45,
        practicalMarksTotal: 25,
        theoryMarksTotal: 50,
      }
    };
    const res1 = mockResponse();
    await createResult(req1, res1);

    console.log(`Response Code: ${res1.statusCode || 201}`);
    const createdResult = res1.jsonData.result;
    console.log(`Initial Status: ${createdResult.status}`);
    console.log(`Department: ${createdResult.department}`);
    console.log(`CGPA: ${createdResult.cgpa}`);
    console.log(`Overall Result Outcome: ${createdResult.overallResult}`);

    if (createdResult.status !== 'draft' || createdResult.department !== 'Computer Engineering') {
      throw new Error('Test 1 failed: Initial values incorrect.');
    }
    resultId = createdResult._id.toString();

    // --- TEST 2: Faculty submits result sheet ---
    console.log('\n--- Test 2: Faculty submits result sheet ---');
    const req2 = {
      user: { id: facultyUser._id.toString(), role: facultyUser.role },
      params: { id: resultId }
    };
    const res2 = mockResponse();
    await submitResult(req2, res2);

    console.log(`Response Code: ${res2.statusCode || 200}`);
    console.log(`Submitted Status: ${res2.jsonData.result?.status}`);
    if (res2.jsonData.result?.status !== 'submitted') {
      throw new Error('Test 2 failed: status should transition to "submitted"');
    }

    // --- TEST 3: Admin gets department summaries ---
    console.log('\n--- Test 3: Admin retrieves department summaries ---');
    const req3_sum = {
      user: { id: adminUser._id.toString(), role: adminUser.role }
    };
    const res3_sum = mockResponse();
    await getDepartmentSummaries(req3_sum, res3_sum);
    console.log('Summaries:', res3_sum.jsonData);
    const compEngSummary = res3_sum.jsonData.find(
      (s) => s.department === 'Computer Engineering' && s.semester === 'Semester 6'
    );
    if (!compEngSummary || compEngSummary.submittedCount !== 1) {
      throw new Error('Test 3 failed: department summary did not reflect submitted result.');
    }

    // --- TEST 4: Admin views details ---
    console.log('\n--- Test 4: Admin views department details ---');
    const req4_det = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      query: {
        department: 'Computer Engineering',
        semester: 'Semester 6',
        academicYear: '2026-2027'
      }
    };
    const res4_det = mockResponse();
    await getDepartmentDetails(req4_det, res4_det);
    console.log(`Details count: ${res4_det.jsonData.length}`);
    if (res4_det.jsonData.length !== 1 || res4_det.jsonData[0]._id.toString() !== resultId) {
      throw new Error('Test 4 failed: details fetch returned incorrect list.');
    }

    // --- TEST 5: Admin verifies department results in bulk ---
    console.log('\n--- Test 5: Admin verifies Computer Engineering department ---');
    const req5_ver = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      body: {
        department: 'Computer Engineering',
        semester: 'Semester 6',
        academicYear: '2026-2027'
      }
    };
    const res5_ver = mockResponse();
    await verifyDepartment(req5_ver, res5_ver);
    console.log(`Verify outcome message: ${res5_ver.jsonData.message}`);
    console.log(`Modified count: ${res5_ver.jsonData.modifiedCount}`);

    // Verify status updated in database
    const updatedResult1 = await Result.findById(resultId);
    console.log(`Verified Status: ${updatedResult1.status}`);
    if (updatedResult1.status !== 'verified') {
      throw new Error('Test 5 failed: result did not transition to "verified".');
    }

    // --- TEST 6: Student queries results before declaration (Should return empty list) ---
    console.log('\n--- Test 6: Student queries result before declaration ---');
    const req6 = {
      user: { id: studentUser._id.toString(), role: studentUser.role }
    };
    const res6 = mockResponse();
    await getStudentResults(req6, res6);
    console.log(`Student results returned count: ${res6.jsonData.length}`);
    if (res6.jsonData.length > 0) {
      throw new Error('Test 6 failed: Student should not see results before they are declared.');
    }

    // --- TEST 7: Admin declares department results in bulk ---
    console.log('\n--- Test 7: Admin declares Computer Engineering department results ---');
    const req7_dec = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      body: {
        department: 'Computer Engineering',
        semester: 'Semester 6',
        academicYear: '2026-2027'
      }
    };
    const res7_dec = mockResponse();
    await declareDepartment(req7_dec, res7_dec);
    console.log(`Declare outcome message: ${res7_dec.jsonData.message}`);
    console.log(`Modified count: ${res7_dec.jsonData.modifiedCount}`);

    // Verify status updated in database
    const updatedResult2 = await Result.findById(resultId);
    console.log(`Declared Status: ${updatedResult2.status}`);
    if (updatedResult2.status !== 'declared') {
      throw new Error('Test 7 failed: result did not transition to "declared".');
    }

    // --- TEST 8: Student queries results after declaration ---
    console.log('\n--- Test 8: Student queries result after declaration ---');
    const res8 = mockResponse();
    await getStudentResults(req6, res8);
    console.log(`Student results returned count: ${res8.jsonData.length}`);
    console.log(`Returned result CGPA: ${res8.jsonData[0]?.cgpa}`);
    console.log(`Returned result Department: ${res8.jsonData[0]?.department}`);
    if (res8.jsonData.length !== 1 || res8.jsonData[0].overallResult !== 'Pass' || res8.jsonData[0].department !== 'Computer Engineering') {
      throw new Error('Test 8 failed: Student failed to query declared results.');
    }

    console.log('\nAll Branch/Department-Wise Verification tests passed successfully!');

    // Final Cleanup
    console.log('Cleaning up integration test data...');
    await User.deleteMany({ email: { $in: testEmails } });
    await Student.deleteMany({ rollNumber: 'STU-RESULT-TEST' });
    await Result.deleteMany({ _id: resultId });

  } catch (error) {
    console.error('Test execution failed:', error);
    // Cleanup on failure
    await User.deleteMany({ email: { $in: testEmails } });
    await Student.deleteMany({ rollNumber: 'STU-RESULT-TEST' });
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

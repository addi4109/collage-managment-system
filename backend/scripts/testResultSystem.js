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
  getPendingResults,
  approveSubject,
  rejectSubject,
  declareResult,
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
  console.log('Starting Subject-Wise Result Verification System integration tests...');
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
      department: 'Computer Science'
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
      { subjectCode: 'CS102', subjectName: 'Discrete Maths', maxMarks: 100, obtainedMarks: 35 } // Fail marks (<40)
    ];

    // --- TEST 1: Faculty creates result draft ---
    console.log('\n--- Test 1: Faculty creates result draft ---');
    const req1 = {
      user: { id: facultyUser._id.toString(), name: facultyUser.name, role: facultyUser.role },
      body: {
        studentId: studentUser._id.toString(),
        studentName: studentUser.name,
        rollNumber: 'STU-RESULT-TEST',
        courseName: 'Computer Science',
        semester: '1st Semester',
        academicYear: '2025-2026',
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
    console.log(`Total Marks calculated: ${createdResult.totalMarks}`);
    console.log(`Obtained Marks calculated: ${createdResult.obtainedMarks}`);
    console.log(`Percentage: ${createdResult.percentage}%`);
    console.log(`CGPA: ${createdResult.cgpa}`);
    console.log(`Subject 1 Grade: ${createdResult.subjects[0].grade}, Status: ${createdResult.subjects[0].status}`);
    console.log(`Subject 2 Grade: ${createdResult.subjects[1].grade}, Status: ${createdResult.subjects[1].status}`);
    console.log(`Overall Result Outcome: ${createdResult.overallResult}`); // should be Fail due to CS102 (35/100)

    if (createdResult.status !== 'draft' || createdResult.overallResult !== 'Fail') {
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

    // --- TEST 3: Admin approves subject 1, rejects subject 2 ---
    console.log('\n--- Test 3: Admin verifies subjects (Approve sub 0, Reject sub 1) ---');
    const req3_app = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      params: { resultId, subjectIndex: 0 }
    };
    const res3_app = mockResponse();
    await approveSubject(req3_app, res3_app);
    console.log(`Approve Subject 0 - Overall status: ${res3_app.jsonData.result?.status}`);
    console.log(`Subject 0 approvalStatus: ${res3_app.jsonData.result?.subjects[0].approvalStatus}`);

    const req3_rej = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      params: { resultId, subjectIndex: 1 },
      body: { remark: 'Math marks seem entered incorrectly. Double-check paper.' }
    };
    const res3_rej = mockResponse();
    await rejectSubject(req3_rej, res3_rej);
    console.log(`Reject Subject 1 - Overall status: ${res3_rej.jsonData.result?.status}`);
    console.log(`Subject 1 approvalStatus: ${res3_rej.jsonData.result?.subjects[1].approvalStatus}`);
    console.log(`Subject 1 remark: ${res3_rej.jsonData.result?.subjects[1].adminRemark}`);

    if (
      res3_rej.jsonData.result?.status !== 'verification_pending' ||
      res3_rej.jsonData.result?.subjects[1].approvalStatus !== 'rejected'
    ) {
      throw new Error('Test 3 failed: Status or rejection flag mismatch.');
    }

    // --- TEST 4: Faculty corrects subject 2 marks and re-submits ---
    console.log('\n--- Test 4: Faculty edits/corrects and re-submits ---');
    const correctedSubjects = [
      { subjectCode: 'CS101', subjectName: 'Intro to Programming', maxMarks: 100, obtainedMarks: 85 },
      { subjectCode: 'CS102', subjectName: 'Discrete Maths', maxMarks: 100, obtainedMarks: 78 } // Corrected to Pass marks (78/100)
    ];

    const req4_edit = {
      user: { id: facultyUser._id.toString(), role: facultyUser.role },
      params: { id: resultId },
      body: {
        subjects: correctedSubjects
      }
    };
    const res4_edit = mockResponse();
    await updateResult(req4_edit, res4_edit);
    console.log(`Updated subject 1 approvalStatus after edit: ${res4_edit.jsonData.result?.subjects[1].approvalStatus}`);
    console.log(`Updated subject 1 adminRemark: "${res4_edit.jsonData.result?.subjects[1].adminRemark}"`);
    console.log(`Overall Result Outcome: ${res4_edit.jsonData.result?.overallResult}`); // should be Pass now (85 & 78)

    if (
      res4_edit.jsonData.result?.subjects[1].approvalStatus !== 'pending' ||
      res4_edit.jsonData.result?.subjects[1].adminRemark !== '' ||
      res4_edit.jsonData.result?.overallResult !== 'Pass'
    ) {
      throw new Error('Test 4 failed: Edit did not reset approval state correctly.');
    }

    // Faculty re-submits
    const res4_sub = mockResponse();
    await submitResult(req2, res4_sub);
    console.log(`Re-submitted Status: ${res4_sub.jsonData.result?.status}`);
    if (res4_sub.jsonData.result?.status !== 'submitted') {
      throw new Error('Test 4 failed: Re-submission failed.');
    }

    // --- TEST 5: Admin approves remaining subject (overall ready_for_declaration) ---
    console.log('\n--- Test 5: Admin approves all subjects ---');
    // Approve Subject 0 again (remained approved because it wasn't modified)
    // Approve Subject 1
    const req5_app = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      params: { resultId, subjectIndex: 1 }
    };
    const res5_app = mockResponse();
    await approveSubject(req5_app, res5_app);
    console.log(`Approve remaining - Overall status: ${res5_app.jsonData.result?.status}`);
    if (res5_app.jsonData.result?.status !== 'ready_for_declaration') {
      throw new Error('Test 5 failed: All subjects approved but overall status did not become ready_for_declaration.');
    }

    // --- TEST 6: Student queries results before declaration (Should return empty list) ---
    console.log('\n--- Test 6: Student queries result before declaration ---');
    const req6 = {
      user: { id: studentUser._id.toString(), role: studentUser.role }
    };
    const res6 = mockResponse();
    await getStudentResults(req6, res6);
    console.log(`Response Code: ${res6.statusCode || 200}`);
    console.log(`Student results returned count: ${res6.jsonData.length}`);
    if (res6.jsonData.length > 0) {
      throw new Error('Test 6 failed: Student should not see results before they are officially declared.');
    }

    // --- TEST 7: Admin declares result ---
    console.log('\n--- Test 7: Admin declares result ---');
    const req7 = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      params: { id: resultId }
    };
    const res7 = mockResponse();
    await declareResult(req7, res7);
    console.log(`Response Code: ${res7.statusCode || 200}`);
    console.log(`Status after declaring: ${res7.jsonData.result?.status}`);
    console.log(`Declared By: ${res7.jsonData.result?.declaredBy}`);
    if (res7.jsonData.result?.status !== 'declared') {
      throw new Error('Test 7 failed: Result declaration failed.');
    }

    // --- TEST 8: Student queries results after declaration ---
    console.log('\n--- Test 8: Student queries result after declaration ---');
    const res8 = mockResponse();
    await getStudentResults(req6, res8);
    console.log(`Response Code: ${res8.statusCode || 200}`);
    console.log(`Student results returned count: ${res8.jsonData.length}`);
    console.log(`Returned result CGPA: ${res8.jsonData[0]?.cgpa}`);
    console.log(`Returned result Overall Outcome: ${res8.jsonData[0]?.overallResult}`);
    if (res8.jsonData.length !== 1 || res8.jsonData[0].overallResult !== 'Pass') {
      throw new Error('Test 8 failed: Student failed to query declared result.');
    }

    console.log('\nAll Subject-Wise Result Integration tests passed successfully!');

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

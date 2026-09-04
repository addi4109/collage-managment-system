import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';
import ProctorLog from '../models/ProctorLog.js';
import { connectDB } from '../config/database.js';
import {
  createExam,
  updateExam,
  scheduleExam,
  startExam,
  getFacultyExams,
  getExamResultSummary,
  publishExamResults,
  getPendingExams,
  approveExam,
  rejectExam,
  getAvailableExams,
  startExamAttempt,
  submitExamAttempt,
  getStudentResult,
} from '../controllers/examController.js';
import {
  logProctorEvent,
  incrementWarning,
  blockStudent,
} from '../controllers/proctorController.js';

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
  console.log('Starting Online Exam System integration tests...');
  await connectDB();

  let facultyUser, studentUser, adminUser;
  const testEmails = [
    'exam-fac-test@edutech.com',
    'exam-stu-test@edutech.com',
    'exam-adm-test@edutech.com'
  ];

  try {
    // 1. Cleanup old test data
    console.log('Cleaning up old test users and exam data...');
    await User.deleteMany({ email: { $in: testEmails } });
    
    // We will clean up any exams created during tests using titles
    const examTitles = ['Integration Test Exam 101', 'Draft Integration Exam'];
    const oldExams = await Exam.find({ title: { $in: examTitles } });
    const oldExamIds = oldExams.map(e => e._id);
    await Exam.deleteMany({ _id: { $in: oldExamIds } });
    await Question.deleteMany({ examId: { $in: oldExamIds } });
    await ExamAttempt.deleteMany({ examId: { $in: oldExamIds } });
    await ProctorLog.deleteMany({ examId: { $in: oldExamIds } });

    // 2. Seed test users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    facultyUser = await new User({
      name: 'Exam Faculty',
      email: 'exam-fac-test@edutech.com',
      passwordHash,
      role: 'faculty',
      status: 'active'
    }).save();

    studentUser = await new User({
      name: 'Exam Student',
      email: 'exam-stu-test@edutech.com',
      passwordHash,
      role: 'student',
      status: 'active'
    }).save();

    adminUser = await new User({
      name: 'Exam Admin',
      email: 'exam-adm-test@edutech.com',
      passwordHash,
      role: 'admin',
      status: 'active'
    }).save();

    console.log('Seed users created successfully.');

    let examId;
    let questionsList = [
      {
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        marks: 2
      },
      {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 'Paris',
        marks: 3
      }
    ];

    // --- TEST 1: Faculty creates a draft exam ---
    console.log('\n--- Test 1: Faculty creates a draft exam ---');
    const req1 = {
      user: { id: facultyUser._id.toString(), role: facultyUser.role },
      body: {
        title: 'Draft Integration Exam',
        courseName: 'CS 101',
        duration: 10,
        totalMarks: 5,
        questions: questionsList,
        submitForApproval: false
      }
    };
    const res1 = mockResponse();
    await createExam(req1, res1);

    console.log(`Response Code: ${res1.statusCode || 201}`);
    console.log(`Status of exam: ${res1.jsonData.exam?.status}`);
    if (res1.jsonData.exam?.status !== 'draft') {
      throw new Error('Test 1 failed: Expected status to be "draft"');
    }
    examId = res1.jsonData.exam._id.toString();

    // --- TEST 2: Faculty updates and submits exam for approval ---
    console.log('\n--- Test 2: Faculty submits exam for approval ---');
    const req2 = {
      user: { id: facultyUser._id.toString(), role: facultyUser.role },
      params: { id: examId },
      body: {
        title: 'Integration Test Exam 101',
        courseName: 'CS 101',
        duration: 20,
        totalMarks: 5,
        questions: questionsList,
        submitForApproval: true
      }
    };
    const res2 = mockResponse();
    await updateExam(req2, res2);

    console.log(`Response Code: ${res2.statusCode || 200}`);
    console.log(`Updated Status: ${res2.jsonData.exam?.status}`);
    if (res2.jsonData.exam?.status !== 'pending') {
      throw new Error('Test 2 failed: Expected status to be "pending"');
    }

    // --- TEST 3: Admin approves the exam paper ---
    console.log('\n--- Test 3: Admin approves the exam ---');
    const req3 = {
      user: { id: adminUser._id.toString(), role: adminUser.role },
      params: { id: examId },
      body: { comment: 'All questions look great!' }
    };
    const res3 = mockResponse();
    await approveExam(req3, res3);

    console.log(`Response Code: ${res3.statusCode || 200}`);
    console.log(`Status after approval: ${res3.jsonData.exam?.status}`);
    if (res3.jsonData.exam?.status !== 'approved') {
      throw new Error('Test 3 failed: Expected status to be "approved"');
    }

    // --- TEST 4: Faculty schedules the exam ---
    console.log('\n--- Test 4: Faculty schedules the exam ---');
    const scheduledDate = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour later
    const req4 = {
      user: { id: facultyUser._id.toString(), role: facultyUser.role },
      params: { id: examId },
      body: { scheduledAt: scheduledDate }
    };
    const res4 = mockResponse();
    await scheduleExam(req4, res4);

    console.log(`Response Code: ${res4.statusCode || 200}`);
    console.log(`Status after scheduling: ${res4.jsonData.exam?.status}`);
    if (res4.jsonData.exam?.status !== 'scheduled') {
      throw new Error('Test 4 failed: Expected status to be "scheduled"');
    }

    // --- TEST 5: Faculty starts the exam (active) ---
    console.log('\n--- Test 5: Faculty starts the exam ---');
    const req5 = {
      user: { id: facultyUser._id.toString(), role: facultyUser.role },
      params: { id: examId }
    };
    const res5 = mockResponse();
    await startExam(req5, res5);

    console.log(`Response Code: ${res5.statusCode || 200}`);
    console.log(`Status after starting: ${res5.jsonData.exam?.status}`);
    if (res5.jsonData.exam?.status !== 'active') {
      throw new Error('Test 5 failed: Expected status to be "active"');
    }

    // --- TEST 6: Student starts an attempt ---
    console.log('\n--- Test 6: Student starts exam attempt ---');
    const req6 = {
      user: { id: studentUser._id.toString(), role: studentUser.role },
      params: { id: examId }
    };
    const res6 = mockResponse();
    await startExamAttempt(req6, res6);

    console.log(`Response Code: ${res6.statusCode || 201}`);
    console.log(`Attempt status: ${res6.jsonData.attempt?.status}`);
    console.log(`Questions loaded: ${res6.jsonData.questions?.length}`);
    if (res6.jsonData.attempt?.status !== 'active' || res6.jsonData.questions?.length !== 2) {
      throw new Error('Test 6 failed: Attempt initialization failed.');
    }
    // Correctly verify questions do not expose answers
    if (res6.jsonData.questions[0].correctAnswer) {
      throw new Error('Test 6 failed: Student started attempt loaded correct answers payload!');
    }

    // --- TEST 7: Proctoring Warnings Increments (Strikes) ---
    console.log('\n--- Test 7: Proctoring Warnings striking ---');
    const req7_w1 = {
      user: { id: studentUser._id.toString(), role: studentUser.role },
      body: { examId, eventType: 'tabSwitch', severity: 'medium' }
    };
    const res7_w1 = mockResponse();
    await incrementWarning(req7_w1, res7_w1);
    console.log(`Strike 1 - Warnings: ${res7_w1.jsonData.warnings}/3, Blocked: ${res7_w1.jsonData.blocked}`);

    const req7_w2 = {
      user: { id: studentUser._id.toString(), role: studentUser.role },
      body: { examId, eventType: 'cameraOff', severity: 'high' }
    };
    const res7_w2 = mockResponse();
    await incrementWarning(req7_w2, res7_w2);
    console.log(`Strike 2 - Warnings: ${res7_w2.jsonData.warnings}/3, Blocked: ${res7_w2.jsonData.blocked}`);

    if (res7_w2.jsonData.blocked || res7_w2.jsonData.warnings !== 2) {
      throw new Error('Test 7 failed: Strike warnings counts incorrect.');
    }

    // Strike 3: should auto-block student
    const questions = await Question.find({ examId });
    const mockAnswersSubmitted = [
      { questionId: questions[0]._id.toString(), selectedAnswer: '4' }, // correct
      { questionId: questions[1]._id.toString(), selectedAnswer: 'Madrid' } // incorrect
    ];

    const req7_w3 = {
      user: { id: studentUser._id.toString(), role: studentUser.role },
      body: { examId, eventType: 'faceNotDetected', severity: 'high', answers: mockAnswersSubmitted }
    };
    const res7_w3 = mockResponse();
    await incrementWarning(req7_w3, res7_w3);
    console.log(`Strike 3 - Warnings: ${res7_w3.jsonData.warnings}/3, Blocked: ${res7_w3.jsonData.blocked}`);

    if (!res7_w3.jsonData.blocked || res7_w3.jsonData.warnings !== 3) {
      throw new Error('Test 7 failed: Strike 3 did not trigger auto-block.');
    }

    // Check score of blocked attempt: Question 1 was correct (2 marks), Question 2 was incorrect (0 marks). Total score should be 2.
    const blockedAttempt = await ExamAttempt.findOne({ examId, studentId: studentUser._id });
    console.log(`Blocked attempt auto-evaluated score: ${blockedAttempt.score}`);
    if (blockedAttempt.score !== 2) {
      throw new Error(`Test 7 failed: Auto-evaluation score was ${blockedAttempt.score}, expected 2`);
    }

    // --- TEST 8: Student tries duplicate attempt (Should be blocked) ---
    console.log('\n--- Test 8: Block duplicate attempts ---');
    const req8 = {
      user: { id: studentUser._id.toString(), role: studentUser.role },
      params: { id: examId }
    };
    const res8 = mockResponse();
    await startExamAttempt(req8, res8);

    console.log(`Response Code: ${res8.statusCode}`);
    console.log(`Response Message: ${res8.jsonData.message}`);
    if (res8.statusCode !== 403) {
      throw new Error('Test 8 failed: Expected 403 status code for already blocked student attempt.');
    }

    // --- TEST 9: Add second student and submit a successful complete attempt ---
    console.log('\n--- Test 9: Successful complete attempt by second student ---');
    const studentUser2 = await new User({
      name: 'Exam Student 2',
      email: 'exam-stu2-test@edutech.com',
      passwordHash,
      role: 'student',
      status: 'active'
    }).save();
    testEmails.push('exam-stu2-test@edutech.com');

    // Start attempt for student 2
    const req9_start = {
      user: { id: studentUser2._id.toString(), role: studentUser2.role },
      params: { id: examId }
    };
    const res9_start = mockResponse();
    await startExamAttempt(req9_start, res9_start);

    // Submit answers
    const answers2 = [
      { questionId: questions[0]._id.toString(), selectedAnswer: '4' }, // correct (2 marks)
      { questionId: questions[1]._id.toString(), selectedAnswer: 'Paris' } // correct (3 marks)
    ];
    const req9_submit = {
      user: { id: studentUser2._id.toString(), role: studentUser2.role },
      params: { id: examId },
      body: { answers: answers2 }
    };
    const res9_submit = mockResponse();
    await submitExamAttempt(req9_submit, res9_submit);

    console.log(`Response Code: ${res9_submit.statusCode || 200}`);
    console.log(`Submited attempt score: ${res9_submit.jsonData.score} / ${res9_submit.jsonData.totalMarks}`);
    if (res9_submit.jsonData.score !== 5) {
      throw new Error(`Test 9 failed: Score is ${res9_submit.jsonData.score}, expected 5`);
    }

    // --- TEST 10: Fetch results before publication (Should be forbidden) ---
    console.log('\n--- Test 10: Fetch results before publication ---');
    const req10 = {
      user: { id: studentUser2._id.toString(), role: studentUser2.role },
      params: { id: examId }
    };
    const res10 = mockResponse();
    await getStudentResult(req10, res10);

    console.log(`Response Code: ${res10.statusCode}`);
    console.log(`Response Message: ${res10.jsonData.message}`);
    if (res10.statusCode !== 403) {
      throw new Error('Test 10 failed: Student shouldn\'t access result sheet before publication (403)');
    }

    // --- TEST 11: Faculty publishes results ---
    console.log('\n--- Test 11: Faculty publishes results ---');
    const req11 = {
      user: { id: facultyUser._id.toString(), role: facultyUser.role },
      params: { id: examId }
    };
    const res11 = mockResponse();
    await publishExamResults(req11, res11);

    console.log(`Response Code: ${res11.statusCode || 200}`);
    console.log(`Exam resultsPublished status: ${res11.jsonData.exam?.resultsPublished}`);
    if (!res11.jsonData.exam?.resultsPublished) {
      throw new Error('Test 11 failed: expected resultsPublished to be true');
    }

    // --- TEST 12: Fetch results after publication (Should succeed) ---
    console.log('\n--- Test 12: Fetch results after publication ---');
    const req12 = {
      user: { id: studentUser2._id.toString(), role: studentUser2.role },
      params: { id: examId }
    };
    const res12 = mockResponse();
    await getStudentResult(req12, res12);

    console.log(`Response Code: ${res12.statusCode || 200}`);
    console.log(`Fetched exam title: ${res12.jsonData.exam?.title}`);
    console.log(`Fetched score: ${res12.jsonData.attempt?.score}`);
    console.log(`Correct key for Q1 returned: ${res12.jsonData.questions[0]?.correctAnswer}`);
    if (!res12.jsonData.attempt || res12.jsonData.attempt.score !== 5 || !res12.jsonData.questions[0].correctAnswer) {
      throw new Error('Test 12 failed: Expected full result sheet with answers and score.');
    }

    console.log('\nAll Online Examination System integration tests passed successfully!');

    // Cleanup
    console.log('Cleaning up integration test data...');
    await User.deleteMany({ email: { $in: testEmails } });
    await Exam.deleteMany({ _id: examId });
    await Question.deleteMany({ examId });
    await ExamAttempt.deleteMany({ examId });
    await ProctorLog.deleteMany({ examId });

  } catch (error) {
    console.error('Test execution failed:', error);
    // Cleanup on failure
    await User.deleteMany({ email: { $in: testEmails } });
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runTest();

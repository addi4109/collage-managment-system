import Exam from '../models/Exam.js';
import ExamAttempt from '../models/ExamAttempt.js';
import Student from '../models/Student.js';
import { createBatchNotifications } from './notificationService.js';

export const createExam = async (examData, facultyId) => {
  const { title, subjectId, departmentId, year, semester, duration, questions } = examData;

  const exam = new Exam({
    title,
    subjectId,
    departmentId,
    year,
    semester,
    duration,
    questions: questions || [],
    facultyId,
    status: 'draft',
  });

  return await exam.save();
};

export const submitExamForApproval = async (examId, facultyId) => {
  const exam = await Exam.findOne({ _id: examId, facultyId, isDeleted: false });
  if (!exam) throw new Error('Exam not found.');
  exam.status = 'pending_approval';
  return await exam.save();
};

export const getPendingExams = async () => {
  return await Exam.find({ status: 'pending_approval', isDeleted: false })
    .populate('subjectId', 'name code')
    .populate('departmentId', 'name code')
    .populate('facultyId', 'name email');
};

export const reviewExam = async (examId, approve) => {
  const exam = await Exam.findOne({ _id: examId, isDeleted: false });
  if (!exam) throw new Error('Exam not found.');
  exam.status = approve ? 'approved' : 'draft';
  return await exam.save();
};

export const scheduleExam = async (examId, scheduleData, facultyId) => {
  const { scheduleDate, startTime, endTime } = scheduleData;
  const exam = await Exam.findOne({ _id: examId, facultyId, isDeleted: false });
  if (!exam) throw new Error('Exam not found.');
  if (exam.status !== 'approved' && exam.status !== 'scheduled') {
    throw new Error('Exam must be approved by admin before scheduling.');
  }

  exam.scheduleDate = new Date(scheduleDate);
  exam.startTime = startTime;
  exam.endTime = endTime;
  exam.status = 'scheduled';
  const savedExam = await exam.save();
  await createBatchNotifications(
    exam.departmentId,
    exam.year,
    exam.semester,
    'Exam Scheduled',
    `MCQ Exam [${exam.title}] is scheduled for ${new Date(scheduleDate).toLocaleDateString()} at ${startTime}.`,
    'EXAM'
  );
  return savedExam;
};

export const startExam = async (examId, facultyId) => {
  const exam = await Exam.findOne({ _id: examId, facultyId, isDeleted: false });
  if (!exam) throw new Error('Exam not found.');
  exam.status = 'active';
  const savedExam = await exam.save();
  await createBatchNotifications(
    exam.departmentId,
    exam.year,
    exam.semester,
    'Exam Active',
    `MCQ Exam [${exam.title}] is now active! Take the exam before it ends.`,
    'EXAM'
  );
  return savedExam;
};

export const endExam = async (examId, facultyId) => {
  const exam = await Exam.findOne({ _id: examId, facultyId, isDeleted: false });
  if (!exam) throw new Error('Exam not found.');
  exam.status = 'ended';
  return await exam.save();
};

export const getStudentExams = async (studentId) => {
  const student = await Student.findOne({ userId: studentId, isDeleted: false });
  if (!student) throw new Error('Student profile not found.');

  // Find all scheduled/active/ended exams matching student's department, year, semester
  const exams = await Exam.find({
    departmentId: student.departmentId,
    year: student.year,
    semester: student.semester,
    status: { $in: ['scheduled', 'active', 'ended'] },
    isDeleted: false,
  })
    .populate('subjectId', 'name code')
    .populate('facultyId', 'name email')
    .sort({ scheduleDate: 1 });

  // Map to attach student's attempt state
  const examsList = [];
  for (const e of exams) {
    const attempt = await ExamAttempt.findOne({ studentId, examId: e._id });
    examsList.push({
      exam: e,
      attempted: !!attempt,
      completed: attempt ? attempt.completed : false,
      score: attempt && attempt.completed ? attempt.score : null,
      proctorWarnings: attempt ? attempt.proctorWarnings : 0,
    });
  }

  return examsList;
};

export const startAttempt = async (studentId, examId) => {
  const exam = await Exam.findOne({ _id: examId, status: 'active', isDeleted: false });
  if (!exam) {
    throw new Error('Exam is not currently active.');
  }

  const existingAttempt = await ExamAttempt.findOne({ studentId, examId });
  if (existingAttempt) {
    throw new Error('You have already started or submitted an attempt for this exam.');
  }

  const attempt = new ExamAttempt({
    studentId,
    examId,
    answers: new Array(exam.questions.length).fill(-1),
    completed: false,
    proctorWarnings: 0,
  });

  return await attempt.save();
};

export const logProctorViolation = async (studentId, examId, eventType, details) => {
  const attempt = await ExamAttempt.findOne({ studentId, examId, completed: false });
  if (!attempt) {
    throw new Error('Active exam attempt not found.');
  }

  attempt.proctorWarnings += 1;
  attempt.integrityLogs.push({ eventType, details });

  if (attempt.proctorWarnings >= 3) {
    attempt.completed = true;
    // Auto-calculate score with current answers
    const exam = await Exam.findById(examId);
    let score = 0;
    if (exam) {
      attempt.answers.forEach((ans, idx) => {
        if (ans === exam.questions[idx].correctAnswerIndex) {
          score += 1;
        }
      });
    }
    attempt.score = score;
    await attempt.save();
    return { attempt, autoSubmitted: true };
  }

  await attempt.save();
  return { attempt, autoSubmitted: false };
};

export const submitExamAttempt = async (studentId, examId, answers) => {
  const attempt = await ExamAttempt.findOne({ studentId, examId, completed: false });
  if (!attempt) {
    throw new Error('Active exam attempt not found or already submitted.');
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error('Exam structure not found.');
  }

  // Calculate score
  let score = 0;
  exam.questions.forEach((q, idx) => {
    const studentAnswer = answers[idx] !== undefined ? answers[idx] : -1;
    if (studentAnswer === q.correctAnswerIndex) {
      score += 1;
    }
  });

  attempt.answers = answers;
  attempt.score = score;
  attempt.completed = true;
  return await attempt.save();
};

export const getExamAttemptsReport = async (examId, facultyId) => {
  const exam = await Exam.findOne({ _id: examId, facultyId, isDeleted: false });
  if (!exam) throw new Error('Exam not found or unauthorized.');

  const attempts = await ExamAttempt.find({ examId })
    .populate('studentId', 'name email')
    .sort({ score: -1 });

  return { exam, attempts };
};

import express from 'express';
import {
  createExam,
  submitForApproval,
  listPending,
  review,
  schedule,
  start,
  end,
  listStudentExams,
  startExamAttempt,
  logViolation,
  submitAttempt,
  getResults,
  getFacultyExamsList,
} from '../controllers/examController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Faculty Exam CRUD & Actions
router.get('/faculty', requireRole(['faculty']), getFacultyExamsList);
router.post('/', requireRole(['faculty']), createExam);
router.post('/:id/submit', requireRole(['faculty']), submitForApproval);
router.post('/:id/schedule', requireRole(['faculty']), schedule);
router.post('/:id/start', requireRole(['faculty']), start);
router.post('/:id/end', requireRole(['faculty']), end);
router.get('/:id/results', requireRole(['faculty', 'principal']), getResults);

// Admin Review
router.get('/pending', requireRole(['principal', 'hod']), listPending);
router.post('/:id/review', requireRole(['principal', 'hod']), review);

// Student Exam taking
router.get('/student', requireRole(['student']), listStudentExams);
router.post('/:id/attempt', requireRole(['student']), startExamAttempt);
router.post('/:id/violation', requireRole(['student']), logViolation);
router.post('/:id/submit-attempt', requireRole(['student']), submitAttempt);

export default router;

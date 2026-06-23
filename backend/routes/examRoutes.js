import express from 'express';
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
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// --- Faculty Endpoints ---
router.post('/create', requireRole(['faculty', 'admin']), createExam);
router.put('/:id', requireRole(['faculty', 'admin']), updateExam);
router.post('/:id/schedule', requireRole(['faculty', 'admin']), scheduleExam);
router.post('/:id/start', requireRole(['faculty', 'admin']), startExam);
router.get('/faculty', requireRole(['faculty', 'admin']), getFacultyExams);
router.get('/result/summary/:id', requireRole(['faculty', 'admin']), getExamResultSummary);
router.post('/:id/publish', requireRole(['faculty', 'admin']), publishExamResults);

// --- Admin Endpoints ---
router.get('/pending', requireRole(['admin']), getPendingExams);
router.post('/:id/approve', requireRole(['admin']), approveExam);
router.post('/:id/reject', requireRole(['admin']), rejectExam);

// --- Student Endpoints ---
router.get('/available', requireRole(['student']), getAvailableExams);
router.post('/:id/start-attempt', requireRole(['student']), startExamAttempt);
router.post('/:id/submit', requireRole(['student']), submitExamAttempt);
router.get('/result/:id', requireRole(['student']), getStudentResult);

export default router;

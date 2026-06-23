import express from 'express';
import {
  getStudentList,
  createResult,
  updateResult,
  submitResult,
  getFacultyResults,
  getResultById,
  getPendingResults,
  approveSubject,
  rejectSubject,
  declareResult,
  getAllResults,
  getStudentResults,
} from '../controllers/resultController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require token authentication
router.use(authenticateToken);

// --- Faculty Endpoints ---
router.get('/students', requireRole(['faculty', 'admin']), getStudentList);
router.post('/create', requireRole(['faculty']), createResult);
router.put('/:id', requireRole(['faculty']), updateResult);
router.post('/:id/submit', requireRole(['faculty']), submitResult);
router.get('/faculty', requireRole(['faculty']), getFacultyResults);

// --- Admin Endpoints ---
router.get('/pending', requireRole(['admin']), getPendingResults);
router.post('/:resultId/subject/:subjectIndex/approve', requireRole(['admin']), approveSubject);
router.post('/:resultId/subject/:subjectIndex/reject', requireRole(['admin']), rejectSubject);
router.post('/:id/declare', requireRole(['admin']), declareResult);
router.get('/all', requireRole(['admin']), getAllResults);

// --- Student Endpoints ---
router.get('/student', requireRole(['student']), getStudentResults);

// --- Shared ID Lookup ---
router.get('/:id', requireRole(['student', 'faculty', 'admin']), getResultById);

export default router;

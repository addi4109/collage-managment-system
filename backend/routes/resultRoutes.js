import express from 'express';
import {
  getStudentList,
  createResult,
  updateResult,
  submitResult,
  getFacultyResults,
  getResultById,
  getDepartmentSummaries,
  getDepartmentDetails,
  verifyDepartment,
  declareDepartment,
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
router.get('/department-summaries', requireRole(['admin']), getDepartmentSummaries);
router.get('/department-details', requireRole(['admin']), getDepartmentDetails);
router.post('/verify-department', requireRole(['admin']), verifyDepartment);
router.post('/declare-department', requireRole(['admin']), declareDepartment);
router.get('/all', requireRole(['admin']), getAllResults);

// --- Student Endpoints ---
router.get('/student', requireRole(['student']), getStudentResults);

// --- Shared ID Lookup ---
router.get('/:id', requireRole(['student', 'faculty', 'admin']), getResultById);

export default router;

import express from 'express';
import {
  createReport,
  updateReport,
  publishReport,
  fetchFacultyReports,
  fetchStudentReport,
  deleteReport,
  getStudentsList,
  calculateAttendanceStats,
} from '../controllers/reportController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole(['faculty', 'admin']), createReport);
router.get('/faculty', authenticateToken, requireRole(['faculty', 'admin']), fetchFacultyReports);
router.get('/student/:id', authenticateToken, fetchStudentReport);
router.put('/:id', authenticateToken, requireRole(['faculty', 'admin']), updateReport);
router.put('/publish/:id', authenticateToken, requireRole(['faculty', 'admin']), publishReport);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'admin']), deleteReport);
router.get('/students', authenticateToken, requireRole(['faculty', 'admin']), getStudentsList);
router.get('/attendance-stats', authenticateToken, requireRole(['faculty', 'admin']), calculateAttendanceStats);

export default router;

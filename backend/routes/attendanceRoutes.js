import express from 'express';
import {
  getStudents,
  markAttendance,
  getAttendanceRecords,
  checkInStudent,
  getFacultySessions,
  getSessionAttendance,
} from '../controllers/attendanceController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/students', authenticateToken, requireRole(['faculty', 'admin']), getStudents);
router.post('/mark', authenticateToken, requireRole(['faculty', 'admin']), markAttendance);
router.get('/records', authenticateToken, getAttendanceRecords);
router.post('/checkin', authenticateToken, requireRole(['student']), checkInStudent);

router.get('/sessions/faculty', authenticateToken, requireRole(['faculty', 'admin']), getFacultySessions);
router.get('/session/:sessionId', authenticateToken, requireRole(['faculty', 'admin']), getSessionAttendance);

export default router;

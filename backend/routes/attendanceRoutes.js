import express from 'express';
import { getStudents, markAttendance, getAttendanceRecords } from '../controllers/attendanceController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/students', authenticateToken, requireRole(['faculty', 'admin']), getStudents);
router.post('/mark', authenticateToken, requireRole(['faculty', 'admin']), markAttendance);
router.get('/records', authenticateToken, getAttendanceRecords);

export default router;

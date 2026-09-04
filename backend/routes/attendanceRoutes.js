import express from 'express';
import { createSession, endSession, checkIn, getSessionList, getSessionDetails, getStudentSummary } from '../controllers/attendanceController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/session', authenticateToken, requireRole(['faculty']), createSession);
router.post('/session/:id/end', authenticateToken, requireRole(['faculty']), endSession);
router.post('/checkin', authenticateToken, requireRole(['student']), checkIn);
router.get('/sessions', authenticateToken, requireRole(['faculty']), getSessionList);
router.get('/session/:id', authenticateToken, requireRole(['faculty']), getSessionDetails);
router.get('/student-summary', authenticateToken, requireRole(['student']), getStudentSummary);

export default router;

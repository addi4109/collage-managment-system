import express from 'express';
import {
  logProctorEvent,
  incrementWarning,
  blockStudent,
} from '../controllers/proctorController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Proctor logging and automatic warnings (Student triggers these during active exam attempts)
router.post('/log', requireRole(['student']), logProctorEvent);
router.post('/warning', requireRole(['student']), incrementWarning);

// Manual block student (Faculty or Admin only)
router.post('/block-student', requireRole(['faculty', 'principal']), blockStudent);

export default router;

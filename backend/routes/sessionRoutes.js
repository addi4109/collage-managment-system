import express from 'express';
import {
  createSession,
  startSession,
  endSession,
  getSessions,
} from '../controllers/sessionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['faculty', 'admin']));

router.post('/create', createSession);
router.post('/start/:id', startSession);
router.post('/end/:id', endSession);
router.get('/', getSessions);

export default router;

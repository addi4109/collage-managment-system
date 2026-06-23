import express from 'express';
import {
  createLostFound,
  updateLostFound,
  deleteLostFound,
  getAllLostFound,
  addReply,
  getReplies,
} from '../controllers/lostFoundController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole(['faculty', 'admin']), createLostFound);
router.get('/', authenticateToken, getAllLostFound);
router.put('/:id', authenticateToken, requireRole(['faculty', 'admin']), updateLostFound);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'admin']), deleteLostFound);
router.post('/reply/:id', authenticateToken, requireRole(['student']), addReply);
router.get('/replies/:id', authenticateToken, requireRole(['faculty', 'admin']), getReplies);

export default router;

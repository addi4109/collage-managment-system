import express from 'express';
import { createNotice, getAllNotices, deleteNotice } from '../controllers/noticeController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole(['faculty', 'admin']), createNotice);
router.get('/', authenticateToken, getAllNotices);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'admin']), deleteNotice);

export default router;

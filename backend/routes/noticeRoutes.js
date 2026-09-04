import express from 'express';
import {
  createNotice,
  getNotices,
  editNotice,
  removeNotice,
  markRead,
} from '../controllers/noticeController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getNotices);
router.post('/:id/read', authenticateToken, markRead);

// Faculty / Admin scoped
router.post('/', authenticateToken, requireRole(['faculty', 'principal']), upload.array('attachments'), createNotice);
router.put('/:id', authenticateToken, requireRole(['faculty', 'principal']), upload.array('attachments'), editNotice);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'principal']), removeNotice);

export default router;

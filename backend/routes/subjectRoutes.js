import express from 'express';
import { getSubjects, createOrUpdateSubject, deleteSubject } from '../controllers/subjectController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getSubjects);

// Admin-only subject CRUD
router.post('/', authenticateToken, requireRole(['admin']), createOrUpdateSubject);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteSubject);

export default router;

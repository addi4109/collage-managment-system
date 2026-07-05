import express from 'express';
import { getSubjects, createOrUpdateSubject, deleteSubject } from '../controllers/subjectController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getSubjects);

// Admin & HOD subject CRUD
router.post('/', authenticateToken, requireRole(['principal', 'hod']), createOrUpdateSubject);
router.delete('/:id', authenticateToken, requireRole(['principal', 'hod']), deleteSubject);

export default router;

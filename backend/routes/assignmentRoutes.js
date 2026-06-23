import express from 'express';
import { createAssignment, getAssignments } from '../controllers/assignmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole(['faculty', 'admin']), createAssignment);
router.get('/', authenticateToken, getAssignments);

export default router;

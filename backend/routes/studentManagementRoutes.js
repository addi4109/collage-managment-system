import express from 'express';
import { listStudents, addStudent, editStudent, removeStudent, resetStudentPass } from '../controllers/studentManagementController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['faculty', 'admin']), listStudents);
router.post('/', authenticateToken, requireRole(['faculty', 'admin']), addStudent);
router.put('/:id', authenticateToken, requireRole(['faculty', 'admin']), editStudent);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'admin']), removeStudent);
router.post('/:id/reset-password', authenticateToken, requireRole(['faculty', 'admin']), resetStudentPass);

export default router;

import express from 'express';
import { listStudents, addStudent, editStudent, removeStudent, resetStudentPass } from '../controllers/studentManagementController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['faculty', 'principal']), listStudents);
router.post('/', authenticateToken, requireRole(['faculty', 'principal']), addStudent);
router.put('/:id', authenticateToken, requireRole(['faculty', 'principal']), editStudent);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'principal']), removeStudent);
router.post('/:id/reset-password', authenticateToken, requireRole(['faculty', 'principal']), resetStudentPass);

export default router;

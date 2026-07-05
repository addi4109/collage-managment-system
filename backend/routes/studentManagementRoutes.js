import express from 'express';
import { listStudents, addStudent, editStudent, removeStudent, resetStudentPass } from '../controllers/studentManagementController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['faculty', 'hod', 'principal']), listStudents);
router.post('/', authenticateToken, requireRole(['hod', 'principal']), addStudent);
router.put('/:id', authenticateToken, requireRole(['hod', 'principal']), editStudent);
router.delete('/:id', authenticateToken, requireRole(['hod', 'principal']), removeStudent);
router.post('/:id/reset-password', authenticateToken, requireRole(['hod', 'principal']), resetStudentPass);

export default router;

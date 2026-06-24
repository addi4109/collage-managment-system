import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  adminGetStudents,
} from '../controllers/studentManagementController.js';

const router = express.Router();

// Faculty: manage their own students
router.post('/', authenticateToken, requireRole(['faculty']), createStudent);
router.get('/', authenticateToken, requireRole(['faculty', 'admin']), getStudents);
router.get('/admin/all', authenticateToken, requireRole(['admin']), adminGetStudents);
router.get('/:id', authenticateToken, requireRole(['faculty', 'admin']), getStudent);
router.put('/:id', authenticateToken, requireRole(['faculty', 'admin']), updateStudent);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'admin']), deleteStudent);

export default router;

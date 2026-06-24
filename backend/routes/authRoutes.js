import express from 'express';
import {
  registerStudent,
  registerFaculty,
  loginStudent,
  loginFaculty,
  loginAdmin,
  logout,
  forgotPassword,
  getProfile,
} from '../controllers/authController.js';
import {
  getFacultyDepartments,
  updateActiveDepartment,
  updateStudentDepartment,
  updateFacultyDepartments,
  getAllFaculty,
  updateFacultyStatus,
  updateFacultyAssignment,
} from '../controllers/facultyController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/login-student', loginStudent);
router.post('/login-faculty', loginFaculty);
router.post('/login-admin', loginAdmin);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.get('/profile', authenticateToken, getProfile);

// Faculty department routes
router.get('/faculty/departments', authenticateToken, requireRole(['faculty']), getFacultyDepartments);
router.put('/faculty/active-department', authenticateToken, requireRole(['faculty']), updateActiveDepartment);

// Admin overrides
router.put('/admin/student/:id/department', authenticateToken, requireRole(['admin']), updateStudentDepartment);
router.put('/admin/faculty/:id/departments', authenticateToken, requireRole(['admin']), updateFacultyDepartments);
router.get('/admin/faculty', authenticateToken, requireRole(['admin']), getAllFaculty);
router.put('/admin/faculty/:id/status', authenticateToken, requireRole(['admin']), updateFacultyStatus);
router.put('/admin/faculty/:id/assign', authenticateToken, requireRole(['admin']), updateFacultyAssignment);

export default router;


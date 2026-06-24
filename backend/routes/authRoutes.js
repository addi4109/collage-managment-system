import express from 'express';
import {
  loginStudent,
  loginFaculty,
  loginAdmin,
  logout,
  forgotPassword,
  getProfile,
  adminCreateFaculty,
  adminUpdateFaculty,
  adminDeleteFaculty,
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

// ── Public Login Routes ──────────────────────────────────
router.post('/login-student', loginStudent);
router.post('/login-faculty', loginFaculty);
router.post('/login-admin', loginAdmin);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);

// ── Protected Profile Route ──────────────────────────────
router.get('/profile', authenticateToken, getProfile);

// ── Faculty Department Switcher (faculty portal) ─────────
router.get('/faculty/departments', authenticateToken, requireRole(['faculty']), getFacultyDepartments);
router.put('/faculty/active-department', authenticateToken, requireRole(['faculty']), updateActiveDepartment);

// ── Admin: Faculty Account Management (CRUD) ─────────────
// Create faculty account (admin only)
router.post('/admin/faculty', authenticateToken, requireRole(['admin']), adminCreateFaculty);
// Get all faculty list
router.get('/admin/faculty', authenticateToken, requireRole(['admin']), getAllFaculty);
// Update faculty (full edit including password reset, assignedYear)
router.put('/admin/faculty/:id', authenticateToken, requireRole(['admin']), adminUpdateFaculty);
// Delete faculty account
router.delete('/admin/faculty/:id', authenticateToken, requireRole(['admin']), adminDeleteFaculty);

// ── Admin: Status & Assignment overrides (legacy) ────────
router.put('/admin/faculty/:id/status', authenticateToken, requireRole(['admin']), updateFacultyStatus);
router.put('/admin/faculty/:id/assign', authenticateToken, requireRole(['admin']), updateFacultyAssignment);
router.put('/admin/faculty/:id/departments', authenticateToken, requireRole(['admin']), updateFacultyDepartments);
router.put('/admin/student/:id/department', authenticateToken, requireRole(['admin']), updateStudentDepartment);

export default router;

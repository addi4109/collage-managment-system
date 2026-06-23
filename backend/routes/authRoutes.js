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
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/login-student', loginStudent);
router.post('/login-faculty', loginFaculty);
router.post('/login-admin', loginAdmin);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.get('/profile', authenticateToken, getProfile);

export default router;

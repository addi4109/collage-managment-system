import express from 'express';
import { getCaptcha, loginUser, refreshSession, logoutUser, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/captcha', getCaptcha);
router.post('/login', loginRateLimiter, loginUser);
router.post('/refresh', refreshSession);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', authenticateToken, getMe);

export default router;

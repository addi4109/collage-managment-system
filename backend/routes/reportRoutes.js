import express from 'express';
import { getDashboardAnalytics, downloadStudentsReport, downloadAttendanceReport, downloadPerformanceReport } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/analytics', getDashboardAnalytics);
router.get('/students', downloadStudentsReport);
router.get('/attendance', downloadAttendanceReport);
router.get('/performance', downloadPerformanceReport);

export default router;

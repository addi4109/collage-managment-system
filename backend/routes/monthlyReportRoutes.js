import express from 'express';
import {
  createOrUpdateReport,
  getReports,
  signReport,
  publishReport,
} from '../controllers/monthlyReportController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getReports);
router.post('/', authenticateToken, requireRole(['faculty', 'principal']), createOrUpdateReport);
router.put('/:reportId/publish', authenticateToken, requireRole(['faculty', 'principal']), publishReport);
router.put('/:reportId/sign', authenticateToken, requireRole(['student']), signReport);

export default router;

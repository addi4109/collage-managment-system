import express from 'express';
import {
  createStructure,
  getStructures,
  createBatchInvoices,
  getMyFees,
  getStudentFees,
  payInstallment,
  getBillingStats,
} from '../controllers/feeController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Student payments
router.get('/my', requireRole(['student']), getMyFees);
router.post('/pay', requireRole(['student']), payInstallment);

// Faculty & Admin: structures and view student billing
router.get('/structures', requireRole(['principal', 'faculty']), getStructures);
router.get('/student/:studentId', requireRole(['principal', 'faculty']), getStudentFees);

// Admin-only invoicing & setup
router.post('/structures', requireRole(['principal']), createStructure);
router.post('/batch-invoice', requireRole(['principal']), createBatchInvoices);
router.get('/analytics', requireRole(['principal']), getBillingStats);

export default router;

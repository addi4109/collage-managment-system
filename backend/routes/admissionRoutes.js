import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  createAdmissionRequest,
  getAdmissionRequests,
  approveAdmissionRequest,
  rejectAdmissionRequest,
  deleteAdmissionRequest,
} from '../controllers/admissionController.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole(['faculty']), createAdmissionRequest);
router.get('/', authenticateToken, requireRole(['faculty', 'admin']), getAdmissionRequests);
router.post('/:id/approve', authenticateToken, requireRole(['admin']), approveAdmissionRequest);
router.post('/:id/reject', authenticateToken, requireRole(['admin']), rejectAdmissionRequest);
router.delete('/:id', authenticateToken, requireRole(['faculty', 'admin']), deleteAdmissionRequest);

export default router;

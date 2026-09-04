import express from 'express';
import { createRequest, getPending, approve, reject } from '../controllers/admissionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request', authenticateToken, requireRole(['faculty']), createRequest);
router.get('/pending', authenticateToken, requireRole(['principal']), getPending);
router.post('/approve/:id', authenticateToken, requireRole(['principal']), approve);
router.post('/reject/:id', authenticateToken, requireRole(['principal']), reject);

export default router;

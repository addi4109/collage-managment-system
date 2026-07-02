import express from 'express';
import { apply, list, updateStatus } from '../controllers/scholarshipController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/apply', requireRole(['student']), apply);
router.get('/', list);
router.put('/:scholarshipId', requireRole(['admin', 'faculty']), updateStatus);

export default router;

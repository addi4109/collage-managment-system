import express from 'express';
import { getLogsList } from '../controllers/auditController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/', getLogsList);

export default router;

import express from 'express';
import { getStudents, getDraft, saveDraft, submit, listPending, approve, declare, declareAll, getMarksheet } from '../controllers/resultController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Faculty routes
router.get('/students', requireRole(['faculty']), getStudents);
router.get('/student/:studentId', requireRole(['faculty']), getDraft);
router.post('/student/:studentId', requireRole(['faculty']), saveDraft);
router.post('/student/:studentId/submit', requireRole(['faculty']), submit);

// Admin routes
router.get('/pending', requireRole(['admin']), listPending);
router.post('/approve/:id', requireRole(['admin']), approve);
router.post('/declare/:id', requireRole(['admin']), declare);
router.post('/declare-all', requireRole(['admin']), declareAll);

// Student routes
router.get('/marksheet', requireRole(['student']), getMarksheet);

export default router;

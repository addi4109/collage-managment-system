import express from 'express';
import {
  saveDaySchedule,
  getClassSchedule,
  getMySchedule,
  deleteEntry,
} from '../controllers/timetableController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/my', getMySchedule);
router.get('/class', getClassSchedule);
router.post('/', requireRole(['admin']), saveDaySchedule);
router.delete('/:id', requireRole(['admin']), deleteEntry);

export default router;

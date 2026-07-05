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
router.post('/', requireRole(['principal']), saveDaySchedule);
router.delete('/:id', requireRole(['principal']), deleteEntry);

export default router;

import express from 'express';
import { createEvent, getEvents, updateEvent, deleteEvent } from '../controllers/calendarController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getEvents);
router.post('/', authenticateToken, requireRole(['faculty', 'admin']), createEvent);
router.put('/:eventId', authenticateToken, requireRole(['faculty', 'admin']), updateEvent);
router.delete('/:eventId', authenticateToken, requireRole(['faculty', 'admin']), deleteEvent);

export default router;

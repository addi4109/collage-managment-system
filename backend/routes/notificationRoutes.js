import express from 'express';
import { listMyNotifications, read, readAll, sendNotification, getSent, listRecipients } from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Inbox
router.get('/', listMyNotifications);
router.post('/:id/read', read);
router.post('/read-all', readAll);

// Outbox / Sent
router.get('/sent', getSent);

// Send notification (admin + faculty + hod)
router.post('/send', requireRole(['principal', 'faculty', 'hod']), sendNotification);

// List recipients for individual picker
router.get('/recipients', requireRole(['principal', 'faculty', 'hod']), listRecipients);

export default router;

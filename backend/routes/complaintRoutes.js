import express from 'express';
import { createComplaint, listComplaints, updateComplaint } from '../controllers/complaintController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', requireRole(['student']), upload.array('file'), createComplaint);
router.get('/', listComplaints);
router.put('/:complaintId', requireRole(['admin', 'faculty']), updateComplaint);

export default router;

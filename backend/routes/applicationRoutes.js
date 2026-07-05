import express from 'express';
import { submitApplication, listMyApplications, listPending, review } from '../controllers/applicationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Applicant routes
router.post('/', authenticateToken, requireRole(['student', 'faculty', 'hod']), upload.array('attachments'), submitApplication);
router.get('/my', authenticateToken, requireRole(['student', 'faculty', 'hod']), listMyApplications);

// Admin/HOD reviews
router.get('/pending', authenticateToken, requireRole(['principal', 'hod']), listPending);
router.post('/review/:id', authenticateToken, requireRole(['principal', 'hod']), review);

export default router;

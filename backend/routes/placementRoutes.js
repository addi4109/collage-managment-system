import express from 'express';
import {
  createDrive,
  listDrives,
  applyDrive,
  listApplications,
  updateStatus,
  getAnalytics,
  removeDrive,
} from '../controllers/placementController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/drives', listDrives);
router.post('/drives', requireRole(['admin', 'faculty']), createDrive);
router.delete('/drives/:driveId', requireRole(['admin', 'faculty']), removeDrive);

// Applications
router.post('/drives/:driveId/apply', requireRole(['student']), upload.single('resume'), applyDrive);
router.get('/drives/:driveId/applications', requireRole(['admin', 'faculty']), listApplications);
router.put('/applications/:applicationId', requireRole(['admin', 'faculty']), updateStatus);

// Analytics
router.get('/analytics', requireRole(['admin', 'faculty']), getAnalytics);

export default router;

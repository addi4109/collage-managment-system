import express from 'express';
import {
  createDrive,
  listDrives,
  applyDrive,
  listApplications,
  updateStatus,
  getAnalytics,
  removeDrive,
  publishDrive,
} from '../controllers/placementController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/drives', listDrives);
router.post('/drives', requireRole(['principal']), createDrive);
router.delete('/drives/:driveId', requireRole(['principal']), removeDrive);
router.put('/drives/:driveId/publish', requireRole(['hod']), publishDrive);

// Applications
router.post('/drives/:driveId/apply', requireRole(['student']), upload.single('resume'), applyDrive);
router.get('/drives/:driveId/applications', requireRole(['principal', 'hod']), listApplications);
router.put('/applications/:applicationId', requireRole(['principal', 'hod']), updateStatus);

// Analytics
router.get('/analytics', requireRole(['principal']), getAnalytics);

export default router;

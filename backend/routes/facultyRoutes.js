import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  createFaculty,
  getFacultyList,
  getFacultyDetails,
  updateFaculty,
  resetPassword,
  updateFacultyStatus,
  deleteFaculty,
} from '../controllers/facultyManagementController.js';

const router = express.Router();

router.use(authenticateToken);

// Read routes accessible by any authenticated role (including student for grievances)
router.get('/', getFacultyList);
router.get('/:id', getFacultyDetails);

// Write/management routes restricted to Admin
router.post('/', requireRole(['admin']), createFaculty);
router.put('/:id', requireRole(['admin']), updateFaculty);
router.put('/:id/password', requireRole(['admin']), resetPassword);
router.put('/:id/status', requireRole(['admin']), updateFacultyStatus);
router.delete('/:id', requireRole(['admin']), deleteFaculty);

export default router;

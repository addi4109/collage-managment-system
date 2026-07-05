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
router.post('/', requireRole(['principal']), createFaculty);
router.put('/:id', requireRole(['principal']), updateFaculty);
router.put('/:id/password', requireRole(['principal']), resetPassword);
router.put('/:id/status', requireRole(['principal']), updateFacultyStatus);
router.delete('/:id', requireRole(['principal']), deleteFaculty);

export default router;

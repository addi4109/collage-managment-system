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
router.use(requireRole(['admin']));

router.post('/', createFaculty);
router.get('/', getFacultyList);
router.get('/:id', getFacultyDetails);
router.put('/:id', updateFaculty);
router.put('/:id/password', resetPassword);
router.put('/:id/status', updateFacultyStatus);
router.delete('/:id', deleteFaculty);

export default router;

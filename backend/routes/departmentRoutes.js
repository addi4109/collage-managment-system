import express from 'express';
import {
  verifyMasterCode,
  verifyDepartmentSecret,
  verifySemesterSecret,
  getDepartments,
  createOrUpdateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for verification wizard
router.post('/verify-master', verifyMasterCode);
router.post('/verify-secret', verifyDepartmentSecret);
router.post('/verify-semester', verifySemesterSecret);
router.get('/', getDepartments);

// Admin-only department CRUD
router.post('/', authenticateToken, requireRole(['admin']), createOrUpdateDepartment);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteDepartment);

export default router;

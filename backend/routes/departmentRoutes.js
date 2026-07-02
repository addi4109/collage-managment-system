import express from 'express';
import { getDepartments, createOrUpdateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getDepartments);

// Admin-only department CRUD
router.post('/', authenticateToken, requireRole(['admin']), createOrUpdateDepartment);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteDepartment);

export default router;

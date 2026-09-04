import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import * as hodController from '../controllers/hodController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['hod']));

router.get('/stats', hodController.getHodStats);
router.get('/faculty', hodController.getDeptFaculty);
router.get('/students', hodController.getDeptStudents);

export default router;

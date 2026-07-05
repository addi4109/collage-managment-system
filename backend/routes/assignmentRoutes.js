import express from 'express';
import {
  createAssignment,
  getAssignments,
  getSubmissions,
  submitAssignment,
  gradeSubmission,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole(['faculty', 'principal']), createAssignment);
router.get('/', authenticateToken, getAssignments);
router.delete('/:assignmentId', authenticateToken, requireRole(['faculty', 'principal']), deleteAssignment);

// Submissions endpoints
router.get('/:assignmentId/submissions', authenticateToken, requireRole(['faculty', 'principal']), getSubmissions);
router.post('/:assignmentId/submit', authenticateToken, requireRole(['student']), upload.single('file'), submitAssignment);
router.put('/submissions/:submissionId/grade', authenticateToken, requireRole(['faculty', 'principal']), gradeSubmission);

export default router;

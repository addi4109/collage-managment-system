import express from 'express';
import {
  createBook,
  listBooks,
  issue,
  returnBk,
  getStudentLends,
  getLendLogs,
} from '../controllers/libraryController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/books', listBooks);
router.get('/my-issues', requireRole(['student']), getStudentLends);

// Admin controls
router.post('/books', requireRole(['principal']), createBook);
router.post('/issue', requireRole(['principal']), issue);
router.put('/return/:issueLogId', requireRole(['principal']), returnBk);
router.get('/logs', requireRole(['principal', 'faculty']), getLendLogs);

export default router;

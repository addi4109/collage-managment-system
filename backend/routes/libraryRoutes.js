import express from 'express';
import {
  createBook,
  listBooks,
  editBook,
  deleteBook,
  issue,
  renewBook,
  returnBk,
  getStudentLends,
  getLendLogs,
} from '../controllers/libraryController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/books', listBooks);
router.get('/my-issues', requireRole(['student']), getStudentLends);

// Admin / Librarian controls
router.post('/books', requireRole(['principal', 'librarian']), createBook);
router.put('/books/:bookId', requireRole(['principal', 'librarian']), editBook);
router.delete('/books/:bookId', requireRole(['principal', 'librarian']), deleteBook);
router.post('/issue', requireRole(['principal', 'librarian']), issue);
router.put('/renew/:issueLogId', requireRole(['principal', 'librarian']), renewBook);
router.put('/return/:issueLogId', requireRole(['principal', 'librarian']), returnBk);
router.get('/logs', requireRole(['principal', 'faculty', 'librarian']), getLendLogs);

export default router;

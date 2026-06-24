import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  createPlacementDrive,
  getPlacementDrives,
  applyToPlacementDrive,
  updatePlacementSelections,
  addBook,
  getBooks,
  issueBook,
  returnBook,
  getStudentFeeDetails,
  payFee,
  setFeeStructure,
  addCalendarEvent,
  getCalendarEvents,
  requestCertificate,
} from '../controllers/erpController.js';

const router = express.Router();

// ── Placement Routes ──
router.post('/placements', authenticateToken, requireRole(['admin']), createPlacementDrive);
router.get('/placements', authenticateToken, getPlacementDrives);
router.post('/placements/:driveId/apply', authenticateToken, requireRole(['student']), applyToPlacementDrive);
router.put('/placements/:driveId/selections', authenticateToken, requireRole(['admin']), updatePlacementSelections);

// ── Library Routes ──
router.post('/library/books', authenticateToken, requireRole(['admin']), addBook);
router.get('/library/books', authenticateToken, getBooks);
router.post('/library/books/:bookId/issue', authenticateToken, requireRole(['admin']), issueBook);
router.post('/library/books/:bookId/return', authenticateToken, requireRole(['admin']), returnBook);

// ── Fee Routes ──
router.get('/fees', authenticateToken, getStudentFeeDetails);
router.post('/fees/pay', authenticateToken, requireRole(['student']), payFee);
router.post('/fees/structure', authenticateToken, requireRole(['admin']), setFeeStructure);

// ── Calendar Events ──
router.post('/events', authenticateToken, requireRole(['admin']), addCalendarEvent);
router.get('/events', authenticateToken, getCalendarEvents);

// ── Certificates ──
router.post('/certificates/request', authenticateToken, requireRole(['student']), requestCertificate);

export default router;

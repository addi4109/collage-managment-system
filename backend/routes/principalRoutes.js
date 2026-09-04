import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import * as principalController from '../controllers/principalController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['principal']));

router.get('/stats', principalController.getPrincipalStats);
router.post('/hod', principalController.createHOD);
router.get('/hods', principalController.getHODs);
router.delete('/hod/:id', principalController.deleteHOD);

router.post('/librarian', principalController.createLibrarian);
router.get('/librarians', principalController.getLibrarians);
router.delete('/librarian/:id', principalController.deleteLibrarian);

export default router;

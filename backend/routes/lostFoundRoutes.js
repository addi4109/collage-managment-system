import express from 'express';
import { create, list, reply, resolve, remove } from '../controllers/lostFoundController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', list);
router.post('/', upload.array('attachments'), create);
router.post('/:id/reply', reply);
router.post('/:id/resolve', resolve);
router.delete('/:id', remove);

export default router;

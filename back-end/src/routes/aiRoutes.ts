import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// AI 功能通常需要登录
router.use(authenticateToken);

router.post('/chat', aiController.chat);

export default router;


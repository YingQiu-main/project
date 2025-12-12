import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// AI 功能通常需要登录
router.use(authenticateToken);

// 非流式聊天接口
router.post('/chat', aiController.chat);

// 流式聊天接口
router.post('/chat/stream', aiController.chatStream);

export default router;


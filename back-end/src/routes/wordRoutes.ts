import { Router } from 'express';
import * as wordController from '../controllers/wordController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 获取随机单词（需登录）
// GET /api/words/random
router.get('/random', authenticateToken, wordController.getRandomWord);

// 提交练习结果（需登录）
// POST /api/words/progress
// router.post('/progress', authenticateToken, wordController.updateProgress);

export default router;


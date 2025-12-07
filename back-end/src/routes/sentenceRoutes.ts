import { Router } from 'express';
import * as sentenceController from '../controllers/sentenceController';
// import { authenticateToken } from '../middleware/authMiddleware'; // 如果需要登录才能访问

const router = Router();

// GET /api/sentences - 获取列表
router.get('/', sentenceController.getSentences);

// GET /api/sentences/:id - 获取详情
router.get('/:id', sentenceController.getSentenceById);

// POST /api/sentences - 创建 (建议加上管理员权限验证)
router.post('/', sentenceController.createSentence);

export default router;


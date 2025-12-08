import { Router } from 'express';
import * as wordController from '../controllers/wordController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 获取所有章节列表（需登录）
// GET /api/words/chapters
router.get('/chapters', authenticateToken, wordController.getChapters);

// 获取指定章节的单词列表（包含用户学习状态）（需登录）
// GET /api/words/chapters/:chapterId
router.get('/chapters/:chapterId', authenticateToken, wordController.getChapterWords);

// 提交章节练习结果（需登录）
// POST /api/words/chapters/:chapterId/practice
router.post('/chapters/:chapterId/practice', authenticateToken, wordController.submitChapterPractice);

// 获取用户在指定章节的学习进度统计（需登录）
// GET /api/words/chapters/:chapterId/progress
router.get('/chapters/:chapterId/progress', authenticateToken, wordController.getChapterProgress);

// 获取随机单词（需登录）
// GET /api/words/random
router.get('/random', authenticateToken, wordController.getRandomWord);

export default router;


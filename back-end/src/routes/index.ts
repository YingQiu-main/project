import { Router } from 'express';
import authRoutes from './authRoutes';
import wordRoutes from './wordRoutes';
import sentenceRoutes from './sentenceRoutes';
import articleRoutes from './articleRoutes';
import progressRoutes from './progressRoutes';
import favoriteRoutes from './favoriteRoutes';
import aiRoutes from './aiRoutes';

const router = Router();

// 挂载各个模块的路由

// 认证相关接口：/api/auth/login, /api/auth/register
router.use('/auth', authRoutes);

// 单词相关接口：/api/words/random, /api/words/check
router.use('/words', wordRoutes);

// 长难句相关接口: /api/sentences
router.use('/sentences', sentenceRoutes);

// 文章相关接口: /api/articles
router.use('/articles', articleRoutes);

// 学习进度与统计: /api/progress
router.use('/progress', progressRoutes);

// 收藏夹: /api/favorites
router.use('/favorites', favoriteRoutes);

// AI 辅助: /api/ai
router.use('/ai', aiRoutes);

export default router;


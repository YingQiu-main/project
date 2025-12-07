import { Router } from 'express';
import * as progressController from '../controllers/progressController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 所有进度相关的接口都需要登录
router.use(authenticateToken);

router.post('/', progressController.recordProgress);
router.get('/stats', progressController.getStats);

export default router;


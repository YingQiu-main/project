import { Router } from 'express';
import * as favoriteController from '../controllers/favoriteController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/toggle', favoriteController.toggleFavorite);
router.get('/', favoriteController.getFavorites);

export default router;


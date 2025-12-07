import { Router } from 'express';
import * as articleController from '../controllers/articleController';

const router = Router();

router.get('/', articleController.getArticles);
router.get('/:id', articleController.getArticleById);
router.post('/', articleController.createArticle);

export default router;


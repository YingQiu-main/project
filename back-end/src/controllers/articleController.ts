import { Request, Response } from 'express';
import ArticleModel from '../models/Article';

// 获取文章列表
export const getArticles = async (req: Request, res: Response) => {
  try {
    // 列表页不需要返回全文
    const articles = ArticleModel.findAllSummaries();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error });
  }
};

// 获取文章详情
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = ArticleModel.findById(Number(id));
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article', error });
  }
};

// 创建文章
export const createArticle = async (req: Request, res: Response) => {
  try {
    const { title, content, translation, difficulty } = req.body;
    const article = ArticleModel.create({ title, content, translation, difficulty });
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error creating article', error });
  }
};

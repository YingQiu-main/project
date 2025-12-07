import { Request, Response } from 'express';
import { Article } from '../models';

// 获取文章列表
export const getArticles = async (req: Request, res: Response) => {
  try {
    const articles = await Article.findAll({
      attributes: ['id', 'title', 'difficulty'] // 列表页不需要返回全文
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error });
  }
};

// 获取文章详情
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
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
    const article = await Article.create({ title, content, translation, difficulty });
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error creating article', error });
  }
};


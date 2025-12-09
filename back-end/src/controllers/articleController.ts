import { Request, Response } from 'express';
import ArticleModel from '../models/Article';

// 获取文章列表（只返回标题和阅读时长）
export const getArticles = async (req: Request, res: Response) => {
  try {
    // 列表页只需要返回标题和阅读时长
    const articles = ArticleModel.findAllSummaries();
    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ 
      success: false,
      message: '获取文章列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 获取文章详情（返回完整信息）
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const articleId = Number(id);
    
    if (isNaN(articleId)) {
      return res.status(400).json({ 
        success: false,
        message: '文章ID格式错误' 
      });
    }
    
    const article = ArticleModel.findById(articleId);
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: '文章不存在' 
      });
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({ 
      success: false,
      message: '获取文章详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 创建文章（保留用于管理后台）
export const createArticle = async (req: Request, res: Response) => {
  try {
    const { level, title, content, translation, vocabulary, reading_time } = req.body;
    
    // 验证必填字段
    if (!level || !title || !content || !translation || !reading_time) {
      return res.status(400).json({ 
        success: false,
        message: '缺少必填字段：level, title, content, translation, reading_time' 
      });
    }
    
    const article = ArticleModel.create({ 
      level, 
      title, 
      content, 
      translation, 
      vocabulary: vocabulary || [], 
      reading_time 
    });
    
    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({ 
      success: false,
      message: '创建文章失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

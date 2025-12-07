import { Request, Response } from 'express';
import { StudyRecord, sequelize } from '../models';
import { Op } from 'sequelize';

// 记录学习进度
export const recordProgress = async (req: Request, res: Response) => {
  try {
    // authMiddleware 已经在 req 中注入了 user 对象
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;
    
    const { type, targetId, isCorrect, action } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const record = await StudyRecord.create({
      userId,
      type,
      targetId,
      isCorrect,
      action
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error recording progress', error });
  }
};

// 获取用户学习统计数据
export const getStats = async (req: Request, res: Response) => {
  try {
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 统计累计练习单词数
    const wordCount = await StudyRecord.count({
      where: { userId, type: 'word', action: 'practice' }
    });

    // 统计文章阅读量
    const articleCount = await StudyRecord.count({
      where: { userId, type: 'article', action: 'read' },
      distinct: true,
      col: 'targetId'
    });

    // 简单的正确率计算 (仅示例)
    const correctCount = await StudyRecord.count({
      where: { userId, type: 'word', isCorrect: true }
    });
    const totalPractice = await StudyRecord.count({
      where: { userId, type: 'word', action: 'practice' } // 这里假设 practice 动作包含 isCorrect 字段
    });

    const accuracy = totalPractice > 0 ? (correctCount / totalPractice) : 0;

    res.json({
      wordCount,
      articleCount,
      accuracy,
      // 可以添加更多维度的统计
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error });
  }
};


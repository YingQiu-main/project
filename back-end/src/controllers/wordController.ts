import { Request, Response } from 'express';
import Word from '../models/Word';
import { Sequelize } from 'sequelize';

// 获取随机单词
export const getRandomWord = async (req: Request, res: Response) => {
  try {
    // 使用 Sequelize 的随机排序功能
    const word = await Word.findOne({
      order: [Sequelize.fn('RANDOM')],
    });

    if (!word) {
      return res.status(404).json({ message: 'No words found in database' });
    }

    res.json(word);
  } catch (error) {
    console.error('Error fetching random word:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


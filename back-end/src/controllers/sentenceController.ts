import { Request, Response } from 'express';
import { Sentence } from '../models';

// 获取所有长难句列表
export const getSentences = async (req: Request, res: Response) => {
  try {
    const sentences = await Sentence.findAll();
    res.json(sentences);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sentences', error });
  }
};

// 获取单个长难句详情
export const getSentenceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sentence = await Sentence.findByPk(id);
    if (!sentence) {
      return res.status(404).json({ message: 'Sentence not found' });
    }
    res.json(sentence);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sentence', error });
  }
};

// 创建长难句 (管理员用，或者初始化脚本用)
export const createSentence = async (req: Request, res: Response) => {
  try {
    const { content, translation, analysis } = req.body;
    const newSentence = await Sentence.create({ content, translation, analysis });
    res.status(201).json(newSentence);
  } catch (error) {
    res.status(500).json({ message: 'Error creating sentence', error });
  }
};


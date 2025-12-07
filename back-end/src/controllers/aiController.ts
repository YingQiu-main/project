import { Request, Response } from 'express';

// AI 问答接口 (Mock)
export const chat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    // 这里应该调用实际的 AI API (如 OpenAI, Anthropic 等)
    // 目前返回模拟数据
    
    const reply = `[AI Mock Reply] You asked: "${message}". Here is a detailed explanation regarding your English learning query...`;

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: 'AI Service Error', error });
  }
};


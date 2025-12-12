import { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 初始化 OpenAI 客户端
// 优先使用环境变量，如果没有则使用默认值（来自用户提供的示例）
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-SaLr3FQeW3PeqAHD2hFSY0ycgBli6NwmW9TvTajY3igUZPAC',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.chatanywhere.tech/v1'
});

/**
 * AI 聊天接口（非流式）
 * 接收用户消息，调用 AI 模型并返回完整回复
 * 支持单条消息或多轮对话
 */
export const chat = async (req: Request, res: Response) => {
  try {
    const { message, model = 'gpt-3.5-turbo', messages } = req.body;
    
    // 验证请求参数
    // 支持单条消息或多轮对话
    let chatMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    
    if (messages && Array.isArray(messages)) {
      // 使用多轮对话消息
      chatMessages = messages;
    } else if (message && typeof message === 'string') {
      // 使用单条消息
      chatMessages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({ 
        message: 'Invalid request: message or messages is required' 
      });
    }
    
    // 调用 AI API
    const chatCompletion = await client.chat.completions.create({
      messages: chatMessages,
      model: model
    });
    
    // 提取回复内容
    const choice = chatCompletion.choices[0];
    const reply = choice?.message?.content || '抱歉，我无法生成回复。';
    
    // 返回格式化的响应
    res.json({ 
      reply,
      // 可选：返回完整的响应数据供调试
      raw: {
        index: choice?.index,
        message: choice?.message,
        logprobs: choice?.logprobs,
        finish_reason: choice?.finish_reason
      }
    });
  } catch (error: any) {
    console.error('AI Service Error:', error);
    
    // 处理不同类型的错误
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({ 
        message: 'AI API Error', 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'AI Service Error', 
      error: error?.message || 'Unknown error occurred' 
    });
  }
};

/**
 * AI 聊天接口（流式传输）
 * 使用 Server-Sent Events (SSE) 实时推送 AI 回复
 */
export const chatStream = async (req: Request, res: Response) => {
  try {
    const { message, model = 'gpt-3.5-turbo', messages } = req.body;
    
    // 验证请求参数
    // 支持单条消息或多轮对话
    let chatMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    
    if (messages && Array.isArray(messages)) {
      // 使用多轮对话消息
      chatMessages = messages;
    } else if (message && typeof message === 'string') {
      // 使用单条消息
      chatMessages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({ 
        message: 'Invalid request: message or messages is required' 
      });
    }
    
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
    
    // 调用流式 AI API
    const stream = await client.chat.completions.create({
      model: model,
      messages: chatMessages,
      stream: true,
    });
    
    // 逐块发送数据
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.content) {
        // 发送内容块，格式: data: {content}
        res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
      }
      
      // 检查是否完成
      if (chunk.choices[0]?.finish_reason) {
        // 发送完成信号
        res.write(`data: ${JSON.stringify({ 
          done: true, 
          finish_reason: chunk.choices[0].finish_reason 
        })}\n\n`);
        break;
      }
    }
    
    // 关闭连接
    res.end();
  } catch (error: any) {
    console.error('AI Stream Service Error:', error);
    
    // 发送错误信息
    res.write(`data: ${JSON.stringify({ 
      error: true, 
      message: error?.message || 'Unknown error occurred' 
    })}\n\n`);
    res.end();
  }
};

/**
 * 发送消息到 AI（通用函数，支持多轮对话）
 * @param messages 消息数组，格式: [{ role: 'user' | 'assistant' | 'system', content: string }]
 * @param model 模型名称，默认为 'gpt-3.5-turbo'
 * @returns Promise<ChatCompletion>
 */
export async function sendMessage(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string = 'gpt-3.5-turbo'
) {
  try {
    const chatCompletion = await client.chat.completions.create({
      messages,
      model,
      stream: false
    });
    
    return chatCompletion;
  } catch (error: any) {
    console.error('sendMessage Error:', error);
    throw error;
  }
}

/**
 * 流式发送消息到 AI（通用函数，支持多轮对话）
 * @param messages 消息数组，格式: [{ role: 'user' | 'assistant' | 'system', content: string }]
 * @param model 模型名称，默认为 'gpt-3.5-turbo'
 * @param onChunk 接收数据块的回调函数
 * @returns Promise<void>
 */
export async function sendMessageStream(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string = 'gpt-3.5-turbo',
  onChunk?: (content: string) => void
): Promise<string> {
  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    });
    
    let fullContent = '';
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.content) {
        fullContent += delta.content;
        if (onChunk) {
          onChunk(delta.content);
        }
      }
    }
    
    return fullContent;
  } catch (error: any) {
    console.error('sendMessageStream Error:', error);
    throw error;
  }
}

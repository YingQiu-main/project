// JWT 解码后的结构类型
import { JwtPayload } from 'jsonwebtoken';
// 类型声明语法,全局类型合并
declare global {
  // 给 原来的 Express.Request 接口加字段
  namespace Express {
    interface Request {
      user?: string | JwtPayload | { userId: number; username: string };
    }
  }
}

export {}
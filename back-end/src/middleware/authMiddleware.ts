import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Express 的 Request 类型已经在 src/types/express.d.ts 中定义
// 这里我们直接使用 Request，req.user 将会被识别

// JWT 验证中间件
// 作用：拦截请求，验证请求头中的 Token 是否有效
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. 从请求头获取 Authorization 字段
  // 格式通常为: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 获取 Bearer 后面的 token 字符串

  // 2. 如果没有 token，返回 401 未授权
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // 3. 验证 token
  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      // token 过期或无效，返回 403 禁止访问
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // 4. 验证通过，将解析出的用户信息存入 req.user
    // 后续的 controller 可以通过 req.user 获取当前登录用户的 ID 和用户名
    req.user = user as any; // 使用 as any 或者匹配 JwtPayload 类型
    
    // 5. 放行，进入下一个中间件或控制器
    next();
  });
};

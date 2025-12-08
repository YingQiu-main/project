import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User';

// 注册逻辑
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 1. 检查用户是否已存在
    const existingUser = UserModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // 2. 第二个参数是盐的复杂度，进行哈希加密，返回加密后的字符串
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 创建用户
    const newUser = UserModel.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// 登录逻辑
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 1. 查找用户
    const user = UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. 生成 Access Token，payload放入usename和id，不要放密码，因为token是可以解码的，第二个参数使用密钥，第三个参数7d代表7天
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // 4. 生成刷新 Refresh Token (有效期较长，如 7 天)
    // 注意：实际项目中 Refresh Token 应该存储在数据库中以便吊销
    const refreshToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      { expiresIn: '7d' }
    );

    res.json({ 
      accessToken, 
      refreshToken, 
      username: user.username,
      userId: user.id 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// 刷新 Token 逻辑
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh Token Required' });
  }

  try {
    // 验证 Refresh Token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret', (err: any, user: any) => {
      if (err) return res.status(403).json({ message: 'Invalid Refresh Token' });

      // 生成新的 Access Token
      const accessToken = jwt.sign(
        { userId: user.userId, username: user.username },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '1h' }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

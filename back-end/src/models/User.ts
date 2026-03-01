import db from '../config/database';

export interface User {
  id: number;
  username: string;
  password: string;
}

export class UserModel {
  // 创建新用户
  static async create(user: Omit<User, 'id'>): Promise<User> {
    // SQL: 向 users 表插入新用户记录
    const [result] = await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [user.username, user.password]
    );
    const insertId = (result as any).insertId as number;
    return { ...user, id: insertId };
  }

  // 根据用户名查找用户
  static async findByUsername(username: string): Promise<User | undefined> {
    // SQL: 从 users 表中查询指定用户名
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    const users = rows as User[];
    return users[0];
  }

  // 根据用户ID查找用户
  static async findById(id: number): Promise<User | undefined> {
    // SQL: 从 users 表中查询指定 ID
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    const users = rows as User[];
    return users[0];
  }
}

export default UserModel;

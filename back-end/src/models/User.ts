import db from '../config/database';

export interface User {
  id: number;
  username: string;
  password: string;
}

export class UserModel {
  // 创建新用户
  static create(user: Omit<User, 'id'>): User {
    // SQL: 向users表插入新用户记录（用户名和密码）
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const info = stmt.run(user.username, user.password);
    return { ...user, id: info.lastInsertRowid as number };
  }

  // 根据用户名查找用户
  static findByUsername(username: string): User | undefined {
    // SQL: 从users表中查询指定用户名的用户信息
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;
    return user;
  }

  // 根据用户ID查找用户
  static findById(id: number): User | undefined {
    // SQL: 从users表中查询指定ID的用户信息
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User | undefined;
    return user;
  }
}

export default UserModel;

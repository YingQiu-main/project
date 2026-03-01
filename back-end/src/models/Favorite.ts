import db from '../config/database';

export interface Favorite {
  id: number;
  userId: number;
  type: 'word' | 'article' | 'sentence';
  targetId: number;
}

export class FavoriteModel {
  // 添加收藏
  static async create(favorite: Omit<Favorite, 'id'>): Promise<Favorite> {
    const [result] = await db.execute(
      'INSERT INTO favorites (userId, type, targetId) VALUES (?, ?, ?)',
      [favorite.userId, favorite.type, favorite.targetId]
    );
    return { ...favorite, id: (result as any).insertId as number };
  }

  // 根据用户ID、类型和目标ID查找收藏记录
  static async findByUserAndTarget(
    userId: number,
    type: string,
    targetId: number
  ): Promise<Favorite | undefined> {
    const [rows] = await db.query(
      'SELECT * FROM favorites WHERE userId = ? AND type = ? AND targetId = ? LIMIT 1',
      [userId, type, targetId]
    );
    const favorites = rows as Favorite[];
    return favorites[0];
  }

  // 删除收藏
  static async delete(userId: number, type: string, targetId: number): Promise<void> {
    await db.execute(
      'DELETE FROM favorites WHERE userId = ? AND type = ? AND targetId = ?',
      [userId, type, targetId]
    );
  }

  // 获取用户的所有收藏（可选择性按类型筛选）
  static async findAllByUser(userId: number, type?: string): Promise<Favorite[]> {
    if (type) {
      const [rows] = await db.query(
        'SELECT * FROM favorites WHERE userId = ? AND type = ?',
        [userId, type]
      );
      return rows as Favorite[];
    } else {
      const [rows] = await db.query('SELECT * FROM favorites WHERE userId = ?', [userId]);
      return rows as Favorite[];
    }
  }
}

export default FavoriteModel;

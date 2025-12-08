import db from '../config/database';

export interface Favorite {
  id: number;
  userId: number;
  type: 'word' | 'article' | 'sentence';
  targetId: number;
}

export class FavoriteModel {
  // 添加收藏
  static create(favorite: Omit<Favorite, 'id'>): Favorite {
    // SQL: 向favorites表插入新收藏记录（用户ID、收藏类型、目标ID）
    const stmt = db.prepare(
      'INSERT INTO favorites (userId, type, targetId) VALUES (?, ?, ?)'
    );
    const info = stmt.run(favorite.userId, favorite.type, favorite.targetId);
    return { ...favorite, id: info.lastInsertRowid as number };
  }

  // 根据用户ID、类型和目标ID查找收藏记录
  static findByUserAndTarget(
    userId: number,
    type: string,
    targetId: number
  ): Favorite | undefined {
    // SQL: 从favorites表中查询指定用户、类型和目标的收藏记录
    const stmt = db.prepare(
      'SELECT * FROM favorites WHERE userId = ? AND type = ? AND targetId = ?'
    );
    const favorite = stmt.get(userId, type, targetId) as Favorite | undefined;
    return favorite;
  }

  // 删除收藏
  static delete(userId: number, type: string, targetId: number): void {
    // SQL: 从favorites表中删除指定用户、类型和目标的收藏记录
    const stmt = db.prepare(
      'DELETE FROM favorites WHERE userId = ? AND type = ? AND targetId = ?'
    );
    stmt.run(userId, type, targetId);
  }

  // 获取用户的所有收藏（可选择性按类型筛选）
  static findAllByUser(userId: number, type?: string): Favorite[] {
    if (type) {
      // SQL: 从favorites表中查询指定用户和类型的收藏记录
      const stmt = db.prepare(
        'SELECT * FROM favorites WHERE userId = ? AND type = ?'
      );
      return stmt.all(userId, type) as Favorite[];
    } else {
      // SQL: 从favorites表中查询指定用户的所有收藏记录
      const stmt = db.prepare('SELECT * FROM favorites WHERE userId = ?');
      return stmt.all(userId) as Favorite[];
    }
  }
}

export default FavoriteModel;

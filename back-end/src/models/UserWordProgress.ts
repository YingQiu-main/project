import db from '../config/database';

export interface UserWordProgress {
  id: number;
  userId: number;
  wordId: number;
  chapterId: number;
  isMastered: number; // 0-未掌握，1-已掌握
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class UserWordProgressModel {
  // 创建或更新用户单词学习进度
  static async upsert(
    progress: Omit<UserWordProgress, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserWordProgress> {
    const lastPracticedAt = progress.lastPracticedAt ? new Date(progress.lastPracticedAt).toISOString() : null;

    // 用 MySQL 原生 upsert，避免先查再改的额外开销
    await db.execute(
      `INSERT INTO user_word_progress (userId, wordId, chapterId, isMastered, lastPracticedAt)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       isMastered = VALUES(isMastered),
       lastPracticedAt = VALUES(lastPracticedAt),
       updatedAt = CURRENT_TIMESTAMP`,
      [progress.userId, progress.wordId, progress.chapterId, progress.isMastered, lastPracticedAt]
    );

    const result = await this.findByUserWordChapter(progress.userId, progress.wordId, progress.chapterId);
    if (result) {
      return result;
    }
    
    // 如果查询不到，返回一个模拟对象（理论上不应该发生）
    return {
      ...progress,
      id: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // 批量更新用户单词学习进度
  static async batchUpsert(
    progresses: Omit<UserWordProgress, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const progress of progresses) {
        const lastPracticedAt = progress.lastPracticedAt
          ? new Date(progress.lastPracticedAt).toISOString()
          : null;
        await conn.execute(
          `INSERT INTO user_word_progress (userId, wordId, chapterId, isMastered, lastPracticedAt)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           isMastered = VALUES(isMastered),
           lastPracticedAt = VALUES(lastPracticedAt),
           updatedAt = CURRENT_TIMESTAMP`,
          [progress.userId, progress.wordId, progress.chapterId, progress.isMastered, lastPracticedAt]
        );
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 根据用户ID、单词ID和章节ID查找进度
  static async findByUserWordChapter(
    userId: number,
    wordId: number,
    chapterId: number
  ): Promise<UserWordProgress | undefined> {
    const [rows] = await db.query(
      'SELECT * FROM user_word_progress WHERE userId = ? AND wordId = ? AND chapterId = ? LIMIT 1',
      [userId, wordId, chapterId]
    );
    const progressList = rows as UserWordProgress[];
    return progressList[0];
  }

  // 获取用户在指定章节的所有单词进度
  static async findByUserChapter(userId: number, chapterId: number): Promise<UserWordProgress[]> {
    const [rows] = await db.query(
      'SELECT * FROM user_word_progress WHERE userId = ? AND chapterId = ?',
      [userId, chapterId]
    );
    return rows as UserWordProgress[];
  }

  // 获取用户在指定章节的掌握情况统计
  static async getChapterStats(userId: number, chapterId: number): Promise<{
    total: number;
    mastered: number;
    notMastered: number;
  }> {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isMastered = 1 THEN 1 ELSE 0 END) as mastered,
        SUM(CASE WHEN isMastered = 0 OR isMastered IS NULL THEN 1 ELSE 0 END) as notMastered
      FROM user_word_progress
      WHERE userId = ? AND chapterId = ?
    `, [userId, chapterId]);
    const result = (rows as Array<{ total: number | null; mastered: number | null; notMastered: number | null }>)[0];
    return {
      total: result.total ?? 0,
      mastered: result.mastered ?? 0,
      notMastered: result.notMastered ?? 0
    };
  }
}

export default UserWordProgressModel;


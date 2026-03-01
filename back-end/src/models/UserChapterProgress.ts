import db from '../config/database';

export interface UserChapterProgress {
  id: number;
  userId: number;
  chapterId: number;
  status: number; // 0-未学习，1-学习中，2-已完成
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class UserChapterProgressModel {
  // 创建或更新用户章节学习状态
  static async upsert(
    progress: Omit<UserChapterProgress, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserChapterProgress> {
    const lastPracticedAt = progress.lastPracticedAt ? new Date(progress.lastPracticedAt).toISOString() : null;

    // MySQL upsert：主键冲突时更新状态
    await db.execute(
      `INSERT INTO user_chapter_progress (userId, chapterId, status, lastPracticedAt)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       lastPracticedAt = VALUES(lastPracticedAt),
       updatedAt = CURRENT_TIMESTAMP`,
      [progress.userId, progress.chapterId, progress.status, lastPracticedAt]
    );

    const result = await this.findByUserChapter(progress.userId, progress.chapterId);
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

  // 根据用户ID和章节ID查找章节学习状态
  static async findByUserChapter(userId: number, chapterId: number): Promise<UserChapterProgress | undefined> {
    const [rows] = await db.query(
      'SELECT * FROM user_chapter_progress WHERE userId = ? AND chapterId = ? LIMIT 1',
      [userId, chapterId]
    );
    const progressList = rows as UserChapterProgress[];
    return progressList[0];
  }

  // 获取用户所有章节的学习状态
  static async findAllByUser(userId: number): Promise<UserChapterProgress[]> {
    const [rows] = await db.query('SELECT * FROM user_chapter_progress WHERE userId = ?', [userId]);
    return rows as UserChapterProgress[];
  }

  // 计算章节的完成状态（根据该章节所有单词的掌握情况）
  // 返回：0-未学习，1-学习中，2-已完成
  static async calculateChapterStatus(userId: number, chapterId: number, totalWords: number): Promise<number> {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isMastered = 1 THEN 1 ELSE 0 END) as mastered
      FROM user_word_progress
      WHERE userId = ? AND chapterId = ?
    `, [userId, chapterId]);
    const result = (rows as Array<{ total: number | null; mastered: number | null }>)[0];
    
    const practicedCount = result.total ?? 0;
    const masteredCount = result.mastered ?? 0;
    
    // 如果没有任何练习记录，返回未学习状态
    if (practicedCount === 0) {
      return 0; // 未学习
    }
    
    // 如果所有单词都已掌握，返回已完成状态
    if (masteredCount === totalWords && practicedCount === totalWords) {
      return 2; // 已完成
    }
    
    // 否则返回学习中状态
    return 1; // 学习中
  }
}

export default UserChapterProgressModel;


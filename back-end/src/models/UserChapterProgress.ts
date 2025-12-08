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
  static upsert(progress: Omit<UserChapterProgress, 'id' | 'createdAt' | 'updatedAt'>): UserChapterProgress {
    // 先检查是否已存在
    const existing = this.findByUserChapter(progress.userId, progress.chapterId);

    const lastPracticedAt = progress.lastPracticedAt ? new Date(progress.lastPracticedAt).toISOString() : null;

    if (existing) {
      // SQL: 更新已存在的章节状态记录
      const updateStmt = db.prepare(`
        UPDATE user_chapter_progress 
        SET status = ?, lastPracticedAt = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ? AND chapterId = ?
      `);
      updateStmt.run(
        progress.status,
        lastPracticedAt,
        progress.userId,
        progress.chapterId
      );
    } else {
      // SQL: 插入新的章节状态记录
      const insertStmt = db.prepare(`
        INSERT INTO user_chapter_progress (userId, chapterId, status, lastPracticedAt)
        VALUES (?, ?, ?, ?)
      `);
      insertStmt.run(
        progress.userId,
        progress.chapterId,
        progress.status,
        lastPracticedAt
      );
    }
    
    // 查询刚插入或更新的记录
    const result = this.findByUserChapter(progress.userId, progress.chapterId);
    
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
  static findByUserChapter(userId: number, chapterId: number): UserChapterProgress | undefined {
    // SQL: 从user_chapter_progress表中查询指定用户和章节的状态记录
    const stmt = db.prepare(
      'SELECT * FROM user_chapter_progress WHERE userId = ? AND chapterId = ?'
    );
    const progress = stmt.get(userId, chapterId) as UserChapterProgress | undefined;
    return progress;
  }

  // 获取用户所有章节的学习状态
  static findAllByUser(userId: number): UserChapterProgress[] {
    // SQL: 从user_chapter_progress表中查询指定用户的所有章节状态记录
    const stmt = db.prepare(
      'SELECT * FROM user_chapter_progress WHERE userId = ?'
    );
    return stmt.all(userId) as UserChapterProgress[];
  }

  // 计算章节的完成状态（根据该章节所有单词的掌握情况）
  // 返回：0-未学习，1-学习中，2-已完成
  static calculateChapterStatus(userId: number, chapterId: number, totalWords: number): number {
    // SQL: 统计用户在指定章节的单词掌握情况
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isMastered = 1 THEN 1 ELSE 0 END) as mastered
      FROM user_word_progress
      WHERE userId = ? AND chapterId = ?
    `);
    const result = stmt.get(userId, chapterId) as { total: number | null; mastered: number | null };
    
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


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
  static upsert(progress: Omit<UserWordProgress, 'id' | 'createdAt' | 'updatedAt'>): UserWordProgress {
    // 先检查是否已存在
    const existing = this.findByUserWordChapter(
      progress.userId,
      progress.wordId,
      progress.chapterId
    );

    const lastPracticedAt = progress.lastPracticedAt ? new Date(progress.lastPracticedAt).toISOString() : null;

    if (existing) {
      // SQL: 更新已存在的进度记录
      const updateStmt = db.prepare(`
        UPDATE user_word_progress 
        SET isMastered = ?, lastPracticedAt = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ? AND wordId = ? AND chapterId = ?
      `);
      updateStmt.run(
        progress.isMastered,
        lastPracticedAt,
        progress.userId,
        progress.wordId,
        progress.chapterId
      );
    } else {
      // SQL: 插入新的进度记录
      const insertStmt = db.prepare(`
        INSERT INTO user_word_progress (userId, wordId, chapterId, isMastered, lastPracticedAt)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertStmt.run(
        progress.userId,
        progress.wordId,
        progress.chapterId,
        progress.isMastered,
        lastPracticedAt
      );
    }
    
    // 查询刚插入或更新的记录
    const result = this.findByUserWordChapter(
      progress.userId,
      progress.wordId,
      progress.chapterId
    );
    
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
  static batchUpsert(progresses: Omit<UserWordProgress, 'id' | 'createdAt' | 'updatedAt'>[]): void {
    // SQL: 批量插入或更新用户单词学习进度（使用事务保证原子性）
    const insertStmt = db.prepare(`
      INSERT INTO user_word_progress (userId, wordId, chapterId, isMastered, lastPracticedAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const updateStmt = db.prepare(`
      UPDATE user_word_progress 
      SET isMastered = ?, lastPracticedAt = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE userId = ? AND wordId = ? AND chapterId = ?
    `);
    
    const checkStmt = db.prepare(`
      SELECT id FROM user_word_progress 
      WHERE userId = ? AND wordId = ? AND chapterId = ?
    `);
    
    const upsertMany = db.transaction((items: typeof progresses) => {
      for (const progress of items) {
        const lastPracticedAt = progress.lastPracticedAt 
          ? new Date(progress.lastPracticedAt).toISOString() 
          : null;
        
        // 检查是否已存在
        const existing = checkStmt.get(progress.userId, progress.wordId, progress.chapterId);
        
        if (existing) {
          // 更新已存在的记录
          updateStmt.run(
            progress.isMastered,
            lastPracticedAt,
            progress.userId,
            progress.wordId,
            progress.chapterId
          );
        } else {
          // 插入新记录
          insertStmt.run(
            progress.userId,
            progress.wordId,
            progress.chapterId,
            progress.isMastered,
            lastPracticedAt
          );
        }
      }
    });
    
    upsertMany(progresses);
  }

  // 根据用户ID、单词ID和章节ID查找进度
  static findByUserWordChapter(
    userId: number,
    wordId: number,
    chapterId: number
  ): UserWordProgress | undefined {
    // SQL: 从user_word_progress表中查询指定用户、单词和章节的进度记录
    const stmt = db.prepare(
      'SELECT * FROM user_word_progress WHERE userId = ? AND wordId = ? AND chapterId = ?'
    );
    const progress = stmt.get(userId, wordId, chapterId) as UserWordProgress | undefined;
    return progress;
  }

  // 获取用户在指定章节的所有单词进度
  static findByUserChapter(userId: number, chapterId: number): UserWordProgress[] {
    // SQL: 从user_word_progress表中查询指定用户和章节的所有进度记录
    const stmt = db.prepare(
      'SELECT * FROM user_word_progress WHERE userId = ? AND chapterId = ?'
    );
    return stmt.all(userId, chapterId) as UserWordProgress[];
  }

  // 获取用户在指定章节的掌握情况统计
  static getChapterStats(userId: number, chapterId: number): {
    total: number;
    mastered: number;
    notMastered: number;
  } {
    // SQL: 统计用户在指定章节的单词掌握情况
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isMastered = 1 THEN 1 ELSE 0 END) as mastered,
        SUM(CASE WHEN isMastered = 0 OR isMastered IS NULL THEN 1 ELSE 0 END) as notMastered
      FROM user_word_progress
      WHERE userId = ? AND chapterId = ?
    `);
    const result = stmt.get(userId, chapterId) as { total: number | null; mastered: number | null; notMastered: number | null };
    return {
      total: result.total ?? 0,
      mastered: result.mastered ?? 0,
      notMastered: result.notMastered ?? 0
    };
  }
}

export default UserWordProgressModel;


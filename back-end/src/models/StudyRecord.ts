import db from '../config/database';

export interface StudyRecord {
  id: number;
  userId: number;
  type: 'word' | 'article' | 'sentence';
  targetId: number;
  isCorrect?: boolean;
  action: string;
  createdAt: string;
}

export class StudyRecordModel {
  // 创建学习记录
  static create(record: Omit<StudyRecord, 'id' | 'createdAt'>): StudyRecord {
    // SQL: 向study_records表插入新学习记录（用户ID、类型、目标ID、是否正确、操作类型）
    const stmt = db.prepare(
      'INSERT INTO study_records (userId, type, targetId, isCorrect, action) VALUES (?, ?, ?, ?, ?)'
    );
    // SQLite将布尔值存储为整数（0或1），需要将布尔值转换为整数
    const isCorrectVal = record.isCorrect === undefined ? null : (record.isCorrect ? 1 : 0);
    
    const info = stmt.run(
      record.userId,
      record.type,
      record.targetId,
      isCorrectVal,
      record.action
    );
    
    return { 
        ...record, 
        id: info.lastInsertRowid as number,
        createdAt: new Date().toISOString(), // 创建时间（近似值，理想情况下应从数据库获取）
        isCorrect: record.isCorrect
    };
  }

  // 统计用户练习的单词总数
  static countWordsPracticed(userId: number): number {
    // SQL: 统计指定用户的单词练习记录数量（类型为'word'且操作为'practice'）
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM study_records WHERE userId = ? AND type = 'word' AND action = 'practice'"
    );
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  // 统计用户阅读的文章数量（去重）
  static countArticlesRead(userId: number): number {
    // SQL: 统计指定用户阅读的不同文章数量（类型为'article'且操作为'read'，使用DISTINCT去重）
    const stmt = db.prepare(
      "SELECT COUNT(DISTINCT targetId) as count FROM study_records WHERE userId = ? AND type = 'article' AND action = 'read'"
    );
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  // 统计用户答对的单词数量
  static countCorrectWords(userId: number): number {
    // SQL: 统计指定用户答对的单词记录数量（类型为'word'且isCorrect为1）
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM study_records WHERE userId = ? AND type = 'word' AND isCorrect = 1"
    );
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  // 统计用户单词练习的总次数
  static countTotalWordPractices(userId: number): number {
    // SQL: 统计指定用户的单词练习总次数（类型为'word'且操作为'practice'）
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM study_records WHERE userId = ? AND type = 'word' AND action = 'practice'"
    );
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }
}

export default StudyRecordModel;

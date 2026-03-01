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
  static async create(record: Omit<StudyRecord, 'id' | 'createdAt'>): Promise<StudyRecord> {
    // MySQL 使用 TINYINT 存布尔值
    const isCorrectVal = record.isCorrect === undefined ? null : (record.isCorrect ? 1 : 0);

    const [result] = await db.execute(
      'INSERT INTO study_records (userId, type, targetId, isCorrect, action) VALUES (?, ?, ?, ?, ?)',
      [
      record.userId,
      record.type,
      record.targetId,
      isCorrectVal,
      record.action
      ]
    );

    return { 
        ...record, 
        id: (result as any).insertId as number,
        createdAt: new Date().toISOString(),
        isCorrect: record.isCorrect
    };
  }

  // 统计用户练习的单词总数
  static async countWordsPracticed(userId: number): Promise<number> {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM study_records WHERE userId = ? AND type = 'word' AND action = 'practice'",
      [userId]
    );
    return (rows as Array<{ count: number }>)[0]?.count || 0;
  }

  // 统计用户阅读的文章数量（去重）
  static async countArticlesRead(userId: number): Promise<number> {
    const [rows] = await db.query(
      "SELECT COUNT(DISTINCT targetId) as count FROM study_records WHERE userId = ? AND type = 'article' AND action = 'read'",
      [userId]
    );
    return (rows as Array<{ count: number }>)[0]?.count || 0;
  }

  // 统计用户答对的单词数量
  static async countCorrectWords(userId: number): Promise<number> {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM study_records WHERE userId = ? AND type = 'word' AND isCorrect = 1",
      [userId]
    );
    return (rows as Array<{ count: number }>)[0]?.count || 0;
  }

  // 统计用户单词练习的总次数
  static async countTotalWordPractices(userId: number): Promise<number> {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM study_records WHERE userId = ? AND type = 'word' AND action = 'practice'",
      [userId]
    );
    return (rows as Array<{ count: number }>)[0]?.count || 0;
  }
}

export default StudyRecordModel;

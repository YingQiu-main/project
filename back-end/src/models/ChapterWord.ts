import db from '../config/database';

export interface ChapterWord {
  id: number;
  chapterId: number;
  wordId: number;
  order_index: number;
}

export class ChapterWordModel {
  // 向章节添加单词(暂不考虑)
  static async create(chapterWord: Omit<ChapterWord, 'id'>): Promise<ChapterWord> {
    const [result] = await db.execute(
      'INSERT INTO chapter_words (chapterId, wordId, order_index) VALUES (?, ?, ?)',
      [chapterWord.chapterId, chapterWord.wordId, chapterWord.order_index]
    );
    return { ...chapterWord, id: (result as any).insertId as number };
  }

  // 获取指定章节的所有单词ID（按顺序）
  static async findWordIdsByChapterId(chapterId: number): Promise<number[]> {
    const [rows] = await db.query(
      'SELECT wordId FROM chapter_words WHERE chapterId = ? ORDER BY order_index ASC',
      [chapterId]
    );
    const results = rows as { wordId: number }[];
    return results.map(r => r.wordId);
  }

  // 批量插入章节单词关联
  static async batchCreate(chapterWords: Omit<ChapterWord, 'id'>[]): Promise<void> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const word of chapterWords) {
        await conn.execute(
          'INSERT INTO chapter_words (chapterId, wordId, order_index) VALUES (?, ?, ?)',
          [word.chapterId, word.wordId, word.order_index]
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
}

export default ChapterWordModel;


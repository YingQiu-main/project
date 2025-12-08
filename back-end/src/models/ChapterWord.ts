import db from '../config/database';

export interface ChapterWord {
  id: number;
  chapterId: number;
  wordId: number;
  order_index: number;
}

export class ChapterWordModel {
  // 向章节添加单词(暂不考虑)
  static create(chapterWord: Omit<ChapterWord, 'id'>): ChapterWord {
    // SQL: 向chapter_words表插入新关联记录（章节ID、单词ID、顺序）
    const stmt = db.prepare(
      'INSERT INTO chapter_words (chapterId, wordId, order_index) VALUES (?, ?, ?)'
    );
    const info = stmt.run(chapterWord.chapterId, chapterWord.wordId, chapterWord.order_index);
    return { ...chapterWord, id: info.lastInsertRowid as number };
  }

  // 获取指定章节的所有单词ID（按顺序）
  static findWordIdsByChapterId(chapterId: number): number[] {
    // SQL: 从chapter_words表中查询指定章节的所有单词ID，按顺序排序
    const stmt = db.prepare(
      'SELECT wordId FROM chapter_words WHERE chapterId = ? ORDER BY order_index ASC'
    );
    const results = stmt.all(chapterId) as { wordId: number }[];
    return results.map(r => r.wordId);
  }

  // 批量插入章节单词关联
  static batchCreate(chapterWords: Omit<ChapterWord, 'id'>[]): void {
    // SQL: 批量插入章节单词关联记录
    const stmt = db.prepare(
      'INSERT INTO chapter_words (chapterId, wordId, order_index) VALUES (?, ?, ?)'
    );
    const insertMany = db.transaction((words: Omit<ChapterWord, 'id'>[]) => {
      for (const word of words) {
        stmt.run(word.chapterId, word.wordId, word.order_index);
      }
    });
    insertMany(chapterWords);
  }
}

export default ChapterWordModel;


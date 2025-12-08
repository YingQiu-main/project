import db from '../config/database';

export interface Chapter {
  id: number;
  name: string;
  order_index: number;
  word_count: number;
  createdAt: string;
}

export class ChapterModel {
  // 创建新章节(暂不考虑)
  static create(chapter: Omit<Chapter, 'id' | 'createdAt'>): Chapter {
    // SQL: 向chapters表插入新章节记录（章节名称、顺序、单词数量）
    const stmt = db.prepare(
      'INSERT INTO chapters (name, order_index, word_count) VALUES (?, ?, ?)'
    );
    const info = stmt.run(chapter.name, chapter.order_index, chapter.word_count);
    return { 
      ...chapter, 
      id: info.lastInsertRowid as number,
      createdAt: new Date().toISOString()
    };
  }

  // 获取所有章节（按顺序排序）
  static findAll(): Chapter[] {
    // SQL: 从chapters表中查询所有章节，按顺序排序
    const stmt = db.prepare('SELECT * FROM chapters ORDER BY order_index ASC');
    return stmt.all() as Chapter[];
  }

  // 根据章节ID查找章节(暂不考虑)
  static findById(id: number): Chapter | undefined {
    // SQL: 从chapters表中查询指定ID的章节信息
    const stmt = db.prepare('SELECT * FROM chapters WHERE id = ?');
    const chapter = stmt.get(id) as Chapter | undefined;
    return chapter;
  }

  // 获取章节总数
  static count(): number {
    // SQL: 统计chapters表中的记录总数
    const stmt = db.prepare('SELECT COUNT(*) as count FROM chapters');
    const result = stmt.get() as { count: number };
    return result.count;
  }
}

export default ChapterModel;


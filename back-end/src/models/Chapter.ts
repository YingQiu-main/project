import db from '../config/database';

export interface Chapter {
  id: number;
  name: string;
  order_index: number;
  word_count: number;
  level: 'cet4' | 'cet6';
  createdAt: string;
}

export class ChapterModel {
  // 创建新章节(暂不考虑)
  static async create(chapter: Omit<Chapter, 'id' | 'createdAt'>): Promise<Chapter> {
    const [result] = await db.execute(
      'INSERT INTO chapters (name, order_index, word_count, level) VALUES (?, ?, ?, ?)',
      [chapter.name, chapter.order_index, chapter.word_count, chapter.level]
    );
    return { 
      ...chapter, 
      id: (result as any).insertId as number,
      createdAt: new Date().toISOString()
    };
  }

  // 获取所有章节（按顺序排序）
  static async findAll(): Promise<Chapter[]> {
    const [rows] = await db.query('SELECT * FROM chapters ORDER BY order_index ASC');
    return rows as Chapter[];
  }

  // 根据章节ID查找章节(暂不考虑)
  static async findById(id: number): Promise<Chapter | undefined> {
    const [rows] = await db.query('SELECT * FROM chapters WHERE id = ? LIMIT 1', [id]);
    const chapters = rows as Chapter[];
    return chapters[0];
  }

  // 获取章节总数
  static async count(): Promise<number> {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM chapters');
    return (rows as Array<{ count: number }>)[0]?.count || 0;
  }

  // 根据级别获取所有章节（按顺序排序）
  static async findByLevel(level: 'cet4' | 'cet6'): Promise<Chapter[]> {
    const [rows] = await db.query(
      'SELECT * FROM chapters WHERE level = ? ORDER BY order_index ASC',
      [level]
    );
    return rows as Chapter[];
  }
}

export default ChapterModel;


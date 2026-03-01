import db from '../config/database';

export interface Word {
  id: number;
  text: string;
  phonetic: string | null;
  translation: string;
  level: 'cet4' | 'cet6';
}
// 把所有和 words 表相关的操作封装在一个类里，形成 模型层（Model），类里包含了对数据库的增删改查
export class WordModel {
  // 创建新单词，ts工具类型，Omit<Word, 'id'>用于排除ts的某个字段属性
  static async create(word: Omit<Word, 'id'>): Promise<Word> {
    // MySQL 插入后通过 insertId 拿到主键
    const [result] = await db.execute(
      'INSERT INTO words (text, phonetic, translation, level) VALUES (?, ?, ?, ?)',
      [word.text, word.phonetic, word.translation, word.level]
    );
    return { ...word, id: (result as any).insertId as number };
  }

  // 根据单词ID查找单词
  static async findById(id: number): Promise<Word | undefined> {
    const [rows] = await db.query('SELECT * FROM words WHERE id = ? LIMIT 1', [id]);
    const words = rows as Word[];
    return words[0];
  }

  // 随机获取一个单词
  static async findRandom(): Promise<Word | undefined> {
    // MySQL 随机函数是 RAND()
    const [rows] = await db.query('SELECT * FROM words ORDER BY RAND() LIMIT 1');
    const words = rows as Word[];
    return words[0];
  }

  // 获取所有单词
  static async findAll(): Promise<Word[]> {
    const [rows] = await db.query('SELECT * FROM words');
    return rows as Word[];
  }

  // 根据级别获取单词
  static async findByLevel(level: 'cet4' | 'cet6'): Promise<Word[]> {
    const [rows] = await db.query('SELECT * FROM words WHERE level = ?', [level]);
    return rows as Word[];
  }

  // 更新单词信息(暂不使用)
  static async update(id: number, word: Partial<Omit<Word, 'id'>>): Promise<void> {
    const keys = Object.keys(word);
    if (keys.length === 0) return;

    // 动态构建UPDATE语句的SET子句
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const values = keys.map((key) => (word as any)[key]);
    
    // SQL: 更新words表中指定ID的单词记录
    await db.execute(`UPDATE words SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  // 统计单词总数
  static async count(): Promise<number> {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM words');
    const result = (rows as Array<{ count: number }>)[0];
    return result?.count || 0;
  }
}

export default WordModel;

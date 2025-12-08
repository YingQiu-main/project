import db from '../config/database';

export interface Word {
  id: number;
  text: string;
  phonetic: string | null;
  translation: string;
}
// 把所有和 words 表相关的操作封装在一个类里，形成 模型层（Model），类里包含了对数据库的增删改查
export class WordModel {
  // 创建新单词，ts工具类型，Omit<Word, 'id'>用于排除ts的某个字段属性
  static create(word: Omit<Word, 'id'>): Word {
    // db.prepare(sql)返回一个可执行的语句对象（Statement 对象） 
    const stmt = db.prepare('INSERT INTO words (text, phonetic, translation) VALUES (?, ?, ?)');
    // 执行sql语句，返回info，lastInsertRowid插入记录的id，change是影响的行数
    const info = stmt.run(word.text, word.phonetic, word.translation);
    // 返回完整的插入对象
    return { ...word, id: info.lastInsertRowid as number };
  }

  // 根据单词ID查找单词
  static findById(id: number): Word | undefined {
    // SQL: 从words表中查询指定ID的单词信息
    const stmt = db.prepare('SELECT * FROM words WHERE id = ?');
    const word = stmt.get(id) as Word | undefined;
    return word;
  }

  // 根据单词文本查找单词(暂不使用)
  static findByText(text: string): Word | undefined {
    // SQL: 从words表中查询指定文本的单词信息
    const stmt = db.prepare('SELECT * FROM words WHERE text = ?');
    const word = stmt.get(text) as Word | undefined;
    return word;
  }

  // 随机获取一个单词
  static findRandom(): Word | undefined {
    // SQL: 从words表中随机选择一条单词记录（使用RANDOM()函数随机排序，限制返回1条）
    const stmt = db.prepare('SELECT * FROM words ORDER BY RANDOM() LIMIT 1');
    const word = stmt.get() as Word | undefined;
    return word;
  }

  // 获取所有单词
  static findAll(): Word[] {
    // SQL: 从words表中查询所有单词记录
    const stmt = db.prepare('SELECT * FROM words');
    return stmt.all() as Word[];
  }

  // 更新单词信息(暂不使用)
  static update(id: number, word: Partial<Omit<Word, 'id'>>): void {
    const keys = Object.keys(word);
    if (keys.length === 0) return;

    // 动态构建UPDATE语句的SET子句
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const values = keys.map((key) => (word as any)[key]);
    
    // SQL: 更新words表中指定ID的单词记录
    const stmt = db.prepare(`UPDATE words SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
  }

  // 统计单词总数
  static count(): number {
    // SQL: 统计words表中的记录总数
    const stmt = db.prepare('SELECT COUNT(*) as count FROM words');
    const result = stmt.get() as { count: number };
    return result.count;
  }
}

export default WordModel;

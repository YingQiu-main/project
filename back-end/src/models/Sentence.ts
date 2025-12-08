import db from '../config/database';

export interface Sentence {
  id: number;
  content: string;
  translation: string;
  analysis: string | null;
}

export class SentenceModel {
  // 创建新长难句
  static create(sentence: Omit<Sentence, 'id'>): Sentence {
    // SQL: 向sentences表插入新长难句记录（句子内容、翻译、解析）
    const stmt = db.prepare(
      'INSERT INTO sentences (content, translation, analysis) VALUES (?, ?, ?)'
    );
    const info = stmt.run(sentence.content, sentence.translation, sentence.analysis);
    return { ...sentence, id: info.lastInsertRowid as number };
  }

  // 根据句子ID查找长难句
  static findById(id: number): Sentence | undefined {
    // SQL: 从sentences表中查询指定ID的长难句信息
    const stmt = db.prepare('SELECT * FROM sentences WHERE id = ?');
    const sentence = stmt.get(id) as Sentence | undefined;
    return sentence;
  }

  // 获取所有长难句
  static findAll(): Sentence[] {
    // SQL: 从sentences表中查询所有长难句记录
    const stmt = db.prepare('SELECT * FROM sentences');
    return stmt.all() as Sentence[];
  }
}

export default SentenceModel;

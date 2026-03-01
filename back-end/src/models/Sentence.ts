import db from '../config/database';

export interface Sentence {
  id: number;
  content: string;
  translation: string;
  analysis: string | null;
}

export class SentenceModel {
  // 创建新长难句
  static async create(sentence: Omit<Sentence, 'id'>): Promise<Sentence> {
    const [result] = await db.execute(
      'INSERT INTO sentences (content, translation, analysis) VALUES (?, ?, ?)',
      [sentence.content, sentence.translation, sentence.analysis]
    );
    return { ...sentence, id: (result as any).insertId as number };
  }

  // 根据句子ID查找长难句
  static async findById(id: number): Promise<Sentence | undefined> {
    const [rows] = await db.query('SELECT * FROM sentences WHERE id = ? LIMIT 1', [id]);
    const sentences = rows as Sentence[];
    return sentences[0];
  }

  // 获取所有长难句
  static async findAll(): Promise<Sentence[]> {
    const [rows] = await db.query('SELECT * FROM sentences');
    return rows as Sentence[];
  }
}

export default SentenceModel;

import db from '../config/database';

export interface VocabularyItem {
  word: string;
  'part of speech': string;
  meaning: string;
}

export interface Article {
  id: number;
  level: number;
  title: string;
  content: string;
  translation: string;
  vocabulary: VocabularyItem[];
  reading_time: number;
  created_at?: string;
}

export interface ArticleSummary {
  id: number;
  title: string;
  reading_time: number;
}

export class ArticleModel {
  // 创建新文章
  static async create(article: Omit<Article, 'id' | 'created_at'>): Promise<Article> {
    // SQL: 向 articles 表插入新文章记录
    const vocabularyJson = JSON.stringify(article.vocabulary || []);
    const [result] = await db.execute(
      'INSERT INTO articles (level, title, content, translation, vocabulary, reading_time) VALUES (?, ?, ?, ?, ?, ?)',
      [
      article.level,
      article.title,
      article.content,
      article.translation,
      vocabularyJson,
      article.reading_time
      ]
    );
    return { ...article, id: (result as any).insertId as number };
  }

  // 根据文章ID查找文章
  static async findById(id: number): Promise<Article | undefined> {
    const [rows] = await db.query('SELECT * FROM articles WHERE id = ? LIMIT 1', [id]);
    const row = (rows as any[])[0];
    if (!row) return undefined;
    
    // 解析 vocabulary JSON 字符串
    let vocabulary: VocabularyItem[] = [];
    if (row.vocabulary) {
      try {
        vocabulary = typeof row.vocabulary === 'string' 
          ? JSON.parse(row.vocabulary) 
          : row.vocabulary;
      } catch (e) {
        console.error('解析 vocabulary JSON 失败:', e);
        vocabulary = [];
      }
    }
    
    return {
      id: row.id,
      level: row.level,
      title: row.title,
      content: row.content,
      translation: row.translation,
      vocabulary,
      reading_time: row.reading_time,
      created_at: row.created_at
    };
  }

  // 获取所有文章
  static async findAll(): Promise<Article[]> {
    const [rowsData] = await db.query('SELECT * FROM articles ORDER BY id');
    const rows = rowsData as any[];
    
    return rows.map(row => {
      // 解析 vocabulary JSON 字符串
      let vocabulary: VocabularyItem[] = [];
      if (row.vocabulary) {
        try {
          vocabulary = typeof row.vocabulary === 'string' 
            ? JSON.parse(row.vocabulary) 
            : row.vocabulary;
        } catch (e) {
          console.error('解析 vocabulary JSON 失败:', e);
          vocabulary = [];
        }
      }
      
      return {
        id: row.id,
        level: row.level,
        title: row.title,
        content: row.content,
        translation: row.translation,
        vocabulary,
        reading_time: row.reading_time,
        created_at: row.created_at
      };
    });
  }

  // 获取所有文章的摘要信息（仅ID、标题、阅读时长）
  static async findAllSummaries(): Promise<ArticleSummary[]> {
    const [rows] = await db.query('SELECT id, title, reading_time FROM articles ORDER BY id');
    return rows as ArticleSummary[];
  }
}

export default ArticleModel;

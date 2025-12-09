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
  static create(article: Omit<Article, 'id' | 'created_at'>): Article {
    // SQL: 向articles表插入新文章记录
    const vocabularyJson = JSON.stringify(article.vocabulary || []);
    const stmt = db.prepare(
      'INSERT INTO articles (level, title, content, translation, vocabulary, reading_time) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(
      article.level,
      article.title,
      article.content,
      article.translation,
      vocabularyJson,
      article.reading_time
    );
    return { ...article, id: info.lastInsertRowid as number };
  }

  // 根据文章ID查找文章
  static findById(id: number): Article | undefined {
    // SQL: 从articles表中查询指定ID的文章完整信息
    const stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
    const row = stmt.get(id) as any;
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
  static findAll(): Article[] {
    // SQL: 从articles表中查询所有文章的完整信息
    const stmt = db.prepare('SELECT * FROM articles ORDER BY id');
    const rows = stmt.all() as any[];
    
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
  static findAllSummaries(): ArticleSummary[] {
    // SQL: 从articles表中查询文章的摘要信息（只返回id、title、reading_time字段）
    const stmt = db.prepare('SELECT id, title, reading_time FROM articles ORDER BY id');
    return stmt.all() as ArticleSummary[];
  }
}

export default ArticleModel;

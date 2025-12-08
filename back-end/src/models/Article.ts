import db from '../config/database';

export interface Article {
  id: number;
  title: string;
  content: string;
  translation: string | null;
  difficulty: number;
}

export class ArticleModel {
  // 创建新文章
  static create(article: Omit<Article, 'id'>): Article {
    // SQL: 向articles表插入新文章记录（标题、内容、翻译、难度）
    const stmt = db.prepare(
      'INSERT INTO articles (title, content, translation, difficulty) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(
      article.title,
      article.content,
      article.translation,
      article.difficulty
    );
    return { ...article, id: info.lastInsertRowid as number };
  }

  // 根据文章ID查找文章
  static findById(id: number): Article | undefined {
    // SQL: 从articles表中查询指定ID的文章完整信息
    const stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
    const article = stmt.get(id) as Article | undefined;
    return article;
  }

  // 获取所有文章
  static findAll(): Article[] {
    // SQL: 从articles表中查询所有文章的完整信息
    const stmt = db.prepare('SELECT * FROM articles');
    return stmt.all() as Article[];
  }

  // 获取所有文章的摘要信息（仅ID、标题、难度，不包含内容）
  static findAllSummaries(): Pick<Article, 'id' | 'title' | 'difficulty'>[] {
    // SQL: 从articles表中查询文章的摘要信息（只返回id、title、difficulty字段，不返回content和translation）
    const stmt = db.prepare('SELECT id, title, difficulty FROM articles');
    return stmt.all() as Pick<Article, 'id' | 'title' | 'difficulty'>[];
  }
}

export default ArticleModel;

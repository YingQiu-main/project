import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 先尝试读取 .env，再补充读取 env.local（便于本地开发）
dotenv.config();
dotenv.config({ path: 'env.local' });

// 创建 MySQL 连接池
const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'english_learning',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// 初始化数据库
export const initDatabase = async () => {
  // 向mysql发送一条语句，先确认连接可用
  await db.query('SELECT 1');
// db.execute是预编译sql
  // 用户表
  // ENGINE=InnoDB：使用nnoDB 引擎存储
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 文章表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      level INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      translation TEXT NOT NULL,
      vocabulary JSON NULL,
      reading_time INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 长难句表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sentences (
      id INT PRIMARY KEY AUTO_INCREMENT,
      content TEXT NOT NULL,
      translation TEXT NOT NULL,
      analysis TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 单词表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS words (
      id INT PRIMARY KEY AUTO_INCREMENT,
      text VARCHAR(120) NOT NULL UNIQUE,
      phonetic VARCHAR(120) NULL,
      translation TEXT NOT NULL,
      level ENUM('cet4','cet6') NOT NULL DEFAULT 'cet4'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 收藏表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userId INT NOT NULL,
      type ENUM('word','article','sentence') NOT NULL,
      targetId INT NOT NULL,
      INDEX idx_favorites_user (userId),
      UNIQUE KEY uq_favorites_user_target (userId, type, targetId),
      CONSTRAINT fk_favorites_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 学习记录表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS study_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userId INT NOT NULL,
      type ENUM('word','article','sentence') NOT NULL,
      targetId INT NOT NULL,
      isCorrect TINYINT(1) NULL,
      action VARCHAR(50) DEFAULT 'practice',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_study_user (userId),
      CONSTRAINT fk_study_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 章节表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      order_index INT NOT NULL,
      word_count INT NOT NULL DEFAULT 0,
      level ENUM('cet4','cet6') NOT NULL DEFAULT 'cet4',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 章节-单词关系表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chapter_words (
      id INT PRIMARY KEY AUTO_INCREMENT,
      chapterId INT NOT NULL,
      wordId INT NOT NULL,
      order_index INT NOT NULL,
      UNIQUE KEY uq_chapter_word (chapterId, wordId),
      INDEX idx_chapter_words_chapter (chapterId),
      INDEX idx_chapter_words_word (wordId),
      CONSTRAINT fk_chapter_words_chapter FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE,
      CONSTRAINT fk_chapter_words_word FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 用户单词进度表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_word_progress (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userId INT NOT NULL,
      wordId INT NOT NULL,
      chapterId INT NOT NULL,
      isMastered TINYINT NOT NULL DEFAULT 0,
      lastPracticedAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_word_chapter (userId, wordId, chapterId),
      INDEX idx_uwp_user_chapter (userId, chapterId),
      CONSTRAINT fk_uwp_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_uwp_word FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,
      CONSTRAINT fk_uwp_chapter FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 用户章节进度表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_chapter_progress (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userId INT NOT NULL,
      chapterId INT NOT NULL,
      status TINYINT NOT NULL DEFAULT 0,
      lastPracticedAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_chapter (userId, chapterId),
      INDEX idx_ucp_user (userId),
      CONSTRAINT fk_ucp_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_ucp_chapter FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('MySQL 数据库初始化完成');
};

export default db;

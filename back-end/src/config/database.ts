import Database from 'better-sqlite3';
import path from 'path';

// 初始化数据库连接
const dbPath = path.join(__dirname, '../../database.sqlite');//当前文件所在的路径为基础创建database.sqlite文件
const db = new Database(dbPath, { verbose: console.log });//数据库文件,拿到这个文件对象，用db去执行sql，并且每一条sql的执行都会打印

// 开启外键约束，让写的外键真的起作用，pragma相当于数据库的配置项
db.pragma('foreign_keys = ON');

// 检查表是否已存在的辅助函数
const tableExists = (tableName: string): boolean => {
  try {
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    return !!result;
  } catch (error) {
    return false;
  }
};

export const initDatabase = () => {
  // 检查所有必要的表是否都已存在
  const requiredTables = ['users', 'words', 'articles', 'sentences', 'favorites', 'study_records', 'chapters', 'chapter_words', 'user_word_progress', 'user_chapter_progress'];
  const allTablesExist = requiredTables.every(table => tableExists(table));
  
  if (allTablesExist) {
    console.log('数据库表已存在，跳过初始化');
    return;
  }

  // 如果表不存在，创建所有表（使用 CREATE TABLE IF NOT EXISTS 确保安全）
  const schema = `
    -- 创建用户表：存储用户账号信息
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 用户ID，主键，自增
      username TEXT NOT NULL UNIQUE,          -- 用户名，不能为空且唯一
      password TEXT NOT NULL                  -- 密码（已加密），不能为空
    );

    -- 创建文章表：存储英语学习文章
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 文章ID，主键，自增
      title TEXT NOT NULL,                    -- 文章标题，不能为空
      content TEXT NOT NULL,                  -- 文章内容，不能为空
      translation TEXT,                       -- 中文翻译（可选）
      difficulty INTEGER DEFAULT 1            -- 难度等级，默认为1
    );

    -- 创建长难句表：存储英语长难句及其解析
    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 句子ID，主键，自增
      content TEXT NOT NULL,                  -- 英文句子内容，不能为空
      translation TEXT NOT NULL,              -- 中文翻译，不能为空
      analysis TEXT                           -- 句子解析/语法分析（可选）
    );

    -- 创建单词表：存储英语单词及其释义
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 单词ID，主键，自增
      text TEXT NOT NULL UNIQUE,              -- 单词文本，不能为空且唯一
      phonetic TEXT,                          -- 音标（可选）
      translation TEXT NOT NULL               -- 中文翻译，不能为空
    );

    -- 创建收藏表：存储用户的收藏记录（单词、文章、句子）
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 收藏ID，主键，自增
      userId INTEGER NOT NULL,                -- 用户ID，外键关联users表
      type TEXT NOT NULL CHECK(type IN ('word', 'article', 'sentence')),  -- 收藏类型：单词/文章/句子
      targetId INTEGER NOT NULL,              -- 收藏目标的ID（对应单词/文章/句子的ID）
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE  -- 外键约束：删除用户时级联删除其收藏
    );

    -- 创建学习记录表：存储用户的学习进度和练习记录
    CREATE TABLE IF NOT EXISTS study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 记录ID，主键，自增
      userId INTEGER NOT NULL,                -- 用户ID，外键关联users表
      type TEXT NOT NULL CHECK(type IN ('word', 'article', 'sentence')),  -- 记录类型：单词/文章/句子
      targetId INTEGER NOT NULL,              -- 学习目标的ID（对应单词/文章/句子的ID）
      isCorrect BOOLEAN,                      -- 是否正确（仅针对单词练习）
      action TEXT DEFAULT 'practice',         -- 具体操作：练习/阅读/查看，默认为'practice'
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间，默认为当前时间
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE  -- 外键约束：删除用户时级联删除其学习记录
    );

    -- 创建章节表：存储单词章节信息
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 章节ID，主键，自增
      name TEXT NOT NULL,                     -- 章节名称，如"第1章"
      order_index INTEGER NOT NULL,           -- 章节顺序，用于排序
      word_count INTEGER NOT NULL DEFAULT 0,   -- 该章节包含的单词数量
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP  -- 创建时间，默认为当前时间
    );

    -- 创建章节单词关联表：存储每个章节包含的单词
    CREATE TABLE IF NOT EXISTS chapter_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 关联ID，主键，自增
      chapterId INTEGER NOT NULL,              -- 章节ID，外键关联chapters表
      wordId INTEGER NOT NULL,                -- 单词ID，外键关联words表
      order_index INTEGER NOT NULL,           -- 单词在章节中的顺序
      FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE,  -- 外键约束：删除章节时级联删除关联
      FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,     -- 外键约束：删除单词时级联删除关联
      UNIQUE(chapterId, wordId)               -- 唯一约束：同一章节中不能有重复的单词
    );

    -- 创建用户单词学习进度表：记录用户对每个单词的学习状态
    CREATE TABLE IF NOT EXISTS user_word_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 进度ID，主键，自增
      userId INTEGER NOT NULL,                -- 用户ID，外键关联users表
      wordId INTEGER NOT NULL,                -- 单词ID，外键关联words表
      chapterId INTEGER NOT NULL,             -- 章节ID，外键关联chapters表
      isMastered INTEGER DEFAULT 0,           -- 掌握程度：0-未掌握，1-已掌握（后续可扩展为其他数字）
      lastPracticedAt DATETIME,              -- 最后练习时间
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间，默认为当前时间
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新时间，默认为当前时间
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,        -- 外键约束：删除用户时级联删除其进度
      FOREIGN KEY (wordId) REFERENCES words(id) ON DELETE CASCADE,      -- 外键约束：删除单词时级联删除进度
      FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE, -- 外键约束：删除章节时级联删除进度
      UNIQUE(userId, wordId, chapterId)       -- 唯一约束：同一用户在同一章节对同一单词只能有一条进度记录
    );

    -- 创建用户章节学习状态表：记录用户对每个章节的学习完成状态
    CREATE TABLE IF NOT EXISTS user_chapter_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 状态ID，主键，自增
      userId INTEGER NOT NULL,                -- 用户ID，外键关联users表
      chapterId INTEGER NOT NULL,             -- 章节ID，外键关联chapters表
      status INTEGER DEFAULT 0,               -- 章节学习状态：0-未学习，1-学习中，2-已完成
      lastPracticedAt DATETIME,              -- 最后练习时间
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间，默认为当前时间
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新时间，默认为当前时间
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,        -- 外键约束：删除用户时级联删除其状态
      FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE, -- 外键约束：删除章节时级联删除状态
      UNIQUE(userId, chapterId)               -- 唯一约束：同一用户对同一章节只能有一条状态记录
    );
  `;

  // 执行SQL语句创建所有表
  db.exec(schema);
  console.log('数据库初始化成功');
};

export default db;

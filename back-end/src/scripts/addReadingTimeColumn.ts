import db from '../config/database';

/**
 * 为 articles 表添加 reading_time 字段
 */
function addReadingTimeColumn() {
  try {
    console.log('检查 articles 表结构...');
    
    // 检查 reading_time 字段是否已存在
    const tableInfo = db.prepare('PRAGMA table_info(articles)').all() as any[];
    const hasReadingTime = tableInfo.some((col: any) => col.name === 'reading_time');
    
    if (hasReadingTime) {
      console.log('reading_time 字段已存在，无需添加');
      return;
    }
    
    console.log('添加 reading_time 字段...');
    
    // 添加 reading_time 字段
    db.prepare(`
      ALTER TABLE articles
      ADD COLUMN reading_time INTEGER NOT NULL DEFAULT 5
    `).run();
    
    console.log('✅ reading_time 字段添加成功！');
    
    // 验证字段是否添加成功
    const newTableInfo = db.prepare('PRAGMA table_info(articles)').all() as any[];
    const readingTimeColumn = newTableInfo.find((col: any) => col.name === 'reading_time');
    
    if (readingTimeColumn) {
      console.log('✅ 验证成功：reading_time 字段已添加到 articles 表');
      console.log('字段信息:', JSON.stringify(readingTimeColumn, null, 2));
    } else {
      console.error('❌ 验证失败：reading_time 字段未找到');
    }
    
  } catch (error: any) {
    console.error('❌ 添加 reading_time 字段失败:', error.message);
    throw error;
  }
}

// 执行迁移
addReadingTimeColumn();


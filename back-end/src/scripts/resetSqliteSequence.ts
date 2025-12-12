import db from '../config/database';

/**
 * 重置 sqlite_sequence 表
 * 删除所有表的自增ID序列，确保下次插入数据时ID从1开始
 * 注意：此脚本只重置序列，不删除表数据，请手动删除表数据
 */
async function resetSqliteSequence() {
  try {
    console.log('开始重置 sqlite_sequence 表...');
    
    // 获取所有有自增ID的表
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND sql LIKE '%AUTOINCREMENT%'
    `).all() as Array<{ name: string }>;
    
    console.log(`找到 ${tables.length} 个有自增ID的表`);
    
    // 删除所有表的序列记录
    for (const table of tables) {
      try {
        db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table.name);
        console.log(`已重置表 ${table.name} 的序列`);
      } catch (error) {
        // 如果表没有序列记录，忽略错误
        console.log(`表 ${table.name} 没有序列记录，跳过`);
      }
    }
    
    console.log('\n重置完成！下次插入数据时，ID将从1开始');
    console.log('注意：请确保已手动删除表数据，否则新插入的数据ID可能不连续');
    
    process.exit(0);
  } catch (error) {
    console.error('重置序列过程中出错:', error);
    process.exit(1);
  }
}

// 执行重置
resetSqliteSequence();


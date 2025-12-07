import { Sequelize } from 'sequelize';
import path from 'path';
import Database from 'better-sqlite3';

// 使用 Sequelize 连接 SQLite 数据库
// Sequelize 是一个 ORM (对象关系映射) 库，可以让我们用 JavaScript 对象的方式操作数据库
const sequelize = new Sequelize({
  dialect: 'sqlite',
  // 数据库文件存储位置
  storage: path.join(__dirname, '../../database.sqlite'),
  // 使用 better-sqlite3 替代 sqlite3
  // 注意：dialectModule 需要传入模块本身，而不是实例
  dialectModule: Database,
  // 禁用日志输出，避免控制台太乱（开发时可以开启）
  logging: false,
});

export default sequelize;


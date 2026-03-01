import app from './app';
import { initDatabase } from './config/database';

// 1. 环境配置加载
// 设置服务器监听端口，默认为 3000
const PORT = process.env.PORT || 3000;
// 2. 服务器启动流程
const startServer = async () => {
  try {
    console.log('正在启动服务器...');

     // 第一步：初始化数据库
     // 连接 MySQL，并自动创建需要的表
     await initDatabase();
    
    // 第二步：启动 HTTP 服务器
    // app.listen 开启端口监听，开始接收 HTTP 请求
    app.listen(PORT, () => {
      console.log(`
      ################################################
      🛡️  服务器正在监听端口: ${PORT} 🛡️
      http://localhost:${PORT}
      ################################################
      `);
    });

  } catch (error) {
    // 如果启动过程中发生错误 (如数据库连接失败)，打印错误并退出进程
    console.error('服务器启动失败:', error);
    process.exit(1); // 非 0 状态码表示异常退出
  }
};

// 执行启动函数
startServer();

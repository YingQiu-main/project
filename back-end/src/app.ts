import express from 'express';
import cors from 'cors';
import routes from './routes'; // 导入路由总入口，它聚合了所有的 API 路由

// 创建 Express 应用实例
// 这是一个 Web 服务器应用程序对象，通过它可以配置服务器行为
const app = express();

// ==================================================================
// 1. 全局中间件配置 (Middleware)
// 中间件是在请求到达具体路由处理函数之前执行的函数
// ==================================================================

// 配置 CORS (Cross-Origin Resource Sharing)
// 允许前端 (例如 http://localhost:5173) 访问后端 API
// 如果不配置这个，浏览器会拦截跨域请求
app.use(cors());

// 解析 JSON 格式的请求体
// 前端发送 POST/PUT 请求时，如果 body 是 JSON 格式，这个中间件会将其解析为 JS 对象并挂载到 req.body
app.use(express.json());

// 解析 URL 编码的请求体
// 用于解析 form 表单提交的数据 (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ==================================================================
// 2. 路由挂载
// ==================================================================

// 将 routes/index.ts 中导出的路由挂载到 /api 路径下
// 这意味着所有 API 请求的 URL 都会以 /api 开头
// 例如：
// - 登录接口: /api/auth/login
// - 单词接口: /api/words/random
app.use('/api', routes);

// ==================================================================
// 3. 基础健康检查接口
// ==================================================================

// 访问 http://localhost:3000/ 时的响应
// 用于确认服务器是否成功启动
app.get('/', (req, res) => {
  res.send('English Learning System API is running.');
});

// 导出 app 实例，供 server.ts 使用
export default app;

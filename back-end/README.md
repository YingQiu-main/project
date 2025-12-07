# English Learning System Backend

这是英语学习系统的后端部分，基于 Express + TypeScript + SQLite (Sequelize) 构建。

## 目录结构说明

- `src/`
  - `config/` - 配置文件（如数据库连接）
  - `controllers/` - 控制器，处理具体的业务逻辑（如登录、获取单词）
  - `models/` - 数据库模型定义（定义 User, Word 表结构）
  - `routes/` - 路由定义（定义 API 路径，如 /api/auth/login）
  - `middleware/` - 中间件（如身份验证、错误处理）
  - `utils/` - 工具函数
  - `app.ts` - Express 应用配置
  - `server.ts` - 服务启动入口

## 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   复制 `.env.example` 为 `.env`，并根据需要修改配置。
   （注意：Windows 下可以使用 `copy .env.example .env`）

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   服务器将运行在 http://localhost:3000

## API 示例

- **注册**: `POST /api/auth/register`
  - Body: `{ "username": "test", "password": "123" }`
- **登录**: `POST /api/auth/login`
  - Body: `{ "username": "test", "password": "123" }`
- **获取随机单词**: `GET /api/words/random` (需要在 Header 中带上 `Authorization: Bearer <token>`)

## 开发建议

- 每次修改数据库模型 (`models/`) 后，Sequelize 会尝试自动同步表结构。
- 可以在 `controllers/` 中添加新的逻辑，并在 `routes/` 中注册对应的路由。


# AI Chat Assistant

一个基于 React + Vite + Supabase 构建的 AI 聊天助手应用。

## 功能特性

- 用户认证（注册/登录）
- 创建新对话
- 对话历史记录
- 对话重命名
- 实时消息交互

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase（认证和数据库）
- Zustand（状态管理）
- Lucide React（图标）
- React Hot Toast（通知提示）

## 开发环境设置

1. 克隆仓库：

```bash
git clone <repository-url>
cd ai-chat-assistant
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

复制 `.env.example` 文件为 `.env`，并填入你的 Supabase 配置：

```bash
cp .env.example .env
```

4. 启动开发服务器：

```bash
npm run dev
```

## 数据库设置

项目使用 Supabase 作为后端服务。需要创建以下表：

### conversations 表
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- title (text)
- created_at (timestamptz)

### messages 表
- id (uuid, primary key)
- conversation_id (uuid, references conversations)
- content (text)
- is_user (boolean)
- created_at (timestamptz)

## 生产环境部署

1. 构建项目：

```bash
npm run build
```

2. 部署 `dist` 目录到你的托管服务

## 许可证

MIT
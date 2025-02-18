# 个人博客系统

一个使用 React + TypeScript + Tailwind CSS 构建的现代化个人博客系统。

## 功能特点

- 🎨 现代化UI设计
- 🌓 支持暗黑模式
- 📱 完全响应式布局
- ⚡️ 快速的页面切换动画
- 📝 Markdown文章支持
- 🎯 文章目录导航
- 📊 阅读进度指示
- 🔍 文章标签分类
- 🎠 精选文章轮播
- ♾️ 无限滚动加载

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- React Router DOM
- Framer Motion
- React Markdown
- Lucide Icons

## 快速开始

### 环境要求

- Node.js 16.0 或更高版本
- npm 7.0 或更高版本

### 安装依赖

```bash
# 安装项目依赖
npm install
```

### 开发环境运行

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 查看项目。

### 生产环境构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── components/        # 组件目录
│   ├── blog/         # 博客相关组件
│   ├── common/       # 通用组件
│   └── layout/       # 布局组件
├── hooks/            # 自定义Hooks
├── pages/           # 页面组件
├── store/           # 状态管理
└── lib/             # 工具函数和配置
```

## 开发指南

### 添加新文章

1. 在 `src/data/posts` 目录下创建新的Markdown文件
2. 添加文章元数据
3. 编写文章内容

### 自定义主题

1. 修改 `tailwind.config.js` 配置文件
2. 更新颜色和排版设置

### 部署说明

项目可以部署到任何支持静态网站的平台：

1. Vercel (推荐)
2. Netlify
3. GitHub Pages

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
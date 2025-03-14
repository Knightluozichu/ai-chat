我来帮你将前端开发任务提取并按优先级划分模块，以便快速开发第一版MVP。
这是一个ai智能对话项目，需要你在这个项目基础上添加个人博客功能。

一、核心页面框架搭建 (优先级最高)
1. 基础布局组件
// 需要实现:
- 响应式布局容器 (Container.tsx)
- 导航栏 (Header.tsx)
  - 固定顶部，65px高度
  - 半透明背景 + 毛玻璃效果 (backdrop-filter)
  - 支持暗黑模式切换
  - 导航项目: 首页、文章、采购助手、关于
- 页面主体区域 (Layout.tsx)
  - 统一页面布局结构
  - 响应式适配
- 页脚组件 (Footer.tsx)
  - 版权信息
  - 社交媒体链接

2. 路由配置
// 需要配置的主要路由:
- 首页 (/)
- 文章列表页 (/posts)
- 文章详情页 (/posts/[slug]) 
- 采购助手页面 (/ai-assistant)
- 关于页面 (/about)

二、首页开发 (优先级高)
1. Hero Section组件 (HeroSection.tsx)
// 实现要点:
- 个人介绍/网站简介展示
- 背景图片(Unsplash)/渐变效果
- 简洁标语设计
- 响应式适配

2. 精选文章展示 (FeaturedPosts.tsx)
// 实现要点:
- 大图+标题的布局
- 文章预览卡片组件 (PostCard.tsx)
  - 封面图(支持懒加载)
  - 标题
  - 摘要
  - 预估阅读时间
  - 悬停动画效果
- 从Supabase获取精选文章数据

3. 文章列表网格 (PostGrid.tsx)
// 实现要点:
- 2-3列响应式网格布局 (Tailwind Grid)
- 无限滚动加载
- 加载状态与错误处理
- 支持标签筛选

三、文章详情页开发 (优先级高)
1. 文章内容展示 (PostContent.tsx)
// 实现要点:
- 宽屏大标题设计
- 文章元信息展示(作者、时间、标签)
- Markdown渲染
- 代码块高亮(支持主题切换)
- 图文排版优化
- 从Supabase获取文章详情

2. 阅读辅助功能
// 实现要点:
- 阅读进度条(固定顶部)
- 自动生成目录(基于标题层级)
- 目录导航与锚点跳转
- 相关文章推荐
- 记录阅读进度


五、性能优化 (持续进行)
1. 资源加载优化
// 实现要点:
- 图片懒加载
- React.lazy动态导入组件
- 合理的资源预加载策略
- SSG预渲染关键页面

1. 用户体验优化
// 实现要点:
- 平滑滚动效果
- 渐进式加载
- 响应式图片加载
- 加载状态反馈
- 错误边界处理

技术栈规范:
- React + TypeScript
- Tailwind CSS样式处理
- Supabase数据存储
- Lucide React图标库

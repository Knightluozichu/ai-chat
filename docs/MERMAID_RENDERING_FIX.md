# Mermaid 图表渲染问题修复方案

## 问题分析

1. 当前状态：
- 使用`react-markdown`和自定义的mermaid渲染器
- 文章页面使用`@uiw/react-md-editor`
- mermaid图表无法正确渲染

2. 原因：
- 渲染组件不一致导致行为差异
- mermaid初始化配置可能不正确
- 代码块解析逻辑可能有问题

## 解决方案

### 方案1：统一使用@uiw/react-md-editor

```mermaid
graph TB
    A[当前实现] --> B{选择方案}
    B -->|方案1| C[使用@uiw/react-md-editor]
    B -->|方案2| D[优化现有实现]
    C --> E[更新组件]
    D --> F[修改渲染逻辑]
```

1. 替换现有实现：
```typescript
import MDEditor from '@uiw/react-md-editor';

// 修改组件实现
const MarkdownPreview = ({ content }: { content: string }) => {
  return <MDEditor.Markdown source={content} />;
};
```

2. 优点：
- 与文章页面保持一致的渲染效果
- 自带mermaid支持
- 减少代码复杂度

### 方案2：优化现有实现

1. 修改mermaid初始化：
```typescript
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: true,
    useMaxWidth: true,
  }
});
```

2. 改进代码块处理：
```typescript
const processMermaidBlocks = (text: string) => {
  // 支持多种代码块格式
  const patterns = [
    /```mermaid\n([\s\S]*?)```/g,
    /~~~mermaid\n([\s\S]*?)~~~/g
  ];
  // ...处理逻辑
};
```

## 建议方案

推荐采用方案1：统一使用`@uiw/react-md-editor`，原因如下：
1. 保持渲染一致性
2. 减少维护成本
3. 自带mermaid支持
4. 与现有文章系统集成良好

## 实施步骤

1. 更新依赖配置
2. 创建通用的Markdown渲染组件
3. 更新所有使用Markdown渲染的地方
4. 添加必要的样式配置
5. 进行测试验证

是否需要我继续完善这个方案？或者您希望我详细说明某个具体部分？
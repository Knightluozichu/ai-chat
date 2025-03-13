import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// 配置所有可能的图表类型
const extendedMermaidConfig = {
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'default',
  logLevel: 'error',
  flowchart: {
    htmlLabels: true,
    curve: 'linear',
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
  },
  gantt: {
    titleTopMargin: 25,
    barHeight: 20,
    barGap: 4,
    topPadding: 50,
    leftPadding: 75,
  },
  mindmap: {
    padding: 10,
    useMaxWidth: true,
  },
  themeVariables: {
    lineColor: '#666',
    textColor: '#333',
    mainBkg: '#fff',
    nodeBorder: '#666',
    clusterBkg: '#fff',
    clusterBorder: '#666',
  },
} as const;

interface MermaidRendererProps {
  content: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ content }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const renderAttempts = useRef(0);
  const maxAttempts = 3;

  useEffect(() => {
    let mounted = true;
    let renderTimeout: ReturnType<typeof setTimeout>;

    const renderMermaid = async () => {
      if (!elementRef.current || !mounted) return;

      try {
        // 重新初始化配置
        mermaid.initialize(extendedMermaidConfig);

        // 生成图表ID
        const graphId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const element = elementRef.current;

        // 检测图表类型
        const diagramType = content.trim().split('\n')[0].toLowerCase();
        console.log('Detected diagram type:', diagramType);

        // 创建容器并设置内容
        element.innerHTML = `<pre class="mermaid" id="${graphId}">${content}</pre>`;

        // 等待DOM更新
        await new Promise(resolve => requestAnimationFrame(resolve));

        // 确保元素存在
        const diagramElement = document.getElementById(graphId);
        if (!diagramElement || !mounted) return;

        // 尝试渲染
        await mermaid.run({
          nodes: [diagramElement],
          suppressErrors: false,
        });

        // 渲染成功后应用样式
        const svg = element.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
          svg.style.backgroundColor = 'transparent';
        }

        // 重置尝试次数
        renderAttempts.current = 0;

      } catch (error) {
        console.error('Mermaid rendering error:', error);

        // 如果还有尝试次数，延迟后重试
        if (renderAttempts.current < maxAttempts) {
          renderAttempts.current += 1;
          console.log(`Retrying render attempt ${renderAttempts.current}/${maxAttempts}`);
          renderTimeout = setTimeout(renderMermaid, 100 * renderAttempts.current);
        } else {
          // 显示错误信息
          if (elementRef.current && mounted) {
            elementRef.current.innerHTML = `
              <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p class="text-red-600 dark:text-red-400 font-medium">图表渲染失败</p>
                <pre class="mt-2 text-sm text-red-500 dark:text-red-300 whitespace-pre-wrap">${content}</pre>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  ${error instanceof Error ? error.message : '未知错误'}
                </p>
              </div>
            `;
          }
        }
      }
    };

    // 初始渲染
    renderTimeout = setTimeout(renderMermaid, 0);

    return () => {
      mounted = false;
      clearTimeout(renderTimeout);
    };
  }, [content]);

  return (
    <div 
      ref={elementRef}
      className="my-4 p-4 bg-white dark:bg-gray-800 rounded-lg overflow-auto"
      style={{ minHeight: '50px' }}
    >
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default React.memo(MermaidRenderer);
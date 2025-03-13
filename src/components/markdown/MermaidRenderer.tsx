import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const MermaidRenderer: React.FC<{ content: string }> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const diagramId = `mermaid-${Date.now()}`;

    const renderDiagram = async () => {
      if (!containerRef.current || !mounted) return;

      try {
        // 清理旧内容
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }

        // 初始化 mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'loose'
        });

        // 创建渲染容器
        const container = document.createElement('div');
        container.id = diagramId;
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.textContent = content;
        containerRef.current.appendChild(container);

        // 渲染图表
        await mermaid.run({
          nodes: [container],
          suppressErrors: false
        });

        // 调整 SVG 样式
        const svg = containerRef.current.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
          if (document.documentElement.classList.contains('dark')) {
            const texts = svg.querySelectorAll('text');
            texts.forEach(text => {
              if (text.getAttribute('fill') === '#000') {
                text.setAttribute('fill', '#e5e7eb');
              }
            });
          }
        }

        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : '图表渲染失败');
      }
    };

    requestAnimationFrame(() => {
      renderDiagram();
    });

    return () => {
      mounted = false;
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, [content]);

  return (
    <div className="my-6 first:mt-0 last:mb-0">
      <div
        ref={containerRef}
        className={`
          relative min-h-[100px] bg-white dark:bg-gray-800 
          rounded-lg p-4 overflow-x-auto
          ${error ? 'border border-red-300 dark:border-red-700' : ''}
        `}
      >
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50">
            <div className="text-sm text-red-600 dark:text-red-400 text-center p-4">
              <p>渲染失败</p>
              <p className="mt-2 text-xs opacity-75">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MermaidRenderer);
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MermaidThemeProvider } from './MermaidThemeContext';
import MermaidRenderer from './MermaidRenderer';

interface MarkdownWithMermaidProps {
  content: string;
  className?: string;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MarkdownWithMermaid: React.FC<MarkdownWithMermaidProps> = ({ content, className }) => {
  const CodeBlock = ({ inline = false, className: codeClassName, children }: CodeProps) => {
    const match = /language-(\w+)/.exec(codeClassName || '');
    const language = match?.[1];

    if (!inline && language === 'mermaid') {
      // 移除末尾的换行符并且将所有children连接成一个字符串
      const mermaidContent = Array.isArray(children)
        ? children.join('')
        : String(children);

      return <MermaidRenderer content={mermaidContent.replace(/\n$/, '')} />;
    }

    return (
      <code className={codeClassName}>
        {children}
      </code>
    );
  };

  return (
    <MermaidThemeProvider>
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code: CodeBlock
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MermaidThemeProvider>
  );
};

export default MarkdownWithMermaid;
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import MermaidRenderer from './MermaidRenderer';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = ''
}) => {
  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ inline, className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match?.[1];

            if (!inline && language === 'mermaid') {
              const mermaidContent = Array.isArray(children)
                ? children.join('')
                : String(children);

              return <MermaidRenderer content={mermaidContent.replace(/\n$/, '')} />;
            }

            return (
              <code className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
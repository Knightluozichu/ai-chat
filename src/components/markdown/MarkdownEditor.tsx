import React, { useState } from 'react';
import { Bold, Heading1, Heading2, Heading3, List, Code } from 'lucide-react';
import MarkdownPreview from './MarkdownPreview';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  className?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}

const ToolbarButton = ({ icon, onClick, title }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
    title={title}
  >
    {icon}
  </button>
);

const MarkdownEditor = ({
  value,
  onChange,
  height = 500,
  className = ''
}: MarkdownEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const insertText = (
    prefix: string,
    suffix: string = '',
    defaultText: string = ''
  ) => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    const insertedText = selectedText || defaultText;

    const newText = `${beforeText}${prefix}${insertedText}${suffix}${afterText}`;
    onChange(newText);

    // 恢复焦点并设置选区
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + insertedText.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: <Heading1 className="w-4 h-4" />,
      onClick: () => insertText('# ', '', '标题'),
      title: '一级标题'
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      onClick: () => insertText('## ', '', '标题'),
      title: '二级标题'
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      onClick: () => insertText('### ', '', '标题'),
      title: '三级标题'
    },
    {
      icon: <Bold className="w-4 h-4" />,
      onClick: () => insertText('**', '**', '加粗文本'),
      title: '加粗'
    },
    {
      icon: <List className="w-4 h-4" />,
      onClick: () => insertText('- ', '', '列表项'),
      title: '无序列表'
    },
    {
      icon: <Code className="w-4 h-4" />,
      onClick: () => insertText('\n```\n', '\n```\n', '代码块'),
      title: '代码块'
    }
  ];

  return (
    <div
      className={`flex flex-col border rounded-lg overflow-hidden bg-white dark:bg-gray-800 ${className}`}
      style={{ height }}
    >
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-2 border-b dark:border-gray-700">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => (
            <ToolbarButton key={index} {...button} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          {showPreview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 编辑器内容区 */}
      <div className="flex flex-1 min-h-0">
        {!showPreview && (
          <textarea
            id="markdown-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 p-4 resize-none border-none focus:outline-none bg-transparent text-gray-900 dark:text-white"
            placeholder="在此输入 Markdown 文本..."
          />
        )}
        {showPreview && (
          <div className="flex-1 overflow-auto">
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
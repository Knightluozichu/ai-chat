import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FileText, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { getAssetPath, getPreviewPath } from '../../utils/fileUtils';

interface FilePreviewProps {
  filePath: string;
}

export const FilePreview = ({ filePath }: FilePreviewProps) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const ext = filePath.split('.').pop() || '';

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
          setContent(getAssetPath(filePath));
        } else if (['md', 'txt'].includes(ext)) {
          // 使用 fetch 获取文件内容，并指定响应类型为 blob
          const response = await fetch(getPreviewPath(filePath));
          if (!response.ok) {
            throw new Error('Failed to fetch file content');
          }
          // 获取 blob 数据
          const blob = await response.blob();
          // 使用 FileReader 读取 blob 数据
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(blob, 'UTF-8'); // 指定编码为 UTF-8
          });
          setContent(text);
        } else if (ext === 'pdf') {
          setContent(getAssetPath(filePath));
        } else if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
          // Office 文件使用 Office Online Viewer
          const assetPath = getAssetPath(filePath);
          const fullUrl = window.location.origin + '/' + assetPath;
          const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
          setContent(viewerUrl);
        } else {
          // 对于其他文件类型，提供下载选项
          setContent('此文件类型暂不支持预览，请点击下载后查看');
        }
      } catch (err) {
        setError('加载文件失败');
        console.error('Error loading file:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filePath, ext]);

  const handleDownload = () => {
    const link = document.createElement('a');
    const assetPath = getAssetPath(filePath);
    link.href = assetPath;
    link.download = filePath.split('/').pop() || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  // 图片预览
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    return (
      <div className="flex items-center justify-center p-4">
        <img src={content} alt="预览" className="max-w-full max-h-[80vh] object-contain" />
      </div>
    );
  }

  // PDF 预览
  if (ext === 'pdf') {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer
            fileUrl={content}
            plugins={[defaultLayoutPluginInstance]}
          />
        </Worker>
      </div>
    );
  }

  // Office 文件预览
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
    return (
      <div className="relative w-full h-[calc(100vh-12rem)]">
        <iframe
          src={content}
          className="w-full h-full border-0"
          title="Office 文件预览"
        />
        <button
          onClick={() => window.open(content, '_blank')}
          className="absolute top-4 right-4 flex items-center px-3 py-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          新窗口打开
        </button>
      </div>
    );
  }

  // Markdown 预览
  if (ext === 'md') {
    return (
      <div className="prose prose-slate max-w-none p-6 [&>*]:text-gray-900 dark:[&>*]:text-gray-100 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_strong]:text-gray-900 dark:[&_strong]:text-gray-100 [&_code]:text-gray-900 dark:[&_code]:text-gray-100">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // 文本预览
  if (ext === 'txt') {
    return (
      <pre className="p-6 whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300">
        {content}
      </pre>
    );
  }

  // 其他文件类型 - 提供下载选项
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 dark:text-gray-400">
      <FileText className="w-16 h-16 mb-4" />
      <p className="mb-4">{content}</p>
      <button
        onClick={handleDownload}
        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        下载文件
      </button>
    </div>
  );
}; 
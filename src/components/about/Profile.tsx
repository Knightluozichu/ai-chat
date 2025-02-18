import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import resumeContent from '../../data/profile/resume.md?raw';
import { FileNavigation } from './FileNavigation';
import { FilePreview } from './FilePreview';
import { useState } from 'react';

export const Profile = () => {
  const defaultFile = '/src/data/profile/resume.md';
  const [selectedFile, setSelectedFile] = useState(defaultFile);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左侧导航 */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <FileNavigation onFileSelect={setSelectedFile} defaultFile={selectedFile} />
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow">
          <FilePreview filePath={selectedFile} />
        </div>
      </div>
    </div>
  );
}; 
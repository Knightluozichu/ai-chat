import { useState, useEffect } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  Code,
  Presentation,
  Table,
  Archive,
  HelpCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { FileItem } from '../../types/file';
import { getFileStructure } from '../../utils/fileUtils';

// 文件类型图标映射
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md':
      return <Code className="w-4 h-4 mr-2 text-emerald-500" />;
    case 'txt':
      return <FileText className="w-4 h-4 mr-2 text-gray-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-4 h-4 mr-2 text-blue-500" />;
    case 'ppt':
    case 'pptx':
      return <Presentation className="w-4 h-4 mr-2 text-orange-500" />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <Table className="w-4 h-4 mr-2 text-green-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <Image className="w-4 h-4 mr-2 text-purple-500" />;
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className="w-4 h-4 mr-2 text-yellow-500" />;
    default:
      return <HelpCircle className="w-4 h-4 mr-2 text-gray-500" />;
  }
};

// 文件预览处理
const handleFilePreview = (path: string) => {
  const ext = path.split('.').pop()?.toLowerCase();
  
  // 图片文件直接在新标签页打开
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    window.open(path, '_blank');
    return;
  }

  // Markdown 文件在当前页面渲染
  if (ext === 'md') {
    // TODO: 实现 Markdown 预览
    console.log('Preview markdown:', path);
    return;
  }

  // Office 文件使用 Office Online Viewer
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
    const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(window.location.origin + path)}`;
    window.open(viewerUrl, '_blank');
    return;
  }

  // 其他文件直接下载
  const link = document.createElement('a');
  link.href = path;
  link.download = path.split('/').pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface FileNavigationProps {
  onFileSelect: (path: string) => void;
  defaultFile: string;
}

interface FileTreeItemProps {
  item: FileItem;
  level?: number;
  selectedFile: string;
  onSelect: (path: string) => void;
}

const FileTreeItem = ({ item, level = 0, selectedFile, onSelect }: FileTreeItemProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const paddingLeft = `${level * 1.5}rem`;

  const isSelected = selectedFile === item.path;

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(item.path);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {item.type === 'folder' ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 mr-2 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
            )}
            <Folder className={`w-4 h-4 mr-2 ${isOpen ? 'text-blue-500' : 'text-gray-400'}`} />
          </>
        ) : (
          <>
            {getFileIcon(item.name)}
          </>
        )}
        <span 
          className={`text-sm truncate flex-1 ${
            isSelected 
              ? 'text-blue-600 dark:text-blue-400 font-medium' 
              : 'text-gray-700 dark:text-gray-300'
          }`} 
          title={item.name}
        >
          {item.name}
        </span>
        {item.type === 'file' && isHovered && (
          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      {item.type === 'folder' && isOpen && item.children && (
        <div className="ml-4 border-l border-gray-200 dark:border-gray-700">
          {item.children.map((child, index) => (
            <FileTreeItem 
              key={index} 
              item={child} 
              level={level + 1} 
              selectedFile={selectedFile}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileNavigation = ({ onFileSelect, defaultFile }: FileNavigationProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileStructure, setFileStructure] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileStructure = async () => {
      try {
        setLoading(true);
        const data = await getFileStructure('/src/data');
        setFileStructure(data);
      } catch (error) {
        console.error('Error fetching file structure:', error);
        setError('加载文件列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchFileStructure();
  }, []);

  const filterItems = (items: FileItem[], term: string): FileItem[] => {
    return items.map(item => ({
      ...item,
      children: item.children ? filterItems(item.children, term) : undefined
    })).filter(item => 
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      (item.children && item.children.length > 0)
    );
  };

  const filteredStructure = searchTerm
    ? filterItems(fileStructure, searchTerm)
    : fileStructure;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
        <div className="text-red-500 text-center p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">文件导航</h3>
      
      {/* 搜索框 */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="搜索文件..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border rounded-lg border-gray-200 dark:border-gray-700 overflow-auto max-h-[calc(100vh-16rem)]">
        {filteredStructure.map((item, index) => (
          <FileTreeItem 
            key={index} 
            item={item} 
            selectedFile={defaultFile}
            onSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}; 
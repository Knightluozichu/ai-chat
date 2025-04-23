import { useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, Settings, Image, Video, FileText, BarChart2 } from 'lucide-react';
import ImageEditor from '../components/tools/ImageEditor';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const tools: Tool[] = [
  {
    id: 'image-editor',
    name: '图片去重做二创',
    icon: <Image className="w-6 h-6" />,
    description: '支持图片去水印、裁剪、滤镜等二次创作'
  },
  {
    id: 'video-editor',
    name: '视频剪辑工具',
    icon: <Video className="w-6 h-6" />,
    description: '视频剪辑、转码、特效处理'
  },
  {
    id: 'text-generator',
    name: '文案生成器',
    icon: <FileText className="w-6 h-6" />,
    description: 'AI智能文案生成与优化'
  },
  {
    id: 'data-visualization',
    name: '数据可视化工具',
    icon: <BarChart2 className="w-6 h-6" />,
    description: '数据图表生成与展示'
  }
];

const Tools = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedTool, setSelectedTool] = useState(tools[0]);

  return (
    <div className="min-h-screen pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* 左侧导航栏 */}
        <div 
          className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {!isCollapsed && <h2 className="text-lg font-semibold">工具中心</h2>}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isCollapsed ? "展开导航栏" : "收起导航栏"}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="p-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`w-full flex items-center gap-3 p-2 rounded-md mb-2 transition-colors ${
                  selectedTool.id === tool.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex-shrink-0">{tool.icon}</div>
                {!isCollapsed && (
                  <div className="text-left">
                    <div className="text-sm font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{tool.description}</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧功能区 */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          {/* 顶部功能栏 */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title="返回">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold">{selectedTool.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title="帮助文档">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title="设置">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 工具内容区域 */}
          <div className="h-[calc(100%-4rem)]">
            {selectedTool.id === 'image-editor' && (
              <ImageEditor onClose={() => setSelectedTool(tools[0])} />
            )}
            {selectedTool.id === 'video-editor' && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                视频编辑工具开发中...
              </div>
            )}
            {selectedTool.id === 'text-generator' && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                文案生成器开发中...
              </div>
            )}
            {selectedTool.id === 'data-visualization' && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                数据可视化工具开发中...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools; 
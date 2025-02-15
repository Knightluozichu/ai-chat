import React, { useState } from 'react';
import { Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { KnowledgePanel } from './KnowledgePanel';

export function KnowledgeCapsule() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  return (
    <div className="fixed right-0 top-1/4 flex items-start z-50">
      {/* 胶囊悬浮窗 */}
      <div
        className={`flex items-center bg-white shadow-lg rounded-l-xl transition-transform duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'
        }`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-l-xl transition-colors"
          title={isExpanded ? "收起" : "展开"}
        >
          {isExpanded ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        <div className={`flex items-center space-x-2 px-4 py-2 ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}>
          <button
            onClick={() => setShowKnowledgeBase(true)}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group relative"
            title="知识库"
          >
            <Database className="w-6 h-6 text-blue-500 group-hover:text-blue-600" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              知识库
            </span>
          </button>
        </div>
      </div>

      {/* 知识库面板 */}
      {showKnowledgeBase && (
        <KnowledgePanel onClose={() => setShowKnowledgeBase(false)} />
      )}
    </div>
  );
}
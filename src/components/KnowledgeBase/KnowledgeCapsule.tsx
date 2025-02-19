import { useState } from 'react';
import { Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { KnowledgePanel } from './KnowledgePanel';
import { motion, AnimatePresence } from 'framer-motion';

export function KnowledgeCapsule() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  return (
    <>
      <motion.div 
        className="fixed right-0 top-1/4 flex items-start z-50"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.div
          className="flex items-center bg-white shadow-lg rounded-l-xl overflow-hidden"
          animate={{
            width: isExpanded ? 'auto' : '2rem',
            transition: { duration: 0.2 }
          }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-l-xl transition-colors"
            title={isExpanded ? "收起" : "展开"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isExpanded ? 'expanded' : 'collapsed'}
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                {isExpanded ? (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center space-x-2 px-4 py-2"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowKnowledgeBase(true)}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors group relative"
                  title="知识库"
                >
                  <Database className="w-6 h-6 text-blue-500 group-hover:text-blue-600" />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    知识库
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showKnowledgeBase && (
          <KnowledgePanel onClose={() => setShowKnowledgeBase(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
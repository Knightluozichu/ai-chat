import { useState, useEffect } from 'react';
import { Plus, Loader2, Search, Edit2, Trash2 } from 'lucide-react';
import { usePracticeManagementStore } from '../../../store/practiceManagementStore';
import type { Question } from '../../../types/practice';
import QuestionForm from './QuestionForm';

interface QuestionSectionProps {
  selectedCategoryId: number | null;
}

const QuestionSection = ({ selectedCategoryId }: QuestionSectionProps) => {
  const { categories, questions, loadingQuestions, fetchQuestions, deleteQuestion } = usePracticeManagementStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isShowingForm, setIsShowingForm] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedCategoryId) {
      fetchQuestions(selectedCategoryId);
    }
  }, [selectedCategoryId, fetchQuestions]);

  const handleDelete = async (questionId: string) => {
    try {
      await deleteQuestion(questionId);
      setIsConfirmingDelete(null);
    } catch (error) {
      console.error('删除题目失败:', error);
    }
  };

  const DeleteConfirmDialog = ({ questionId }: { questionId: string }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          确认删除
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          确定要删除这个题目吗？该操作无法撤销。
        </p>
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300"
            onClick={() => setIsConfirmingDelete(null)}
          >
            取消
          </button>
          <button
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            onClick={() => handleDelete(questionId)}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );

  const selectedCategory = selectedCategoryId
    ? categories.find(c => c.id === selectedCategoryId)
    : null;

  if (loadingQuestions) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            题目管理
            {selectedCategory && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedCategory.name})
              </span>
            )}
          </h2>
          <button
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setSelectedQuestion(null);
              setIsShowingForm(true);
            }}
            disabled={!selectedCategoryId}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加题目
          </button>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索题目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 题目列表 */}
        {!selectedCategoryId ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            请先选择一个分类
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            当前分类下暂无题目
          </div>
        ) : (
          <div className="space-y-4">
            {questions
              .filter(q => 
                q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.content.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((question) => (
                <div
                  key={question.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {question.title}
                    </h3>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedQuestion(question);
                          setIsShowingForm(true);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                        aria-label={`编辑题目 ${question.title}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setIsConfirmingDelete(question.id)}
                        className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                        aria-label={`删除题目 ${question.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {question.content.length > 100
                      ? `${question.content.slice(0, 100)}...`
                      : question.content}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* 题目编辑表单 */}
        {isShowingForm && (
          <QuestionForm
            question={selectedQuestion || undefined}
            categoryId={selectedCategoryId}
            onClose={() => {
              setIsShowingForm(false);
              setSelectedQuestion(null);
            }}
          />
        )}

        {/* 删除确认对话框 */}
        {isConfirmingDelete && (
          <DeleteConfirmDialog questionId={isConfirmingDelete} />
        )}
      </div>
    </div>
  );
};

export default QuestionSection;
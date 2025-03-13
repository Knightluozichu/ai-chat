import { useState } from 'react';
import { X } from 'lucide-react';
import { usePracticeManagementStore } from '../../../store/practiceManagementStore';
import type { Question } from '../../../types/practice';
import MarkdownPreview from '../../markdown/MarkdownPreview';
import MarkdownEditor from '../../markdown/MarkdownEditor';

interface QuestionFormProps {
  question?: Question;
  categoryId: number | null;
  onClose: () => void;
}

const QuestionForm = ({ question, categoryId, onClose }: QuestionFormProps) => {
  const { categories, createQuestion, updateQuestion } = usePracticeManagementStore();
  
  const [formData, setFormData] = useState({
    category_id: question?.category_id || categoryId || '',
    title: question?.title || '',
    content: question?.content || '',
    answer: question?.answer || '',
    explanation: question?.explanation || ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id) {
      setError('请选择分类');
      return;
    }
    if (!formData.title.trim()) {
      setError('请输入题目标题');
      return;
    }
    if (!formData.content.trim()) {
      setError('请输入题目内容');
      return;
    }
    if (!formData.answer.trim()) {
      setError('请输入答案');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const questionData = {
        ...formData,
        category_id: Number(formData.category_id)
      };

      if (question) {
        await updateQuestion(question.id, questionData);
      } else {
        await createQuestion(questionData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-labelledby="question-form-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 id="question-form-title" className="text-lg font-medium text-gray-900 dark:text-white">
            {question ? '编辑题目' : '新增题目'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 分类选择 */}
            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                分类
              </label>
              <select
                id="category-select"
                name="category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={categoryId !== null}
                aria-describedby={error && !formData.category_id ? "category-error" : undefined}
              >
                <option value="">选择分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 题目标题 */}
            <div>
              <label htmlFor="title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                标题
              </label>
              <input
                id="title-input"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="请输入题目标题"
                aria-describedby={error && !formData.title.trim() ? "title-error" : undefined}
              />
            </div>

            {/* 题目内容 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  内容
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  aria-label={showPreview ? "切换到编辑模式" : "切换到预览模式"}
                >
                  {showPreview ? '编辑' : '预览'}
                </button>
              </div>
              {showPreview ? (
                <div className="mt-1 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                  <MarkdownPreview content={formData.content} />
                </div>
              ) : (
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  height={300}
                />
              )}
            </div>

            {/* 答案 */}
            <div>
              <label htmlFor="answer-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                答案
              </label>
              <input
                id="answer-input"
                type="text"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="请输入答案"
                aria-describedby={error && !formData.answer.trim() ? "answer-error" : undefined}
              />
            </div>

            {/* 解释 */}
            <div>
              <label htmlFor="explanation-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                解释（可选）
              </label>
              <MarkdownEditor
                value={formData.explanation}
                onChange={(value) => setFormData({ ...formData, explanation: value })}
                height={200}
              />
            </div>

            {error && (
              <p id="form-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
              >
                {isSubmitting ? '提交中...' : (question ? '保存' : '创建')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
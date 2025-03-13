import { useState } from 'react';
import { X } from 'lucide-react';
import { usePracticeManagementStore } from '../../../store/practiceManagementStore';
import type { Category } from '../../../types/practice';

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
}

export const CategoryForm = ({ category, onClose }: CategoryFormProps) => {
  const [name, setName] = useState(category?.name || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createCategory, updateCategory } = usePracticeManagementStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('分类名称不能为空');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (category) {
        await updateCategory(category.id, { name: name.trim() });
      } else {
        await createCategory(name.trim());
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {category ? '编辑分类' : '新增分类'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="categoryName" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                分类名称
              </label>
              <input
                type="text"
                id="categoryName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="请输入分类名称"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : (category ? '保存' : '创建')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
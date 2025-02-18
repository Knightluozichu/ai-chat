import { usePracticeStore } from '../../store/practiceStore';
import { Loader2 } from 'lucide-react';

export const CategoryList = () => {
  const { categories, currentCategory, setCurrentCategory, loading } = usePracticeStore();

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          题目分类
        </h2>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCurrentCategory(category)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                currentCategory?.id === category.id
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 
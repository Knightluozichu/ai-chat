import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePracticeManagementStore } from '../../store/practiceManagementStore';
import CategorySection from '../../components/practice/management/CategorySection';
import QuestionSection from '../../components/practice/management/QuestionSection';

const PracticeManagement = () => {
  const { fetchCategories, loadingCategories } = usePracticeManagementStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories().catch(console.error);
  }, [fetchCategories]);

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          阿飞加练管理
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 分类管理区域 */}
        <CategorySection 
          onCategorySelect={setSelectedCategoryId}
        />
        
        {/* 题目管理区域 */}
        <QuestionSection 
          selectedCategoryId={selectedCategoryId}
        />
      </div>
    </div>
  );
};

export default PracticeManagement;
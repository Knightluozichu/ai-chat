import { useEffect } from 'react';
import { Container } from '../components/layout/Container';
import { CategoryList } from '../components/practice/CategoryList';
import { QuestionView } from '../components/practice/QuestionView';
import { usePracticeStore } from '../store/practiceStore';

const Practice = () => {
  const { fetchCategories, currentCategory } = usePracticeStore();

  useEffect(() => {
    console.log('Practice组件加载，开始获取分类...');
    fetchCategories().catch(error => {
      console.error('获取分类失败:', error);
    });
  }, []); // 移除 fetchCategories 依赖，因为它是稳定的函数引用

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          阿飞加练
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧分类列表 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <CategoryList />
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1">
            {currentCategory ? (
              <QuestionView />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  请从左侧选择一个分类开始练习
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Practice; 
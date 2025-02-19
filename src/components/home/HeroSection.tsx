import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../layout/Container';

export const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03] bg-[size:40px_40px]" />
      </div>

      <Container className="relative">
        <div className="max-w-4xl mx-auto pt-20 pb-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            探索AI的无限可能
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            在这里，你可以与采购助手进行智能对话，阅读前沿技术文章，
            探索人工智能的最新发展。让我们一起开启AI之旅。
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/ai-assistant"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200"
            >
              开始对话
              <ArrowRight className="ml-2 -mr-1 h-4 w-4 inline-block" />
            </Link>
            
            <Link
              to="/posts"
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              浏览文章 <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* 特性展示 */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: '智能对话',
                description: '与采购助手进行自然、流畅的对话，获取专业解答'
              },
              {
                title: '技术博客',
                description: '深入浅出的技术文章，助你了解AI前沿发展'
              },
              {
                title: '知识分享',
                description: '在社区中分享经验，与志同道合者交流'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
              >
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}; 
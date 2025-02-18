import { useState, useEffect } from 'react';
import { usePracticeStore } from '../../store/practiceStore';
import { Loader2, RefreshCw, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export const QuestionView = () => {
  const { 
    currentCategory,
    currentQuestion,
    loading,
    error,
    showAnswer,
    fetchRandomQuestion,
    checkAnswer,
    toggleShowAnswer
  } = usePracticeStore();

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<{
    isCorrect?: boolean;
    correctAnswer?: string;
    explanation?: string;
  }>({});

  // 当分类或题目变化时，重置选中状态
  useEffect(() => {
    setSelectedAnswer('');
    setAnswerResult({});
  }, [currentCategory?.id, currentQuestion?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnswer) return;

    const result = checkAnswer(selectedAnswer);
    setAnswerResult(result);
  };

  const handleNext = () => {
    if (currentCategory) {
      setSelectedAnswer('');
      setAnswerResult({});
      fetchRandomQuestion(currentCategory.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  // 从题目内容中解析选项
  const options = ['A', 'B', 'C', 'D'].map(option => {
    const regex = new RegExp(`${option}[.．]\\s*(.+)`, 'm');
    const match = currentQuestion.content.match(regex);
    return match ? match[1].trim() : '';
  }).filter(Boolean);

  // 提取题目文本（去除选项部分）
  const questionText = currentQuestion.content.split('\n')[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6">
        {/* 题目内容 */}
        <div className="prose dark:prose-invert max-w-none mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {questionText}
          </h3>
          
          {/* 选项列表 */}
          <div className="space-y-4">
            {options.map((optionText, index) => {
              const optionLabel = String.fromCharCode(65 + index);
              return (
                <label
                  key={optionLabel}
                  className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${selectedAnswer === optionLabel
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={optionLabel}
                    checked={selectedAnswer === optionLabel}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-900 dark:text-white">
                    {optionLabel}. {optionText}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors
              ${!selectedAnswer
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
          >
            提交答案
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors inline-flex items-center font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            下一题
          </button>
        </div>

        {/* 答案反馈 */}
        {answerResult.isCorrect !== undefined && (
          <div className={`mt-6 p-6 rounded-lg border ${
            answerResult.isCorrect
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {answerResult.isCorrect ? (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-800">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-300" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-800">
                  <X className="w-5 h-5 text-red-600 dark:text-red-300" />
                </div>
              )}
              <h3 className="text-lg font-medium">
                {answerResult.isCorrect ? '回答正确！' : '回答错误'}
              </h3>
            </div>
            
            {!answerResult.isCorrect && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">正确答案:</span>
                  <span className="text-lg">{answerResult.correctAnswer}</span>
                </div>
                {currentQuestion.explanation && (
                  <div className="pt-4 border-t border-red-200 dark:border-red-800">
                    <h4 className="font-medium mb-2">解释:</h4>
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {currentQuestion.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 显示答案按钮 */}
        {!answerResult.isCorrect && (
          <button
            onClick={toggleShowAnswer}
            className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showAnswer ? '隐藏答案' : '显示答案'}
          </button>
        )}

        {/* 显示答案和解释 */}
        {showAnswer && !answerResult.isCorrect && (
          <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              参考答案
            </h3>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                {currentQuestion.answer}
              </p>
              {currentQuestion.explanation && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    答案解释
                  </h4>
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {currentQuestion.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
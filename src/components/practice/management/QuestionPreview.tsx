import { Question } from '../../../types/practice';
import MarkdownPreview from '../../markdown/MarkdownPreview';

interface QuestionPreviewProps {
  question: Question;
  className?: string;
}

const QuestionPreview = ({ question, className }: QuestionPreviewProps) => {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {question.title}
        </h3>
        <MarkdownPreview content={question.content} />
      </div>

      {/* 答案部分 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
          答案
        </h4>
        <p className="text-gray-700 dark:text-gray-300">
          {question.answer}
        </p>
      </div>

      {/* 解释部分 */}
      {question.explanation && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            解释
          </h4>
          <MarkdownPreview content={question.explanation} />
        </div>
      )}
    </div>
  );
};

export default QuestionPreview;
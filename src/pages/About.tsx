import { Container } from '../components/layout/Container';

const About = () => {
  return (
    <Container>
      <div className="py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">关于我们</h1>
        <div className="prose dark:prose-invert">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            AI Blog 是一个结合了AI助手和博客功能的创新平台。我们致力于为用户提供智能的对话体验，
            同时分享AI领域的前沿知识和实践经验。
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            通过这个平台，你可以：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>与AI助手进行智能对话</li>
            <li>阅读AI相关的技术文章和见解</li>
            <li>分享你的想法和经验</li>
            <li>探索AI技术的无限可能</li>
          </ul>
        </div>
      </div>
    </Container>
  );
};

export default About; 
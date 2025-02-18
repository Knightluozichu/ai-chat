import { Github, Twitter } from 'lucide-react';
import { Container } from './Container';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 py-12 mt-auto">
      <Container>
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} AI Blog. All rights reserved.
          </div>
        </div>
      </Container>
    </footer>
  );
}; 
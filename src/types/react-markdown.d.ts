declare module 'react-markdown' {
  import { ReactNode } from 'react';

  export interface ReactMarkdownOptions {
    children: string;
    remarkPlugins?: any[];
    rehypePlugins?: any[];
    components?: {
      [key: string]: React.ComponentType<{
        node?: any;
        inline?: boolean;
        className?: string;
        children?: ReactNode;
        [key: string]: any;
      }>;
    };
  }

  declare function ReactMarkdown(props: ReactMarkdownOptions): JSX.Element;
  export default ReactMarkdown;
}
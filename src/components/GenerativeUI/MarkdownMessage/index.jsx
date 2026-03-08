import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { markdownComponents } from './markdownComponents';

export function MarkdownMessage({ content, className }) {
  if (!content) return null;

  return (
    <div className={cn('max-w-none text-[0.935rem]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

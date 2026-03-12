import { useMemo } from 'react';
import { XMarkdown, type XMarkdownProps } from '@ant-design/x-markdown';
import { cn } from '@/lib/utils';
import { xMarkdownComponents } from './markdownComponents';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

const STREAMING_CONFIG = { hasNextChunk: true, enableAnimation: true };
const DONE_CONFIG = { hasNextChunk: false };

const components = xMarkdownComponents as unknown as XMarkdownProps['components'];

export function MarkdownMessage({ content, isStreaming, className }: MarkdownMessageProps) {
  if (!content) return null;

  const streaming = useMemo(
    () => (isStreaming ? STREAMING_CONFIG : DONE_CONFIG),
    [isStreaming],
  );

  return (
    <div className={cn('max-w-none text-[0.935rem]', className)}>
      <XMarkdown
        content={content}
        streaming={streaming}
        components={components}
      />
    </div>
  );
}

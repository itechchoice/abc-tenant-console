import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

export const markdownComponents: Components = {
  code({ className, children, ...rest }) {
    const match = /language-(\w+)/.exec(className || '');
    const value = String(children).replace(/\n$/, '');

    if (match) {
      return <CodeBlock language={match[1]} value={value} />;
    }

    return (
      <code
        className={cn(
          'rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5',
          'font-mono text-[0.84em] text-zinc-800',
          'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
        )}
        {...rest}
      >
        {children}
      </code>
    );
  },

  pre: ({ children }) => <>{children}</>,

  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 text-xl font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-7 text-foreground/90 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 ml-6 list-disc space-y-1.5 text-foreground/90 [&>li]:leading-7">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-6 list-decimal space-y-1.5 text-foreground/90 [&>li]:leading-7">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-[3px] border-zinc-300 pl-4 text-foreground/70 dark:border-zinc-600">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border bg-muted/50">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-border px-4 py-2.5 text-foreground/85">
      {children}
    </td>
  ),
  hr: () => <hr className="my-6 border-border" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/30 underline-offset-[3px] transition-colors hover:decoration-primary/60"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/80">{children}</em>
  ),
  del: ({ children }) => (
    <del className="text-muted-foreground line-through">{children}</del>
  ),
};

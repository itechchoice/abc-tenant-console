import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

interface ComponentProps {
  children?: ReactNode;
  streamStatus?: 'loading' | 'done';
  [key: string]: unknown;
}

function CodeComponent({ children, ...rest }: ComponentProps) {
  const className = (rest.className as string) || '';
  const match = /language-(\w+)/.exec(className);
  const value = String(children ?? '').replace(/\n$/, '');

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
    >
      {children}
    </code>
  );
}

function Pre({ children }: ComponentProps) {
  return <>{children}</>;
}

function H1({ children }: ComponentProps) {
  return (
    <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  );
}

function H2({ children }: ComponentProps) {
  return (
    <h2 className="mb-3 mt-6 text-xl font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  );
}

function H3({ children }: ComponentProps) {
  return (
    <h3 className="mb-2 mt-5 text-lg font-semibold text-foreground first:mt-0">
      {children}
    </h3>
  );
}

function H4({ children }: ComponentProps) {
  return (
    <h4 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
      {children}
    </h4>
  );
}

function P({ children }: ComponentProps) {
  return (
    <p className="mb-3 leading-7 text-foreground/90 last:mb-0">
      {children}
    </p>
  );
}

function Ul({ children }: ComponentProps) {
  return (
    <ul className="mb-3 ml-6 list-disc space-y-1.5 text-foreground/90 [&>li]:leading-7">
      {children}
    </ul>
  );
}

function Ol({ children }: ComponentProps) {
  return (
    <ol className="mb-3 ml-6 list-decimal space-y-1.5 text-foreground/90 [&>li]:leading-7">
      {children}
    </ol>
  );
}

function Blockquote({ children }: ComponentProps) {
  return (
    <blockquote className="my-3 border-l-[3px] border-zinc-300 pl-4 text-foreground/70 dark:border-zinc-600">
      {children}
    </blockquote>
  );
}

function Table({ children }: ComponentProps) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

function Thead({ children }: ComponentProps) {
  return (
    <thead className="border-b border-border bg-muted/50">
      {children}
    </thead>
  );
}

function Th({ children }: ComponentProps) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children }: ComponentProps) {
  return (
    <td className="border-t border-border px-4 py-2.5 text-foreground/85">
      {children}
    </td>
  );
}

function Hr() {
  return <hr className="my-6 border-border" />;
}

function Anchor({ children, ...rest }: ComponentProps) {
  return (
    <a
      href={rest.href as string}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/30 underline-offset-[3px] transition-colors hover:decoration-primary/60"
    >
      {children}
    </a>
  );
}

function Strong({ children }: ComponentProps) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

function Em({ children }: ComponentProps) {
  return <em className="italic text-foreground/80">{children}</em>;
}

function Del({ children }: ComponentProps) {
  return <del className="text-muted-foreground line-through">{children}</del>;
}

/* XMarkdown injects domNode + streamStatus into every component at runtime.
   We don't use them for most components, so we widen the type here. */
export const xMarkdownComponents = {
  code: CodeComponent,
  pre: Pre,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  ul: Ul,
  ol: Ol,
  blockquote: Blockquote,
  table: Table,
  thead: Thead,
  th: Th,
  td: Td,
  hr: Hr,
  a: Anchor,
  strong: Strong,
  em: Em,
  del: Del,
} as Record<string, React.ComponentType<never>>;

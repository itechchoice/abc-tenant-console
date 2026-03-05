import { useState, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props typedef
// ---------------------------------------------------------------------------

/**
 * @typedef {object} MarkdownMessageProps
 * @property {string}  content   – Raw Markdown string to render.
 * @property {string}  [className] – Additional class names for the outer wrapper.
 */

// ---------------------------------------------------------------------------
// CodeBlock (isolated for perf – copy state never re-renders the parent)
// ---------------------------------------------------------------------------

const COPY_RESET_MS = 2000;

/** @param {{ language: string, value: string }} props */
const CodeBlock = memo(({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      /* clipboard may be unavailable in insecure contexts */
    }
  }, [value]);

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-zinc-800 bg-[#282c34]">
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-700/60 px-4 py-2 text-xs">
        <span className="font-mono text-zinc-400">
          {language || 'text'}
        </span>

        <motion.button
          type="button"
          onClick={handleCopy}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1',
            'text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-zinc-200',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="inline-flex items-center gap-1 text-emerald-400"
              >
                <Check size={14} strokeWidth={2.5} />
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="inline-flex items-center gap-1"
              >
                <Copy size={14} />
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Highlighted source ─────────────────────────────────────── */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem 1.25rem',
          background: 'transparent',
          fontSize: '0.84rem',
          lineHeight: '1.65',
        }}
        codeTagProps={{
          className: 'font-mono',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

// ---------------------------------------------------------------------------
// Custom component overrides for ReactMarkdown
// ---------------------------------------------------------------------------

const markdownComponents = {
  // ── Code (inline + block) ───────────────────────────────────────
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

  // ── Block-level wrappers (strip default <pre> chrome) ───────────
  pre: ({ children }) => children,

  // ── Headings ────────────────────────────────────────────────────
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

  // ── Paragraph ───────────────────────────────────────────────────
  p: ({ children }) => (
    <p className="mb-3 leading-7 text-foreground/90 last:mb-0">
      {children}
    </p>
  ),

  // ── Lists ───────────────────────────────────────────────────────
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

  // ── Blockquote ──────────────────────────────────────────────────
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-[3px] border-zinc-300 pl-4 text-foreground/70 dark:border-zinc-600">
      {children}
    </blockquote>
  ),

  // ── Table ───────────────────────────────────────────────────────
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

  // ── Horizontal rule ─────────────────────────────────────────────
  hr: () => <hr className="my-6 border-border" />,

  // ── Links ───────────────────────────────────────────────────────
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

  // ── Strong / Emphasis ───────────────────────────────────────────
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/80">{children}</em>
  ),

  // ── Strikethrough (GFM) ─────────────────────────────────────────
  del: ({ children }) => (
    <del className="text-muted-foreground line-through">{children}</del>
  ),
};

// ---------------------------------------------------------------------------
// MarkdownMessage
// ---------------------------------------------------------------------------

/**
 * Renders LLM-generated Markdown with full GFM support, syntax-highlighted
 * code blocks, and a polished copy-to-clipboard interaction.
 *
 * @param {MarkdownMessageProps} props
 */
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

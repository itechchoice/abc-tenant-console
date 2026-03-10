import { memo, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

const COPY_RESET_MS = 2000;

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock = memo(({ language, value }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      // clipboard may be unavailable in insecure contexts
    }
  }, [value]);

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-zinc-800 bg-[#282c34]">
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

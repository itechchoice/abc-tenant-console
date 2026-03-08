import { motion } from 'framer-motion';
import {
  Code,
  FileText,
  MessageCircle,
} from 'lucide-react';
import LogoSvg from '@/assets/svg/logo.svg';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  { icon: MessageCircle, label: 'Explain a concept', prompt: 'Explain how neural networks learn from data' },
  { icon: Code, label: 'Write some code', prompt: 'Write a debounce utility function in JavaScript' },
  { icon: FileText, label: 'Summarize content', prompt: 'Help me summarize a long document' },
];

const suggestionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
      delay: 0.15 + index * 0.06,
    },
  }),
};

export function WelcomeState({ onSuggestion }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="flex max-w-lg flex-col items-center"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
          <img src={LogoSvg} alt="" className="h-5 w-auto" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          How can I help you today?
        </h1>
        <p className="mt-2 max-w-[42ch] text-center text-sm leading-relaxed text-muted-foreground">
          Start a conversation below, or pick a suggestion to get going.
        </p>

        <div className="mt-8 grid w-full max-w-sm gap-2.5">
          {SUGGESTIONS.map((suggestion, index) => (
            <motion.button
              key={suggestion.label}
              custom={index}
              variants={suggestionVariants}
              initial="hidden"
              animate="visible"
              type="button"
              onClick={() => onSuggestion(suggestion.prompt)}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px]',
                'border border-border/60 bg-background',
                'transition-all hover:border-border hover:shadow-sm',
                'active:scale-[0.98]',
              )}
            >
              <suggestion.icon
                size={15}
                className="shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary/70"
              />
              <span className="text-foreground/80 transition-colors group-hover:text-foreground">
                {suggestion.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

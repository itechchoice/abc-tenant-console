import { memo } from 'react';
import { motion } from 'framer-motion';
import { ChatAvatar } from './ChatAvatar';

const dotTransition = {
  duration: 0.4,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};

export const TypingIndicator = memo(() => (
  <div className="flex items-start gap-3 px-4 py-2">
    <ChatAvatar author="assistant" />
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ ...dotTransition, delay: index * 0.12 }}
        />
      ))}
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

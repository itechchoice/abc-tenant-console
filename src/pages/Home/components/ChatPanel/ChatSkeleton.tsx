import { cn } from '@/lib/utils';

interface BubbleDef {
  side: 'left' | 'right';
  w: string;
  h: number;
}

const BUBBLE_DEFS: BubbleDef[] = [
  { side: 'left', w: '62%', h: 52 },
  { side: 'right', w: '44%', h: 40 },
  { side: 'left', w: '78%', h: 68 },
  { side: 'right', w: '36%', h: 36 },
  { side: 'left', w: '54%', h: 48 },
];

export function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {BUBBLE_DEFS.map((def) => (
          <div
            key={`${def.side}-${def.w}`}
            className={cn(
              'flex items-start gap-3',
              def.side === 'right' && 'flex-row-reverse',
            )}
          >
            <div className="h-7 w-7 shrink-0 rounded-full bg-muted/50 animate-pulse" />
            <div
              className={cn(
                'rounded-2xl animate-pulse',
                def.side === 'right'
                  ? 'rounded-tr-sm bg-primary/8'
                  : 'rounded-tl-sm bg-muted/50',
              )}
              style={{
                width: def.w,
                height: `${def.h}px`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

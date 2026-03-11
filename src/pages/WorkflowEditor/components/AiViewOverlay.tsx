import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Sparkles } from 'lucide-react';
import { useAiViewStore } from '@/stores/aiViewStore';
import { cn } from '@/lib/utils';

interface AiViewOverlayProps {
  onApply: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
}

export default function AiViewOverlay({ onApply, onDiscard, onRegenerate }: AiViewOverlayProps) {
  const { showToggle, activeView, setActiveView, generating } = useAiViewStore();

  if (!showToggle) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      {/* View toggle tabs */}
      <div className="flex items-center bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => setActiveView('current')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            activeView === 'current'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          Current
        </button>
        <button
          onClick={() => setActiveView('ai')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
            activeView === 'ai'
              ? 'bg-violet-600 text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          <Sparkles className="h-3 w-3" />
          AI View
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          onClick={onApply}
          disabled={generating}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Apply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
          onClick={onDiscard}
          disabled={generating}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Discard
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onRegenerate}
          disabled={generating}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

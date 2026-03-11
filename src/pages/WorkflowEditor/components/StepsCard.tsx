import { Loader2, Check, X, Circle } from 'lucide-react';
import type { GenerationStep } from '@/stores/aiViewStore';

interface StepsCardProps {
  steps: GenerationStep[];
}

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  in_progress: <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />,
  completed: <Check className="h-3.5 w-3.5 text-emerald-500" />,
  failed: <X className="h-3.5 w-3.5 text-destructive" />,
};

export default function StepsCard({ steps }: StepsCardProps) {
  if (!steps.length) return null;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Generation Progress
      </span>
      <div className="space-y-1.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            {statusIcon[step.status] ?? statusIcon.pending}
            <span className={`text-xs ${
              step.status === 'completed' ? 'text-foreground' :
              step.status === 'in_progress' ? 'text-primary font-medium' :
              step.status === 'failed' ? 'text-destructive' :
              'text-muted-foreground'
            }`}>
              {step.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import type { InteractionWidget } from '@/schemas/aiResponseSchemas';
import { cn } from '@/lib/utils';
import { buttonBase } from './fieldStyles';
import { InputField } from './InputField';
import { SelectField } from './SelectField';

export interface InteractionSubmitPayload {
  actionId: string;
  formData: Record<string, string>;
}

interface InteractionFormProps {
  widgets: InteractionWidget[];
  onSubmit: (payload: InteractionSubmitPayload) => void;
  className?: string;
}

const formVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
  },
};

export function InteractionForm({ widgets, onSubmit, className }: InteractionFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = useCallback((id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleButtonClick = useCallback((actionId: string) => {
    onSubmit?.({ actionId, formData });
  }, [formData, onSubmit]);

  if (!Array.isArray(widgets) || widgets.length === 0) return null;

  const buttons = widgets.filter((widget) => widget.type === 'button');
  const fields = widgets.filter((widget) => widget.type !== 'button');

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'my-3 rounded-lg border border-border bg-card shadow-sm',
        className,
      )}
    >
      <div className="space-y-4 p-4">
        {fields.map((widget) => {
          const value = formData[widget.id] ?? '';

          switch (widget.type) {
            case 'input':
              return (
                <InputField
                  key={widget.id}
                  widget={widget}
                  value={value}
                  onChange={handleChange}
                />
              );
            case 'select':
              return (
                <SelectField
                  key={widget.id}
                  widget={widget}
                  value={value}
                  onChange={handleChange}
                />
              );
            default:
              return null;
          }
        })}

        {buttons.length > 0 && (
          <div className="flex items-center justify-end gap-2 pt-1">
            {buttons.map((button, index) => {
              const isPrimary = index === buttons.length - 1;
              return (
                <button
                  key={button.id}
                  type="button"
                  onClick={() => handleButtonClick(button.id)}
                  className={cn(
                    buttonBase,
                    isPrimary
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {button.label || button.id}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

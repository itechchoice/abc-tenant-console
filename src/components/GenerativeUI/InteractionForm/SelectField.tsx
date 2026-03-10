import type { InteractionWidget } from '@/schemas/aiResponseSchemas';
import { cn } from '@/lib/utils';
import { inputClasses, labelClasses } from './fieldStyles';

interface SelectFieldProps {
  widget: InteractionWidget;
  value: string;
  onChange: (id: string, value: string) => void;
}

export function SelectField({ widget, value, onChange }: SelectFieldProps) {
  return (
    <div>
      {widget.label && (
        <label htmlFor={widget.id} className={labelClasses}>
          {widget.label}
        </label>
      )}
      <select
        id={widget.id}
        value={value}
        required={widget.required}
        onChange={(e) => onChange(widget.id, e.target.value)}
        className={cn(inputClasses, 'appearance-none')}
      >
        <option value="" disabled>
          Select an option
        </option>
        {Array.isArray(widget.options) && widget.options.map((opt: unknown) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const record = opt as Record<string, unknown>;
          const optValue = isObj ? String(record.value ?? record.id ?? '') : String(opt);
          const optLabel = isObj ? String(record.label ?? optValue) : String(opt);
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}

import { cn } from '@/lib/utils';
import { inputClasses, labelClasses } from './fieldStyles';

export function SelectField({ widget, value, onChange }) {
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
        {Array.isArray(widget.options) && widget.options.map((opt) => {
          const optValue = typeof opt === 'object' ? (opt.value ?? opt.id ?? '') : String(opt);
          const optLabel = typeof opt === 'object' ? (opt.label ?? optValue) : String(opt);
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

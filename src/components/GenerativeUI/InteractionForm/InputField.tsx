import type { InteractionWidget } from '@/schemas/aiResponseSchemas';
import { inputClasses, labelClasses } from './fieldStyles';

interface InputFieldProps {
  widget: InteractionWidget;
  value: string;
  onChange: (id: string, value: string) => void;
}

export function InputField({ widget, value, onChange }: InputFieldProps) {
  return (
    <div>
      {widget.label && (
        <label htmlFor={widget.id} className={labelClasses}>
          {widget.label}
        </label>
      )}
      <input
        id={widget.id}
        type="text"
        value={value}
        required={widget.required}
        placeholder="Enter value..."
        onChange={(e) => onChange(widget.id, e.target.value)}
        className={inputClasses}
      />
    </div>
  );
}

import { inputClasses, labelClasses } from './fieldStyles';

export function InputField({ widget, value, onChange }) {
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

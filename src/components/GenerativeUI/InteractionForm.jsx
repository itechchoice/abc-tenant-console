import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * @typedef {import('@/schemas/aiResponseSchemas').InteractionWidget} InteractionWidget
 */

// ---------------------------------------------------------------------------
// Props typedef
// ---------------------------------------------------------------------------

/**
 * Submission payload delivered to the parent when the user triggers a
 * button-type widget.
 *
 * @typedef {object} InteractionSubmitPayload
 * @property {string} actionId – The `id` of the button widget that was clicked.
 * @property {Record<string, string>} formData
 *   Key-value map of all input / select values collected so far.
 */

/**
 * @typedef {object} InteractionFormProps
 * @property {InteractionWidget[]} widgets
 *   Ordered list of form controls to render dynamically.
 * @property {(payload: InteractionSubmitPayload) => void} onSubmit
 *   Callback invoked when the user clicks a button-type widget.
 * @property {string} [className]
 */

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

const formVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// Shared style tokens
// ---------------------------------------------------------------------------

const inputClasses = cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
  'text-sm text-foreground placeholder:text-muted-foreground',
  'transition-colors focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
);

const labelClasses = 'mb-1.5 block text-sm font-medium text-foreground/80';

const buttonBase = cn(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  'h-10 px-4 py-2 transition-colors focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-ring/40',
  'disabled:pointer-events-none disabled:opacity-50',
);

// ---------------------------------------------------------------------------
// Field renderers
// ---------------------------------------------------------------------------

/**
 * @param {object} props
 * @param {InteractionWidget} props.widget
 * @param {string} props.value
 * @param {(id: string, value: string) => void} props.onChange
 */
function InputField({ widget, value, onChange }) {
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
        placeholder="Enter value\u2026"
        onChange={(e) => onChange(widget.id, e.target.value)}
        className={inputClasses}
      />
    </div>
  );
}

/**
 * @param {object} props
 * @param {InteractionWidget} props.widget
 * @param {string} props.value
 * @param {(id: string, value: string) => void} props.onChange
 */
function SelectField({ widget, value, onChange }) {
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

// ---------------------------------------------------------------------------
// InteractionForm
// ---------------------------------------------------------------------------

/**
 * Dynamically renders a set of form controls dictated by the backend's
 * `client_interaction` event.  Each widget in the `widgets` array is
 * mapped to an `<input>`, `<select>`, or `<button>` based on its `type`.
 *
 * When the user clicks a button-type widget the `onSubmit` callback fires
 * with the collected `formData` and the triggering button's `id`.
 *
 * @param {InteractionFormProps} props
 */
export function InteractionForm({ widgets, onSubmit, className }) {
  const [formData, setFormData] = useState({});

  const handleChange = useCallback((id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleButtonClick = useCallback(
    (actionId) => {
      onSubmit?.({ actionId, formData });
    },
    [formData, onSubmit],
  );

  if (!Array.isArray(widgets) || widgets.length === 0) return null;

  const buttons = widgets.filter((w) => w.type === 'button');
  const fields = widgets.filter((w) => w.type !== 'button');

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
        {/* ── Dynamic fields ──────────────────────────────────────── */}
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

        {/* ── Button group ────────────────────────────────────────── */}
        {buttons.length > 0 && (
          <div className="flex items-center justify-end gap-2 pt-1">
            {buttons.map((btn, idx) => {
              const isPrimary = idx === buttons.length - 1;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleButtonClick(btn.id)}
                  className={cn(
                    buttonBase,
                    isPrimary
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {btn.label || btn.id}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

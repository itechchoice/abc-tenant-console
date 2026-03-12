import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';

interface CredentialFieldProps {
  param: AuthParamConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function SecretInput({
  value, placeholder, onChange,
}: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder ?? '••••••••'}
        className="pr-9"
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {visible
          ? <EyeOff className="h-4 w-4" />
          : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function CredentialField({ param, value, error, onChange }: CredentialFieldProps) {
  const id = `auth-param-${param.paramKey}`;
  const label = param.paramName ?? param.paramKey;
  const isRequired = param.isRequired;

  const renderInput = () => {
    switch (param.paramType) {
      case 'SECRET':
        return (
          <SecretInput
            value={value}
            placeholder={param.exampleValue ?? undefined}
            onChange={onChange}
          />
        );

      case 'BOOLEAN':
        return (
          <div className="flex items-center gap-2 pt-0.5">
            <Switch
              id={id}
              checked={value === 'true'}
              onCheckedChange={(checked) => onChange(String(checked))}
            />
            <Label htmlFor={id} className="text-sm font-normal text-slate-600 cursor-pointer">
              {value === 'true' ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        );

      case 'NUMBER':
        return (
          <Input
            id={id}
            type="number"
            value={value}
            placeholder={param.exampleValue ?? 'Enter number'}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      default:
        return (
          <Input
            id={id}
            type="text"
            value={value}
            placeholder={param.exampleValue ?? `Enter ${label.toLowerCase()}`}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1">
        <Label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
        </Label>
        {isRequired && (
          <span className="text-xs text-rose-500 font-medium">*</span>
        )}
        <span className="ml-auto text-[10px] text-slate-400 uppercase tracking-wide">
          {param.location}
        </span>
      </div>

      {renderInput()}

      {param.description && !error && (
        <p className="text-xs text-slate-400 leading-relaxed">{param.description}</p>
      )}
      {error && (
        <p className={cn('text-xs text-rose-500 leading-relaxed')}>{error}</p>
      )}
    </div>
  );
}

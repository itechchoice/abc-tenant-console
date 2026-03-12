import { useEffect, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthTemplates, useAuthTemplate } from '../hooks/useAuthTemplates';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';

interface AuthInfoTabProps {
  form: UseFormReturn<any>;
}

// Fallback for NONE which the API may not return as a template
const NONE_OPTION = { authType: 'NONE', authTypeName: 'None', description: 'No authentication required' };

const PARAM_TYPE_OPTIONS = [
  { value: 'STRING', label: 'String' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'SECRET', label: 'Secret' },
];

const LOCATION_OPTIONS = [
  { value: 'HEADER', label: 'Header' },
  { value: 'QUERY', label: 'Query' },
  { value: 'BODY', label: 'Body' },
  { value: 'COOKIE', label: 'Cookie' },
];

const SCOPE_OPTIONS = [
  { value: 'SYSTEM', label: 'System' },
  { value: 'USER', label: 'User' },
];

function emptyParam(sortOrder: number): AuthParamConfig {
  return {
    paramKey: '',
    paramType: 'STRING',
    location: 'HEADER',
    locationName: '',
    levelScope: 'USER',
    isRequired: true,
    defaultValue: '',
    description: '',
    exampleValue: '',
    sortOrder,
  };
}

export default function AuthInfoTab({ form }: AuthInfoTabProps) {
  const authType = form.watch('authType');
  const authParams: AuthParamConfig[] = form.watch('authParamConfigs') ?? [];

  const { data: templates, isLoading: isLoadingTemplates } = useAuthTemplates();
  const { data: template, isFetching: isLoadingTemplate } = useAuthTemplate(authType);

  // Build options: always include NONE first, then API results (deduplicated)
  const authTypeOptions = (() => {
    const list = templates ?? [];
    const hasNone = list.some((t) => t.authType === 'NONE');
    return hasNone ? list : [NONE_OPTION, ...list];
  })();

  useEffect(() => {
    if (template?.paramTemplates && template.paramTemplates.length > 0) {
      const existing: AuthParamConfig[] = form.getValues('authParamConfigs') ?? [];
      if (existing.length === 0) {
        form.setValue('authParamConfigs', template.paramTemplates, { shouldDirty: true });
      }
    }
  }, [template, form]);

  const handleAuthTypeChange = useCallback((newType: string, onChange: (v: string) => void) => {
    onChange(newType);
    form.setValue('authParamConfigs', [], { shouldDirty: true });
  }, [form]);

  const addParam = useCallback(() => {
    const current: AuthParamConfig[] = form.getValues('authParamConfigs') ?? [];
    form.setValue('authParamConfigs', [...current, emptyParam(current.length + 1)], { shouldDirty: true });
  }, [form]);

  const removeParam = useCallback((index: number) => {
    const current: AuthParamConfig[] = form.getValues('authParamConfigs') ?? [];
    form.setValue('authParamConfigs', current.filter((_, i) => i !== index), { shouldDirty: true });
  }, [form]);

  const updateParam = useCallback((index: number, field: string, value: any) => {
    const current: AuthParamConfig[] = [...(form.getValues('authParamConfigs') ?? [])];
    current[index] = { ...current[index], [field]: value };
    form.setValue('authParamConfigs', current, { shouldDirty: true });
  }, [form]);

  return (
    <div className="space-y-4 pb-4">
      <FormField
        control={form.control}
        name="authType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auth Type</FormLabel>
            <Select
              onValueChange={(v) => handleAuthTypeChange(v, field.onChange)}
              value={field.value}
              disabled={isLoadingTemplates}
            >
              <FormControl>
                {isLoadingTemplates ? (
                  <Skeleton className="h-9 w-full rounded-md" />
                ) : (
                  <SelectTrigger>
                    <SelectValue placeholder="Select auth type" />
                  </SelectTrigger>
                )}
              </FormControl>
              <SelectContent>
                {authTypeOptions.map((opt) => (
                  <SelectItem key={opt.authType} value={opt.authType}>
                    <div className="flex flex-col gap-0.5 py-0.5">
                      <span className="font-medium text-sm">
                        {opt.authTypeName ?? opt.authType}
                      </span>
                      {'description' in opt && opt.description && (
                        <span className="text-xs text-muted-foreground leading-tight">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {authType !== 'NONE' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Auth Parameters</h4>
              {isLoadingTemplate && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              {template && (
                <Badge variant="secondary" className="text-[10px]">
                  {template.authTypeName ?? template.authType} template loaded
                </Badge>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addParam}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Parameter
            </Button>
          </div>

          {authParams.length === 0 && !isLoadingTemplate && (
            <div className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg text-sm text-muted-foreground">
              No parameters configured. Click "Add Parameter" to add one.
            </div>
          )}

          <div className="space-y-2">
            {authParams.map((param, index) => (
              <ParamCard
                key={index}
                param={param}
                index={index}
                onUpdate={updateParam}
                onRemove={removeParam}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible param card
// ---------------------------------------------------------------------------

interface ParamCardProps {
  param: AuthParamConfig;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

function ParamCard({ param, index, onUpdate, onRemove }: ParamCardProps) {
  return (
    <Collapsible defaultOpen={!param.paramKey}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors group">
            <div className="flex items-center gap-2 min-w-0">
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:hidden" />
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden group-data-[state=open]:block" />
              <span className="text-sm font-medium truncate">
                {param.paramKey || `Parameter ${index + 1}`}
              </span>
              {param.paramName && (
                <span className="text-xs text-muted-foreground truncate">
                  ({param.paramName})
                </span>
              )}
              <Badge variant="outline" className="text-[10px] shrink-0">
                {param.levelScope}
              </Badge>
              {param.isRequired && (
                <Badge variant="secondary" className="text-[10px] shrink-0">Required</Badge>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-3 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Param Key *</label>
                <Input
                  value={param.paramKey}
                  onChange={(e) => onUpdate(index, 'paramKey', e.target.value)}
                  placeholder="e.g. api_key"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                <Input
                  value={param.paramName ?? ''}
                  onChange={(e) => onUpdate(index, 'paramName', e.target.value)}
                  placeholder="e.g. API Key"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type *</label>
                <Select
                  value={param.paramType}
                  onValueChange={(v) => onUpdate(index, 'paramType', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAM_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Location *</label>
                <Select
                  value={param.location}
                  onValueChange={(v) => onUpdate(index, 'location', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Scope *</label>
                <Select
                  value={param.levelScope}
                  onValueChange={(v) => onUpdate(index, 'levelScope', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Location Name</label>
                <Input
                  value={param.locationName ?? ''}
                  onChange={(e) => onUpdate(index, 'locationName', e.target.value)}
                  placeholder="e.g. Authorization"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Default Value</label>
                <Input
                  value={param.defaultValue ?? ''}
                  onChange={(e) => onUpdate(index, 'defaultValue', e.target.value)}
                  placeholder="Default value"
                  className="h-8 text-sm"
                  type={param.paramType === 'SECRET' ? 'password' : 'text'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Input
                  value={param.description ?? ''}
                  onChange={(e) => onUpdate(index, 'description', e.target.value)}
                  placeholder="Parameter description"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Example Value</label>
                <Input
                  value={param.exampleValue ?? ''}
                  onChange={(e) => onUpdate(index, 'exampleValue', e.target.value)}
                  placeholder="e.g. sk-xxxx"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={param.isRequired}
                  onCheckedChange={(v) => onUpdate(index, 'isRequired', v)}
                />
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

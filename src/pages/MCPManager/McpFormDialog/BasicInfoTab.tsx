import { useState, useRef, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Upload, Link, X, Image as ImageIcon } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMCPCategories } from '../hooks/useMCPCategories';

interface BasicInfoTabProps {
  form: UseFormReturn<any>;
  isEdit: boolean;
}

export default function BasicInfoTab({ form, isEdit }: BasicInfoTabProps) {
  const { data: categories } = useMCPCategories();
  const [iconMode, setIconMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const selectedCategories: string[] = form.watch('categories') ?? [];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    form.setValue('icon', url, { shouldDirty: true });
  }, [form]);

  const toggleCategory = useCallback((code: string) => {
    const current: string[] = form.getValues('categories') ?? [];
    const next = current.includes(code)
      ? current.filter((c: string) => c !== code)
      : [...current, code];
    form.setValue('categories', next, { shouldDirty: true });
  }, [form]);

  const iconValue = form.watch('icon');

  return (
    <div className="space-y-4 pb-4">
      <FormField
        control={form.control}
        name="serverCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Server Code</FormLabel>
            <FormControl>
              <Input placeholder="e.g. my-mcp-server" {...field} disabled={isEdit} />
            </FormControl>
            <FormDescription>Unique identifier within the tenant, cannot be changed after creation</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="MCP Server Name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe what this MCP server does..." rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Icon — dual mode: URL / Upload */}
      <FormField
        control={form.control}
        name="icon"
        render={() => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Icon</FormLabel>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={iconMode === 'url' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setIconMode('url')}
                >
                  <Link className="h-3 w-3 mr-1" /> URL
                </Button>
                <Button
                  type="button"
                  variant={iconMode === 'upload' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setIconMode('upload')}
                >
                  <Upload className="h-3 w-3 mr-1" /> Upload
                </Button>
              </div>
            </div>

            {iconMode === 'url' ? (
              <FormControl>
                <Input
                  placeholder="https://example.com/icon.png"
                  value={iconValue ?? ''}
                  onChange={(e) => {
                    form.setValue('icon', e.target.value, { shouldDirty: true });
                    setPreviewUrl(null);
                  }}
                />
              </FormControl>
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div
                  className={cn(
                    'flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/50',
                    'h-24',
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl || iconValue ? (
                    <div className="relative">
                      <img
                        src={previewUrl ?? iconValue}
                        alt="icon preview"
                        className="h-16 w-16 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          form.setValue('icon', '', { shouldDirty: true });
                          setPreviewUrl(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">Click or drag to upload an icon</span>
                    </div>
                  )}
                </div>
                <FormDescription>Supports PNG, JPG, SVG formats</FormDescription>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="runtimeMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Runtime Mode</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="LOCAL">Local</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supportsStreaming"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Streaming</FormLabel>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm text-muted-foreground">
                  {field.value ? 'SSE streaming enabled' : 'Streaming disabled'}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="endpoint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endpoint</FormLabel>
            <FormControl>
              <Input placeholder="https://api.example.com/mcp" {...field} />
            </FormControl>
            <FormDescription>HTTP/SSE endpoint URL for the MCP Server</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Categories multi-select via badge toggles */}
      <FormItem>
        <FormLabel>Categories</FormLabel>
        {categories && categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.code);
              return (
                <Badge
                  key={cat.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors select-none',
                    isSelected && 'bg-primary text-primary-foreground',
                  )}
                  onClick={() => toggleCategory(cat.code)}
                >
                  {cat.code}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No categories available</p>
        )}
      </FormItem>
    </div>
  );
}

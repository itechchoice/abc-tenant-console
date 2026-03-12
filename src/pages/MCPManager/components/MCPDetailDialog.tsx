import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { RefreshCw, Loader2, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import { useMCPDetail } from '../hooks/useMCPDetail';
import { useSyncTools } from '../hooks/useMCPMutations';
import { useServerAuthConfig, useSaveServerAuthConfig, useDeleteServerAuthConfig } from '../hooks/useServerAuthConfig';
import CategoryEditorSection from './CategoryEditorSection';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MCPDetailDialog() {
  const { detailModal, closeDetailModal } = useMcpManagerStore();
  const { data: mcp, isLoading } = useMCPDetail(detailModal.serverId);
  const syncMutation = useSyncTools();

  return (
    <Dialog open={detailModal.open} onOpenChange={(open) => { if (!open) closeDetailModal(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>MCP Server Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-5rem)]">
          {isLoading || !mcp ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic info */}
              <div className="flex items-start gap-4">
                <ServerIconDisplay icon={mcp.icon} name={mcp.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{mcp.name}</h3>
                    <span className={cn(
                      'h-2 w-2 rounded-full',
                      mcp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-300',
                    )} />
                    <Badge variant={mcp.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {mcp.status}
                    </Badge>
                  </div>
                  {mcp.description && (
                    <p className="text-sm text-muted-foreground mt-1">{mcp.description}</p>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Server Code</span>
                  <p className="font-mono mt-0.5">{mcp.serverCode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Runtime Mode</span>
                  <p className="mt-0.5">{mcp.runtimeMode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Auth Type</span>
                  <p className="mt-0.5">{mcp.authType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Streaming</span>
                  <p className="mt-0.5">{mcp.supportsStreaming ? 'Yes' : 'No'}</p>
                </div>
                {mcp.endpoint && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Endpoint</span>
                    <p className="font-mono text-xs mt-0.5 break-all">{mcp.endpoint}</p>
                  </div>
                )}
              </div>

              {/* Tools */}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">
                    Tools ({mcp.toolCount ?? mcp.tools?.length ?? 0})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncMutation.mutate(mcp.id)}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Sync Tools
                  </Button>
                </div>
                {mcp.tools && mcp.tools.length > 0 ? (
                  <div className="space-y-2">
                    {mcp.tools.map((tool) => (
                      <div key={tool.id} className="flex items-start gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                        <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded shrink-0">{tool.name}</code>
                        {tool.description && <span className="text-muted-foreground">{tool.description}</span>}
                        {tool.enabled === false && (
                          <Badge variant="outline" className="text-[10px] ml-auto shrink-0">Disabled</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tools yet. Click "Sync Tools" to fetch from the server.</p>
                )}
              </div>

              {/* Categories */}
              <Separator />
              <CategoryEditorSection serverId={mcp.id} categories={mcp.categories ?? []} />

              {/* Auth Param Configs */}
              {mcp.authParamConfigs && mcp.authParamConfigs.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Auth Parameters</h4>
                    <div className="space-y-1.5">
                      {mcp.authParamConfigs.map((param) => (
                        <div key={param.paramKey} className="flex items-center gap-2 text-xs bg-secondary/50 rounded px-3 py-1.5">
                          <code className="font-mono bg-background px-1 py-0.5 rounded">{param.paramKey}</code>
                          {param.paramName && <span className="text-muted-foreground">{param.paramName}</span>}
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {param.levelScope}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{param.location}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* System Auth Config */}
              {mcp.authType !== 'NONE' && (
                <>
                  <Separator />
                  <SystemAuthConfigSection
                    serverId={mcp.id}
                    authParamConfigs={mcp.authParamConfigs}
                  />
                </>
              )}

              <div className="flex justify-end pt-2">
                {mcp.updatedAt && (
                  <span className="text-xs text-muted-foreground">
                    Synced {formatRelativeTime(mcp.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ServerIconDisplay({ icon, name }: { icon?: string; name: string }) {
  if (icon && (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('blob:'))) {
    return (
      <img src={icon} alt={name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-xl">
      {icon || name.charAt(0).toUpperCase()}
    </div>
  );
}

interface SystemAuthConfigSectionProps {
  serverId: string;
  authParamConfigs?: Array<{
    paramKey: string;
    paramName?: string | null;
    paramType?: string;
    levelScope?: string;
  }>;
}

function SystemAuthConfigSection({ serverId, authParamConfigs }: SystemAuthConfigSectionProps) {
  const { data: authConfig, isLoading } = useServerAuthConfig(serverId);
  const saveMutation = useSaveServerAuthConfig();
  const deleteMutation = useDeleteServerAuthConfig();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const configValues = authConfig?.configValues ?? {};
  const systemParams = (authParamConfigs ?? []).filter((p) => p.levelScope === 'SYSTEM');

  const startEditing = () => {
    const initial: Record<string, string> = {};
    for (const param of systemParams) {
      initial[param.paramKey] = configValues[param.paramKey] ?? '';
    }
    for (const [k, v] of Object.entries(configValues)) {
      if (!(k in initial)) initial[k] = v;
    }
    setEditValues(initial);
    setIsEditing(true);
  };

  const handleSave = () => {
    saveMutation.mutate(
      { serverId, configValues: editValues },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(serverId);
  };

  const isSecret = (key: string) => {
    const param = systemParams.find((p) => p.paramKey === key);
    if (param?.paramType === 'SECRET') return true;
    return key.toLowerCase().includes('secret') || key.toLowerCase().includes('password');
  };

  const getLabel = (key: string) => {
    const param = systemParams.find((p) => p.paramKey === key);
    return param?.paramName || key;
  };

  if (systemParams.length === 0 && Object.keys(configValues).length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">System Auth Config</h4>
        <div className="flex gap-1">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>Edit</Button>
              {Object.keys(configValues).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isEditing ? (
        <div className="space-y-2">
          {Object.entries(editValues).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{getLabel(key)}</label>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono bg-secondary px-1.5 py-0.5 rounded shrink-0">{key}</code>
                <Input
                  value={value}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="h-8 text-sm"
                  type={isSecret(key) ? 'password' : 'text'}
                  placeholder={`Enter ${key}...`}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Add custom key (press Enter)..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const key = (e.target as HTMLInputElement).value.trim();
                  if (key && !(key in editValues)) {
                    setEditValues((prev) => ({ ...prev, [key]: '' }));
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        </div>
      ) : Object.keys(configValues).length > 0 ? (
        <div className="space-y-1">
          {Object.entries(configValues).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs bg-secondary/50 rounded px-3 py-1.5">
              <code className="font-mono bg-background px-1 py-0.5 rounded">{key}</code>
              <span className="text-muted-foreground">
                {getLabel(key) !== key && `(${getLabel(key)}) `}
              </span>
              <span className="text-muted-foreground truncate ml-auto">
                {isSecret(key) ? '••••••••' : value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {systemParams.length > 0
            ? `${systemParams.length} system parameter(s) need configuration. Click "Edit" to set values.`
            : 'No system-level auth config set'}
        </p>
      )}
    </div>
  );
}

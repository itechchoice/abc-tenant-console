import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { McpServer } from '@/schemas/mcpManagerSchema';
import ActionMenu from './ActionMenu';

interface McpCardProps {
  mcp: McpServer;
  isUpdating?: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onSync: () => void;
}

function ServerIcon({ icon, name }: { icon?: string; name: string }) {
  if (icon && (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('blob:'))) {
    return (
      <img
        src={icon}
        alt={name}
        className="h-10 w-10 rounded-lg object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  if (icon) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg">
        {icon}
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg font-semibold text-muted-foreground">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function McpCard({
  mcp, isUpdating, onDetail, onEdit, onDelete, onToggleStatus, onSync,
}: McpCardProps) {
  const isActive = mcp.status === 'ACTIVE';

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
          <Skeleton className="h-6 w-24 rounded" />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <ServerIcon icon={mcp.icon} name={mcp.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    isActive ? 'bg-emerald-500' : 'bg-zinc-300',
                  )}
                />
                <h3 className="font-medium truncate">{mcp.name}</h3>
              </div>
              {mcp.categories && mcp.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {mcp.categories.map((code) => (
                    <Badge key={code} variant="secondary" className="text-[11px] px-1.5 py-0">
                      {code}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ActionMenu
            mcp={mcp}
            onDetail={onDetail}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onSync={onSync}
          />
        </div>

        {mcp.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {mcp.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onDetail}>
            Details
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {mcp.toolCount != null && (
              <span>{mcp.toolCount} tools</span>
            )}
            <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px]">
              {isActive ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

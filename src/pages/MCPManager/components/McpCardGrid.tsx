import { Skeleton } from '@/components/ui/skeleton';
import type { McpServer } from '@/schemas/mcpManagerSchema';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import McpCard from './McpCard';

interface McpCardGridProps {
  servers: McpServer[];
  isLoading: boolean;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
}

export default function McpCardGrid({
  servers, isLoading, onToggleStatus, onDelete, onSync,
}: McpCardGridProps) {
  const { updatingMcpIds, openDetailModal, openEditDialog } = useMcpManagerStore();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No MCP Servers found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {servers.map((mcp) => (
        <McpCard
          key={mcp.id}
          mcp={mcp}
          isUpdating={updatingMcpIds.has(mcp.id)}
          onDetail={() => openDetailModal(mcp.id)}
          onEdit={() => openEditDialog(mcp.id)}
          onDelete={() => onDelete(mcp.id)}
          onToggleStatus={() => onToggleStatus(mcp.id)}
          onSync={() => onSync(mcp.id)}
        />
      ))}
    </div>
  );
}

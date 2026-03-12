import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import type { McpServer } from '@/schemas/mcpManagerSchema';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import McpCard from './McpCard';

interface McpCardGridProps {
  servers: McpServer[];
  isLoading: boolean;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
  onConnect: (server: McpServer) => void;
}

export default function McpCardGrid({
  servers, isLoading, onPublish, onUnpublish, onDelete, onSync, onConnect,
}: McpCardGridProps) {
  const { updatingMcpIds, openDetailModal, openEditDialog } = useMcpManagerStore();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">No MCP Servers found</p>
        <p className="mt-1 text-xs text-slate-400">Create a new server to get started</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {servers.map((mcp) => (
        <McpCard
          key={mcp.id}
          mcp={mcp}
          isUpdating={updatingMcpIds.has(mcp.id)}
          onDetail={() => openDetailModal(mcp.id)}
          onEdit={() => openEditDialog(mcp.id)}
          onDelete={() => onDelete(mcp.id)}
          onPublish={() => onPublish(mcp.id)}
          onUnpublish={() => onUnpublish(mcp.id)}
          onSync={() => onSync(mcp.id)}
          onConnect={() => onConnect(mcp)}
        />
      ))}
    </motion.div>
  );
}

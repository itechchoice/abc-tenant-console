import { useState, useCallback } from 'react';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationPrevious, PaginationNext, PaginationLink,
} from '@/components/ui/pagination';
import { useMCPList } from './hooks/useMCPList';
import { useToggleServerStatus, useDeleteMCP, useSyncTools } from './hooks/useMCPMutations';
import MCPManagerHeader from './components/MCPManagerHeader';
import CategoryFilter from './components/CategoryFilter';
import McpCardGrid from './components/McpCardGrid';
import ConfirmDialog from './components/ConfirmDialog';
import MCPDetailDialog from './components/MCPDetailDialog';
import McpFormDialog from './McpFormDialog';
import CategorySheet from './CategoryManagement/CategorySheet';

export default function MCPManager() {
  const { page, setPage } = useMcpManagerStore();
  const { data, isLoading } = useMCPList();
  const toggleStatusMutation = useToggleServerStatus();
  const deleteMutation = useDeleteMCP();
  const syncMutation = useSyncTools();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [disableTarget, setDisableTarget] = useState<string | null>(null);

  const handleDelete = useCallback((id: string) => setDeleteTarget(id), []);

  const handleToggleStatus = useCallback((id: string) => {
    const server = data?.content.find((s) => s.id === id);
    if (!server) return;
    if (server.status === 'ACTIVE') {
      setDisableTarget(id);
    } else {
      toggleStatusMutation.mutate({ serverId: id, status: 'ACTIVE' });
    }
  }, [data, toggleStatusMutation]);

  const handleSync = useCallback((id: string) => {
    syncMutation.mutate(id);
  }, [syncMutation]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
    }
  }, [deleteTarget, deleteMutation]);

  const confirmDisable = useCallback(() => {
    if (disableTarget) {
      toggleStatusMutation.mutate(
        { serverId: disableTarget, status: 'DISABLED' },
        { onSettled: () => setDisableTarget(null) },
      );
    }
  }, [disableTarget, toggleStatusMutation]);

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      <MCPManagerHeader />
      <CategoryFilter />

      <McpCardGrid
        servers={data?.content ?? []}
        isLoading={isLoading}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        onSync={handleSync}
      />

      {totalPages > 1 && (
        <Pagination className="mt-auto pt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(0, page - 1))}
                className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={page === i}
                  onClick={() => setPage(i)}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Dialogs */}
      <MCPDetailDialog />
      <McpFormDialog />
      <CategorySheet />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete MCP Server"
        description="This action cannot be undone. The MCP server and all its configuration will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={!!disableTarget}
        onOpenChange={(open) => { if (!open) setDisableTarget(null); }}
        title="Disable MCP Server"
        description="This will make the MCP server unavailable to users. You can enable it again later."
        confirmLabel="Disable"
        loading={toggleStatusMutation.isPending}
        onConfirm={confirmDisable}
      />
    </div>
  );
}

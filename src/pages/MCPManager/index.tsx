import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationPrevious, PaginationNext, PaginationLink,
} from '@/components/ui/pagination';
import type { McpServerWithConnection } from './hooks/useMCPList';
import ConnectorAuth from '@/components/Auth';
import { fetchServerAuthParams } from '@/http/mcpManagerApi';
import { useMCPList } from './hooks/useMCPList';
import {
  useDeleteMCP, useSyncTools, usePublishServer, useUnpublishServer,
} from './hooks/useMCPMutations';
import MCPManagerHeader from './components/MCPManagerHeader';
import CategoryFilter from './components/CategoryFilter';
import McpCardGrid from './components/McpCardGrid';
import McpStatsBar from './components/McpStatsBar';
import ConfirmDialog from './components/ConfirmDialog';
import MCPDetailDialog from './components/MCPDetailDialog';
import McpFormDialog from './McpFormDialog';
import CategorySheet from './CategoryManagement/CategorySheet';

export default function MCPManager() {
  const { page, setPage } = useMcpManagerStore();
  const queryClient = useQueryClient();
  const { data, isLoading } = useMCPList();
  const publishMutation = usePublishServer();
  const unpublishMutation = useUnpublishServer();
  const deleteMutation = useDeleteMCP();
  const syncMutation = useSyncTools();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<string | null>(null);
  const [connectTarget, setConnectTarget] = useState<McpServerWithConnection | null>(null);

  const stats = useMemo(() => {
    const servers = data?.content ?? [];
    const activeCount = servers.filter((s) => s.status === 'ACTIVE').length;
    const totalTools = servers.reduce((acc, s) => acc + (s.toolCount ?? 0), 0);
    return [
      { label: 'Total Servers', value: data?.totalElements ?? 0, accent: 'slate' as const },
      { label: 'Published', value: activeCount, accent: 'emerald' as const },
      { label: 'Available Tools', value: totalTools, accent: 'slate' as const },
    ];
  }, [data]);

  const handlePublish = useCallback((id: string) => {
    publishMutation.mutate(id);
  }, [publishMutation]);

  const handleUnpublish = useCallback((id: string) => setUnpublishTarget(id), []);

  const handleDelete = useCallback((id: string) => setDeleteTarget(id), []);

  const handleSync = useCallback((id: string) => syncMutation.mutate(id), [syncMutation]);

  const handleConnect = useCallback((server: McpServerWithConnection) => setConnectTarget(server), []);

  // Fetch USER-level auth params when a server is selected for auth
  const { data: rawAuthParams = [], isLoading: isLoadingAuthParams } = useQuery({
    queryKey: ['server-auth-params', connectTarget?.id],
    queryFn: () => fetchServerAuthParams(connectTarget!.id),
    enabled: !!connectTarget && connectTarget.authType !== 'NONE',
    staleTime: 2 * 60 * 1000,
  });
  const authParams = rawAuthParams.filter((p) => p.levelScope === 'USER');

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
    }
  }, [deleteTarget, deleteMutation]);

  const confirmUnpublish = useCallback(() => {
    if (unpublishTarget) {
      unpublishMutation.mutate(
        unpublishTarget,
        { onSettled: () => setUnpublishTarget(null) },
      );
    }
  }, [unpublishTarget, unpublishMutation]);

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="flex flex-col gap-5 p-6 h-full overflow-auto bg-slate-50">
      <MCPManagerHeader />
      <McpStatsBar stats={stats} />
      <CategoryFilter />

      <McpCardGrid
        servers={data?.content ?? []}
        isLoading={isLoading}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onDelete={handleDelete}
        onSync={handleSync}
        onConnect={handleConnect}
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

      <ConnectorAuth
        open={!!connectTarget}
        server={connectTarget}
        authParams={authParams}
        isLoadingParams={isLoadingAuthParams}
        mode="admin"
        onSuccess={() => {
          setConnectTarget(null);
          toast.success('Connected successfully');
          queryClient.invalidateQueries({ queryKey: ['mcp'] });
        }}
        onError={() => setConnectTarget(null)}
        onClose={() => setConnectTarget(null)}
      />

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
        open={!!unpublishTarget}
        onOpenChange={(open) => { if (!open) setUnpublishTarget(null); }}
        title="Unpublish MCP Server"
        description="This will hide the server from users. You can publish it again at any time."
        confirmLabel="Unpublish"
        loading={unpublishMutation.isPending}
        onConfirm={confirmUnpublish}
      />
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationPrevious, PaginationNext, PaginationLink,
} from '@/components/ui/pagination';

import { useProviderList } from './hooks/useProviderList';
import { useDeleteProvider, useUpdateProviderStatus } from './hooks/useProviderMutations';
import { usePoolList } from './hooks/usePoolList';
import { useDeletePool } from './hooks/usePoolMutations';

import ProviderHeader from './components/ProviderHeader';
import ProviderCardGrid from './components/ProviderCardGrid';
import ProviderFormDialog from './components/ProviderFormDialog';
import ProviderDetailSheet from './components/ProviderDetailSheet';
import ModelFormDialog from './components/ModelFormDialog';

import PoolHeader from './components/PoolHeader';
import PoolCardGrid from './components/PoolCardGrid';
import PoolFormDialog from './components/PoolFormDialog';
import PoolDetailSheet from './components/PoolDetailSheet';
import AddMemberDialog from './components/AddMemberDialog';

import ConfirmDialog from './components/ConfirmDialog';

export default function ModelManager() {
  const {
    activeTab, setActiveTab,
    providerPage, setProviderPage,
    addUpdating, removeUpdating,
  } = useModelManagerStore();

  // Provider data
  const providerQuery = useProviderList();
  const deleteProviderMut = useDeleteProvider();
  const statusMut = useUpdateProviderStatus();

  // Pool data
  const poolQuery = usePoolList();
  const deletePoolMut = useDeletePool();

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{ type: string; id: string } | null>(null);

  // ── Provider handlers ──

  const handleDeleteProvider = useCallback((id: string) => setConfirm({ type: 'deleteProvider', id }), []);

  const handleToggleProviderStatus = useCallback((id: string) => {
    const p = providerQuery.data?.content.find((x) => x.id === id);
    if (!p) return;
    if (p.enabled) {
      setConfirm({ type: 'disableProvider', id });
    } else {
      addUpdating(id);
      statusMut.mutate({ id, enabled: true }, { onSettled: () => removeUpdating(id) });
    }
  }, [providerQuery.data, statusMut, addUpdating, removeUpdating]);

  // ── Pool handlers ──

  const handleDeletePool = useCallback((id: string) => setConfirm({ type: 'deletePool', id }), []);

  // ── Confirm handler ──

  const handleConfirm = useCallback(() => {
    if (!confirm) return;
    const { type, id } = confirm;
    if (type === 'deleteProvider') {
      deleteProviderMut.mutate(id, { onSettled: () => setConfirm(null) });
    } else if (type === 'disableProvider') {
      addUpdating(id);
      statusMut.mutate({ id, enabled: false }, { onSettled: () => { removeUpdating(id); setConfirm(null); } });
    } else if (type === 'deletePool') {
      deletePoolMut.mutate(id, { onSettled: () => setConfirm(null) });
    }
  }, [confirm, deleteProviderMut, statusMut, deletePoolMut, addUpdating, removeUpdating]);

  const confirmConfig: Record<string, { title: string; desc: string; label: string; variant: 'default' | 'destructive' }> = {
    deleteProvider: { title: 'Delete Provider', desc: 'This will permanently delete the provider and all its models.', label: 'Delete', variant: 'destructive' },
    disableProvider: { title: 'Disable Provider', desc: 'Models under this provider will become unavailable. You can re-enable later.', label: 'Disable', variant: 'default' },
    deletePool: { title: 'Delete Pool', desc: 'This will permanently delete the model pool and all its members.', label: 'Delete', variant: 'destructive' },
  };

  const cc = confirm ? confirmConfig[confirm.type] : null;

  const providerTotalPages = providerQuery.data?.totalPages ?? 0;

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Model Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage LLM providers, models, and routing pools</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'providers' | 'pools')}>
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="pools">Model Pools</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-4 space-y-4">
          <ProviderHeader />
          <ProviderCardGrid
            providers={providerQuery.data?.content ?? []}
            isLoading={providerQuery.isLoading}
            onDelete={handleDeleteProvider}
            onToggleStatus={handleToggleProviderStatus}
          />
          {providerTotalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setProviderPage(Math.max(0, providerPage - 1))} className={providerPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                </PaginationItem>
                {Array.from({ length: providerTotalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={providerPage === i} onClick={() => setProviderPage(i)} className="cursor-pointer">{i + 1}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setProviderPage(Math.min(providerTotalPages - 1, providerPage + 1))} className={providerPage >= providerTotalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="pools" className="mt-4 space-y-4">
          <PoolHeader />
          <PoolCardGrid
            pools={poolQuery.data ?? []}
            isLoading={poolQuery.isLoading}
            onDelete={handleDeletePool}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs & Sheets */}
      <ProviderFormDialog />
      <ProviderDetailSheet />
      <ModelFormDialog />
      <PoolFormDialog />
      <PoolDetailSheet />
      <AddMemberDialog />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => { if (!open) setConfirm(null); }}
        title={cc?.title ?? ''}
        description={cc?.desc ?? ''}
        confirmLabel={cc?.label ?? 'Confirm'}
        variant={cc?.variant ?? 'default'}
        loading={deleteProviderMut.isPending || statusMut.isPending || deletePoolMut.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

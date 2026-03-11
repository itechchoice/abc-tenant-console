import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';

import { useTokenQuotaStore } from '@/stores/tokenQuotaStore';

import { useQuotas } from './hooks/useQuotas';
import { useCreateQuota, useUpdateQuota, useDeleteQuota, useResetQuota } from './hooks/useQuotaMutations';
import { useRateLimits } from './hooks/useRateLimits';
import { useCreateRateLimit, useDeleteRateLimit } from './hooks/useRateLimitMutations';
import { useUsageSummary, useUsageByModel, useUsageByProvider, useDailyTrend } from './hooks/useUsageStats';

import DateRangePicker from './components/DateRangePicker';
import UsageSummaryCards from './components/UsageSummaryCards';
import DailyTrendChart from './components/DailyTrendChart';
import ModelUsageTable from './components/ModelUsageTable';
import ProviderUsageTable from './components/ProviderUsageTable';
import QuotaTable from './components/QuotaTable';
import QuotaFormDialog from './components/QuotaFormDialog';
import RateLimitTable from './components/RateLimitTable';
import RateLimitFormDialog from './components/RateLimitFormDialog';

import type { Quota, CreateQuotaPayload, CreateRateLimitPayload } from '@/schemas/tokenQuotaSchema';

export default function TokenQuota() {
  const {
    activeTab, setActiveTab,
    dateRange, setDateRange,
    quotaFormOpen, setQuotaFormOpen,
    editingQuota, setEditingQuota,
    rateLimitFormOpen, setRateLimitFormOpen,
  } = useTokenQuotaStore();

  // ── Usage stats ──
  const summaryQ = useUsageSummary(dateRange.start, dateRange.end);
  const byModelQ = useUsageByModel(dateRange.start, dateRange.end);
  const byProviderQ = useUsageByProvider(dateRange.start, dateRange.end);
  const trendQ = useDailyTrend(dateRange.start, dateRange.end);

  // ── Quotas ──
  const quotasQ = useQuotas();
  const createQuotaMut = useCreateQuota();
  const updateQuotaMut = useUpdateQuota();
  const deleteQuotaMut = useDeleteQuota();
  const resetQuotaMut = useResetQuota();
  const [resettingId, setResettingId] = useState<string | null>(null);

  // ── Rate limits ──
  const rateLimitsQ = useRateLimits();
  const createRateMut = useCreateRateLimit();
  const deleteRateMut = useDeleteRateLimit();

  // ── Confirm dialog state ──
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });

  const showConfirm = useCallback(
    (title: string, description: string, action: () => void) =>
      setConfirm({ open: true, title, description, action }),
    [],
  );

  // ── Handlers ──
  const handleSubmitQuota = useCallback(
    (payload: CreateQuotaPayload) => {
      if (editingQuota) {
        updateQuotaMut.mutate(
          { id: editingQuota.id, payload },
          { onSuccess: () => { setQuotaFormOpen(false); setEditingQuota(null); } },
        );
      } else {
        createQuotaMut.mutate(payload, { onSuccess: () => setQuotaFormOpen(false) });
      }
    },
    [editingQuota, createQuotaMut, updateQuotaMut, setQuotaFormOpen, setEditingQuota],
  );

  const handleEditQuota = useCallback(
    (quota: Quota) => {
      setEditingQuota(quota);
      setQuotaFormOpen(true);
    },
    [setEditingQuota, setQuotaFormOpen],
  );

  const handleDeleteQuota = useCallback(
    (id: string) => {
      showConfirm('Delete Quota', 'Are you sure you want to delete this quota rule? This cannot be undone.', () =>
        deleteQuotaMut.mutate(id),
      );
    },
    [showConfirm, deleteQuotaMut],
  );

  const handleResetQuota = useCallback(
    (id: string) => {
      showConfirm('Reset Quota', 'This will reset usage to 0 and update the period start date. Continue?', () => {
        setResettingId(id);
        resetQuotaMut.mutate(id, { onSettled: () => setResettingId(null) });
      });
    },
    [showConfirm, resetQuotaMut],
  );

  const handleCreateRateLimit = useCallback(
    (payload: CreateRateLimitPayload) => {
      createRateMut.mutate(payload, { onSuccess: () => setRateLimitFormOpen(false) });
    },
    [createRateMut, setRateLimitFormOpen],
  );

  const handleDeleteRateLimit = useCallback(
    (id: string) => {
      showConfirm('Delete Rate Limit', 'Are you sure you want to delete this rate limit rule?', () =>
        deleteRateMut.mutate(id),
      );
    },
    [showConfirm, deleteRateMut],
  );

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Page header - scrolls away */}
      <div className="px-6 pt-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Token & Usage Management</h1>
        <p className="text-sm text-muted-foreground">
          Monitor usage, manage token quotas, and configure rate limits
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        {/* Sticky tab bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3 border-b border-border/40">
          <TabsList>
            <TabsTrigger value="usage">Usage Overview</TabsTrigger>
            <TabsTrigger value="quotas">Token Quotas</TabsTrigger>
            <TabsTrigger value="rateLimits">Rate Limits</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content */}
        <div className="px-6 pb-6">
          {/* ── Tab 1: Usage Overview ── */}
          <TabsContent value="usage" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <DateRangePicker start={dateRange.start} end={dateRange.end} onChange={setDateRange} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  summaryQ.refetch();
                  byModelQ.refetch();
                  byProviderQ.refetch();
                  trendQ.refetch();
                }}
                disabled={summaryQ.isRefetching}
              >
                {summaryQ.isRefetching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh
              </Button>
            </div>

            <UsageSummaryCards data={summaryQ.data} isLoading={summaryQ.isLoading} />
            <DailyTrendChart data={trendQ.data} isLoading={trendQ.isLoading} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ModelUsageTable data={byModelQ.data} isLoading={byModelQ.isLoading} />
              <ProviderUsageTable data={byProviderQ.data} isLoading={byProviderQ.isLoading} />
            </div>
          </TabsContent>

          {/* ── Tab 2: Token Quotas ── */}
          <TabsContent value="quotas" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure token usage limits per billing period
              </p>
              <Button size="sm" onClick={() => setQuotaFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Quota
              </Button>
            </div>
            <QuotaTable
              data={quotasQ.data}
              isLoading={quotasQ.isLoading}
              onEdit={handleEditQuota}
              onReset={handleResetQuota}
              onDelete={handleDeleteQuota}
              resettingId={resettingId}
            />
          </TabsContent>

          {/* ── Tab 3: Rate Limits ── */}
          <TabsContent value="rateLimits" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Control request frequency at tenant or model level (RPM / TPM)
              </p>
              <Button size="sm" onClick={() => setRateLimitFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Rule
              </Button>
            </div>
            <RateLimitTable
              data={rateLimitsQ.data}
              isLoading={rateLimitsQ.isLoading}
              onDelete={handleDeleteRateLimit}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Dialogs ── */}
      <QuotaFormDialog
        open={quotaFormOpen}
        onOpenChange={setQuotaFormOpen}
        onSubmit={handleSubmitQuota}
        isPending={createQuotaMut.isPending || updateQuotaMut.isPending}
        editingQuota={editingQuota}
      />

      <RateLimitFormDialog
        open={rateLimitFormOpen}
        onOpenChange={setRateLimitFormOpen}
        onSubmit={handleCreateRateLimit}
        isPending={createRateMut.isPending}
      />

      <AlertDialog open={confirm.open} onOpenChange={(o) => setConfirm((p) => ({ ...p, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirm.action();
                setConfirm((p) => ({ ...p, open: false }));
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

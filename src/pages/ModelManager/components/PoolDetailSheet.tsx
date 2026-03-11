import { Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { usePoolDetail } from '../hooks/usePoolDetail';
import { POOL_STRATEGIES } from '@/schemas/modelManagerSchema';
import PoolMemberList from './PoolMemberList';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function PoolDetailSheet() {
  const { poolDetailSheet, closePoolDetail, openAddMember } = useModelManagerStore();
  const { open, id } = poolDetailSheet;
  const { data: pool, isLoading } = usePoolDetail(open ? id : undefined);

  const strategyLabel = POOL_STRATEGIES.find((s) => s.value === pool?.strategy)?.label || pool?.strategy;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) closePoolDetail(); }}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>{pool?.poolName || 'Pool Details'}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : pool ? (
          <div className="space-y-4 px-4 pb-6">
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Configuration</h4>
              <Row label="Pool Name" value={<code className="text-xs">{pool.poolName}</code>} />
              <Row label="Strategy" value={<Badge variant="secondary">{strategyLabel}</Badge>} />
              <Row label="Status" value={
                <Badge variant={pool.enabled ? 'default' : 'secondary'} className="text-[10px]">
                  {pool.enabled ? 'Active' : 'Disabled'}
                </Badge>
              } />
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Members</h4>
                <Button size="sm" variant="outline" onClick={() => openAddMember(pool.id)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add
                </Button>
              </div>
              <PoolMemberList poolId={pool.id} />
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

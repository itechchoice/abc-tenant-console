import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModelManagerStore } from '@/stores/modelManagerStore';

export default function PoolHeader() {
  const { openCreatePool } = useModelManagerStore();

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">Model Pools</h2>
        <p className="text-sm text-muted-foreground">Group models with load-balancing strategies</p>
      </div>
      <Button size="sm" onClick={openCreatePool}>
        <Plus className="h-4 w-4 mr-1" />Create Pool
      </Button>
    </div>
  );
}

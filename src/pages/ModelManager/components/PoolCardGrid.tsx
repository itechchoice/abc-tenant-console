import { Skeleton } from '@/components/ui/skeleton';
import type { ModelPool } from '@/schemas/modelManagerSchema';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import PoolCard from './PoolCard';

interface Props {
  pools: ModelPool[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export default function PoolCardGrid({ pools, isLoading, onDelete }: Props) {
  const { openPoolDetail, openEditPool } = useModelManagerStore();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
    );
  }

  if (pools.length === 0) {
    return <div className="flex flex-col items-center justify-center py-16"><p className="text-muted-foreground">No model pools found</p></div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pools.map((p) => (
        <PoolCard
          key={p.id} pool={p}
          onDetail={() => openPoolDetail(p.id)}
          onEdit={() => openEditPool(p.id)}
          onDelete={() => onDelete(p.id)}
        />
      ))}
    </div>
  );
}

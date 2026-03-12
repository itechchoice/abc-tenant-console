import { Skeleton } from '@/components/ui/skeleton';
import type { Provider } from '@/schemas/modelManagerSchema';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import ProviderCard from './ProviderCard';

interface Props {
  providers: Provider[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function ProviderCardGrid({ providers, isLoading, onDelete, onToggleStatus }: Props) {
  const { updatingIds, openProviderDetail, openEditProvider, openCreateModel } = useModelManagerStore();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>
    );
  }

  if (providers.length === 0) {
    return <div className="flex flex-col items-center justify-center py-16"><p className="text-muted-foreground">No providers found</p></div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {providers.map((p) => (
        <ProviderCard
          key={p.id}
          provider={p}
          isUpdating={updatingIds.has(p.id)}
          onDetail={() => openProviderDetail(p.id)}
          onEdit={() => openEditProvider(p.id)}
          onDelete={() => onDelete(p.id)}
          onToggleStatus={() => onToggleStatus(p.id)}
          onAddModel={() => openCreateModel(p.id)}
        />
      ))}
    </div>
  );
}

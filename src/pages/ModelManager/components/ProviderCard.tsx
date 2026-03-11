import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Provider } from '@/schemas/modelManagerSchema';
import ProviderActionMenu from './ProviderActionMenu';

interface Props {
  provider: Provider;
  isUpdating?: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export default function ProviderCard({ provider, isUpdating, onDetail, onEdit, onDelete, onToggleStatus }: Props) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
          <Skeleton className="h-6 w-24 rounded" />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg font-semibold text-muted-foreground">
              {provider.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full shrink-0', provider.enabled ? 'bg-emerald-500' : 'bg-zinc-300')} />
                <h3 className="font-medium truncate">{provider.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0">{provider.providerType}</Badge>
                {provider.hasApiKey && <Badge variant="outline" className="text-[10px] px-1.5 py-0">API Key Set</Badge>}
              </div>
            </div>
          </div>
          <ProviderActionMenu provider={provider} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} />
        </div>

        {provider.baseUrl && (
          <p className="mt-3 text-xs text-muted-foreground font-mono truncate">{provider.baseUrl}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onDetail}>Details</Button>
          <Badge variant={provider.enabled ? 'default' : 'secondary'} className="text-[10px]">
            {provider.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

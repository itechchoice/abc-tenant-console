import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { useProviderDetail } from '../hooks/useProviderDetail';
import ProviderModelTable from './ProviderModelTable';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

export default function ProviderDetailSheet() {
  const { providerDetailSheet, closeProviderDetail } = useModelManagerStore();
  const { open, id } = providerDetailSheet;
  const { data: provider, isLoading } = useProviderDetail(open ? id : undefined);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) closeProviderDetail(); }}>
      <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>{provider?.name || 'Provider Details'}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : provider ? (
          <div className="space-y-4 px-4 pb-6">
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">General</h4>
              <Row label="Type" value={<Badge variant="secondary">{provider.providerType}</Badge>} />
              <Row label="Base URL" value={<code className="text-xs">{provider.baseUrl || '(default)'}</code>} />
              <Row label="Status" value={
                <Badge variant={provider.enabled ? 'default' : 'secondary'} className="text-[10px]">
                  {provider.enabled ? 'Active' : 'Disabled'}
                </Badge>
              } />
              <Row label="API Key" value={provider.hasApiKey ? 'Configured' : 'Not set'} />
            </div>

            <Separator />

            <ProviderModelTable providerId={provider.id} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { PROVIDER_TYPES } from '@/schemas/modelManagerSchema';

export default function ProviderHeader() {
  const { providerSearch, setProviderSearch, providerTypeFilter, setProviderTypeFilter, openCreateProvider } = useModelManagerStore();

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">Providers</h2>
        <p className="text-sm text-muted-foreground">Manage LLM providers and their models</p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={providerTypeFilter || 'ALL'} onValueChange={(v) => setProviderTypeFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {PROVIDER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 w-48 h-9" value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={openCreateProvider}>
          <Plus className="h-4 w-4 mr-1" />Create
        </Button>
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { fetchProviders } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useProviderList() {
  const { providerPage, providerSearch, providerTypeFilter } = useModelManagerStore();
  const debouncedSearch = useDebouncedValue(providerSearch);

  return useQuery({
    queryKey: modelManagerKeys.providers.list({ providerPage, providerSearch: debouncedSearch, providerTypeFilter }),
    queryFn: () => fetchProviders({ page: providerPage, size: 9, name: debouncedSearch || undefined, providerType: providerTypeFilter || undefined }),
  });
}

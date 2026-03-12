import { useQuery } from '@tanstack/react-query';
import { fetchAllModels } from '@/http/modelManagerApi';
import { modelManagerKeys } from '@/pages/ModelManager/hooks/queryKeys';
import type { ModelResponse } from '@/schemas/modelManagerSchema';

export function useChatModels() {
  return useQuery({
    queryKey: modelManagerKeys.models.allList({ modelType: 'CHAT', enabled: true }),
    queryFn: () => fetchAllModels({ modelType: 'CHAT', enabled: true, size: 200 }),
    select: (page) => page.content,
  }) as ReturnType<typeof useQuery<unknown, Error, ModelResponse[]>>;
}

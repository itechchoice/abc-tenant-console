import { useQuery } from '@tanstack/react-query';
import { fetchChatModels, type ChatModel } from '@/http/modelManagerApi';

export function useChatModels() {
  return useQuery<ChatModel[], Error>({
    queryKey: ['chatModels'],
    queryFn: fetchChatModels,
    select: (models) => models.filter((m) => m.id !== 'auto'),
    staleTime: 5 * 60 * 1000,
  });
}

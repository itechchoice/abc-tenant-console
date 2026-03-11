import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPoolMembers, addPoolMember, removePoolMember } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';
import type { AddPoolMemberPayload } from '@/schemas/modelManagerSchema';

export function usePoolMembers(poolId: string | undefined) {
  return useQuery({
    queryKey: modelManagerKeys.pools.members(poolId || ''),
    queryFn: () => fetchPoolMembers(poolId!),
    enabled: !!poolId,
  });
}

export function useAddPoolMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, payload }: { poolId: string; payload: AddPoolMemberPayload }) => addPoolMember(poolId, payload),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: modelManagerKeys.pools.members(vars.poolId) }),
  });
}

export function useRemovePoolMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, memberId }: { poolId: string; memberId: string }) => removePoolMember(poolId, memberId),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: modelManagerKeys.pools.members(vars.poolId) }),
  });
}

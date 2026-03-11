import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchServerAuthConfig, saveServerAuthConfig, deleteServerAuthConfig,
  fetchServerAuthParams, saveServerAuthParams,
} from '@/http/mcpManagerApi';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';
import { mcpQueryKeys } from './useMCPList';

export function useServerAuthConfig(serverId: string | undefined) {
  return useQuery({
    queryKey: mcpQueryKeys.serverAuthConfig(serverId ?? ''),
    queryFn: () => fetchServerAuthConfig(serverId!),
    enabled: !!serverId,
  });
}

export function useSaveServerAuthConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serverId, configValues }: { serverId: string; configValues: Record<string, string> }) =>
      saveServerAuthConfig(serverId, configValues),
    onSuccess: (_data, { serverId }) => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.serverAuthConfig(serverId) });
    },
  });
}

export function useDeleteServerAuthConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) => deleteServerAuthConfig(serverId),
    onSuccess: (_data, serverId) => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.serverAuthConfig(serverId) });
    },
  });
}

export function useServerAuthParams(serverId: string | undefined) {
  return useQuery({
    queryKey: mcpQueryKeys.serverAuthParams(serverId ?? ''),
    queryFn: () => fetchServerAuthParams(serverId!),
    enabled: !!serverId,
  });
}

export function useSaveServerAuthParams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serverId, params }: { serverId: string; params: AuthParamConfig[] }) =>
      saveServerAuthParams(serverId, params),
    onSuccess: (_data, { serverId }) => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.serverAuthParams(serverId) });
      qc.invalidateQueries({ queryKey: mcpQueryKeys.detail(serverId) });
    },
  });
}

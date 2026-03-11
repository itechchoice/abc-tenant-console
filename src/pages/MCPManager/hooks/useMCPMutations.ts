import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import type { CreateMcpPayload, UpdateMcpPayload } from '@/schemas/mcpManagerSchema';
import {
  createMCP, updateMCP, deleteMCP, syncServerTools,
} from '@/http/mcpManagerApi';
import { mcpQueryKeys } from './useMCPList';

export function useCreateMCP() {
  const qc = useQueryClient();
  const { closeFormDialog } = useMcpManagerStore();

  return useMutation({
    mutationFn: (payload: CreateMcpPayload) => createMCP(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.lists() });
      closeFormDialog();
    },
  });
}

export function useUpdateMCP() {
  const qc = useQueryClient();
  const { closeFormDialog } = useMcpManagerStore();

  return useMutation({
    mutationFn: ({ serverId, payload }: { serverId: string; payload: UpdateMcpPayload }) =>
      updateMCP(serverId, payload),
    onSuccess: (_data, { serverId }) => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: mcpQueryKeys.detail(serverId) });
      closeFormDialog();
    },
  });
}

export function useDeleteMCP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) => deleteMCP(serverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.lists() });
    },
  });
}

export function useToggleServerStatus() {
  const qc = useQueryClient();
  const { addUpdatingMcp, removeUpdatingMcp } = useMcpManagerStore();

  return useMutation({
    mutationFn: ({ serverId, status }: { serverId: string; status: 'ACTIVE' | 'DISABLED' }) => {
      addUpdatingMcp(serverId);
      return updateMCP(serverId, { status });
    },
    onSettled: (_data, _err, { serverId }) => {
      removeUpdatingMcp(serverId);
      qc.invalidateQueries({ queryKey: mcpQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: mcpQueryKeys.detail(serverId) });
    },
  });
}

export function useSyncTools() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) => syncServerTools(serverId),
    onSuccess: (_data, serverId) => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.detail(serverId) });
      qc.invalidateQueries({ queryKey: mcpQueryKeys.lists() });
    },
  });
}

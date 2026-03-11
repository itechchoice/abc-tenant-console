import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWorkflows } from '@/http/workflowApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export const workflowQueryKeys = {
  all: ['workflow'] as const,
  lists: () => [...workflowQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...workflowQueryKeys.lists(), filters] as const,
  details: () => [...workflowQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowQueryKeys.details(), id] as const,
  tools: () => [...workflowQueryKeys.all, 'tools'] as const,
  runs: (id: string) => [...workflowQueryKeys.all, 'runs', id] as const,
  runDetail: (taskId: string) => [...workflowQueryKeys.all, 'run-detail', taskId] as const,
  groups: () => [...workflowQueryKeys.all, 'groups'] as const,
  dependencies: (id: string) => [...workflowQueryKeys.all, 'dependencies', id] as const,
};

export function useWorkflowList() {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(9);
  const [searchValue, setSearchValue] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>();

  const debouncedSearch = useDebouncedValue(searchValue);

  const query = useQuery({
    queryKey: workflowQueryKeys.list({ page, pageSize, searchValue: debouncedSearch, groupId }),
    queryFn: () => fetchWorkflows({
      page: page + 1,
      size: pageSize,
      name: debouncedSearch || undefined,
      groupId,
    }),
  });

  return {
    ...query,
    page,
    setPage,
    pageSize,
    searchValue,
    setSearchValue,
    groupId,
    setGroupId,
  };
}

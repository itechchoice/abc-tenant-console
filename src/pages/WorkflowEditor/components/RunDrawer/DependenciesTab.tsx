import { useState } from 'react';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkflowDependencies } from '../../hooks/useWorkflowDependencies';
import type { DependencyItem } from '@/schemas/workflowEditorSchema';

interface DependenciesTabProps {
  workflowId?: string;
  depsChecked: boolean;
  onCheckTriggered: () => void;
}

export default function DependenciesTab({ workflowId, depsChecked, onCheckTriggered }: DependenciesTabProps) {
  const { data: dependencies, isLoading, refetch } = useWorkflowDependencies(workflowId, depsChecked);

  const handleCheck = () => {
    onCheckTriggered();
    refetch();
  };

  if (!depsChecked) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">MCP Server Dependencies</h4>
          <Button variant="outline" size="sm" onClick={handleCheck}>Check</Button>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Click &quot;Check&quot; to verify MCP server authorization status.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">MCP Server Dependencies</h4>
        <Button variant="outline" size="sm" onClick={handleCheck} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Check
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
      ) : !dependencies?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">No MCP dependencies found.</p>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep: DependencyItem) => (
            <div key={dep.serverCode} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <span className="text-sm font-mono">{dep.serverCode}</span>
              {dep.authorized ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  <ShieldCheck className="h-3 w-3 mr-1" />Authorized
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <ShieldAlert className="h-3 w-3 mr-1" />Unauthorized
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

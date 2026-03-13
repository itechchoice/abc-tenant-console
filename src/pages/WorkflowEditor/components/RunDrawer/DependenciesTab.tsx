import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ConnectorAuth from '@/components/Auth';
import { fetchServersByCode } from '@/http/authConnectApi';
import { fetchServerAuthParams } from '@/http/mcpManagerApi';
import type { McpServer } from '@/schemas/mcpManagerSchema';
import type { DependencyItem } from '@/schemas/workflowEditorSchema';
import type { ServerByCode } from '@/http/authConnectApi';
import { useWorkflowDependencies } from '../../hooks/useWorkflowDependencies';

interface DependenciesTabProps {
  workflowId?: string;
  depsChecked: boolean;
  onCheckTriggered: () => void;
}

export default function DependenciesTab({ workflowId, depsChecked, onCheckTriggered }: DependenciesTabProps) {
  const { data: dependencies, isLoading, refetch } = useWorkflowDependencies(workflowId, depsChecked);
  const [connectTarget, setConnectTarget] = useState<ServerByCode | null>(null);

  // After dependencies load, batch-fetch server info by serverCodes
  const serverCodes = dependencies?.map((d) => d.serverCode) ?? [];
  const { data: serversByCode = [] } = useQuery({
    queryKey: ['servers-by-code', serverCodes],
    queryFn: () => fetchServersByCode(serverCodes),
    enabled: serverCodes.length > 0,
    staleTime: 2 * 60 * 1000,
  });
  const serverByCodeMap = new Map(serversByCode.map((s) => [s.serverCode, s]));

  // Fetch auth params for the selected server
  const { data: rawAuthParams = [], isLoading: isLoadingAuthParams } = useQuery({
    queryKey: ['dep-auth-params', String(connectTarget?.serverId)],
    queryFn: () => fetchServerAuthParams(String(connectTarget!.serverId)),
    enabled: !!connectTarget?.serverId,
    staleTime: 2 * 60 * 1000,
  });
  const authParams = rawAuthParams.filter((p) => p.levelScope === 'USER');

  // Build minimal McpServer shape for ConnectorAuth
  const connectServer: McpServer | null = connectTarget
    ? {
        id: String(connectTarget.serverId),
        serverCode: connectTarget.serverCode,
        name: connectTarget.serverName ?? connectTarget.serverCode,
        authType: (connectTarget.authType ?? 'API_KEY') as McpServer['authType'],
        status: 'DISABLED',
        icon: connectTarget.icon,
      }
    : null;

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
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : !dependencies?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">No MCP dependencies found.</p>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep: DependencyItem) => {
            const serverInfo = serverByCodeMap.get(dep.serverCode);
            debugger
            return (
              <div key={dep.serverCode} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <span className="text-sm font-mono">
                  {serverInfo?.serverName ?? dep.serverCode}
                </span>
                <div className="flex items-center gap-2">
                  {dep.authorized ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      <ShieldCheck className="h-3 w-3 mr-1" />Authorized
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <ShieldAlert className="h-3 w-3 mr-1" />Unauthorized
                      </Badge>
                      {serverInfo && serverInfo.authType && serverInfo.authType !== 'NONE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => setConnectTarget(serverInfo)}
                        >
                          Connect
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConnectorAuth
        open={!!connectTarget}
        server={connectServer}
        authParams={authParams}
        isLoadingParams={isLoadingAuthParams}
        mode="user"
        onSuccess={() => {
          setConnectTarget(null);
          toast.success('Connected successfully');
          refetch();
        }}
        onError={() => setConnectTarget(null)}
        onClose={() => setConnectTarget(null)}
      />
    </div>
  );
}

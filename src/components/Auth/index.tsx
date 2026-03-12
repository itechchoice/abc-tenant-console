/**
 * ConnectorAuth — universal MCP Server authorization component.
 *
 * Dispatches to one of two dialogs based on the server's authType:
 *  - OAUTH2          →  OAuth2AuthDialog   (popup-based OAuth2 flow)
 *  - API_KEY / BASIC
 *    / BEARER_TOKEN
 *    / CUSTOM        →  CredentialFormDialog (credential input form)
 *  - NONE            →  renders nothing (no auth required)
 *
 * Usage:
 * ```tsx
 * <ConnectorAuth
 *   open={open}
 *   server={selectedServer}
 *   authParams={userAuthParams}   // USER-level AuthParamConfig[]
 *   mode="user"                   // or "admin" for test-connection flow
 *   onSuccess={(connectionId) => { ... }}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */

import type { McpServer, AuthParamConfig } from '@/schemas/mcpManagerSchema';
import type { ConnectorAuthMode } from './useConnectorAuth';
import OAuth2AuthDialog from './OAuth2AuthDialog';
import CredentialFormDialog from './CredentialFormDialog';

export type { ConnectorAuthMode };
export { useConnectorAuth } from './useConnectorAuth';

export interface ConnectorAuthProps {
  open: boolean;
  server: McpServer | null;
  /** USER-level auth params — pass pre-fetched params or let the parent fetch them */
  authParams?: AuthParamConfig[];
  /** True while authParams are still loading — shows skeleton inside the form dialog */
  isLoadingParams?: boolean;
  /**
   * 'user'  → calls POST /mcp/user/servers/:id/auth
   * 'admin' → calls POST /mcp/admin/servers/:id/test-connection
   */
  mode?: ConnectorAuthMode;
  onSuccess?: (connectionId?: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export default function ConnectorAuth({
  open,
  server,
  authParams = [],
  isLoadingParams = false,
  mode = 'user',
  onSuccess,
  onError,
  onClose,
}: ConnectorAuthProps) {
  if (!server || !open) return null;

  const isOAuth2 = server.authType === 'OAUTH2';
  const isNone = server.authType === 'NONE';

  if (isNone) return null;

  const commonProps = {
    open,
    serverId: server.id,
    serverName: server.name,
    serverIcon: server.icon,
    authType: server.authType,
    authParams,
    isLoadingParams,
    mode,
    onSuccess,
    onError,
    onClose,
  };

  if (isOAuth2) {
    return <OAuth2AuthDialog {...commonProps} />;
  }

  return <CredentialFormDialog {...commonProps} />;
}

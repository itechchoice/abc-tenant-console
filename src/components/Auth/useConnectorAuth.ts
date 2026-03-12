import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';
import { submitUserCredentials, initiateUserOAuth2 } from '@/http/authConnectApi';

// Global dedup set — prevents the same postMessage from being processed twice
// across multiple hook instances (e.g. HMR, StrictMode double-mount).
const processedMessages = new Set<string>();

// ---------------------------------------------------------------------------
// Credential builder
// Translates a flat { paramKey → value } map into the nested credentials
// structure expected by the backend, based on each param's location field.
// ---------------------------------------------------------------------------

function buildCredentials(
  formValues: Record<string, string>,
  authParams: AuthParamConfig[],
): Record<string, unknown> {
  const headers: Record<string, string> = {};
  const queryParams: Record<string, string> = {};
  const body: Record<string, string> = {};

  for (const [paramKey, value] of Object.entries(formValues)) {
    if (!value) continue;
    const param = authParams.find((p) => p.paramKey === paramKey);
    if (!param) continue;

    // locationName is the actual key used in the HTTP request (e.g. "Authorization")
    const targetKey = param.locationName ?? param.paramKey;

    switch (param.location) {
      case 'HEADER':
        headers[targetKey] = value;
        break;
      case 'QUERY':
        queryParams[targetKey] = value;
        break;
      default:
        // BODY / COOKIE → flatten into top-level credentials
        body[param.paramKey] = value;
    }
  }

  const credentials: Record<string, unknown> = { ...body };
  if (Object.keys(headers).length > 0) credentials.headers = headers;
  if (Object.keys(queryParams).length > 0) credentials.queryParams = queryParams;
  return credentials;
}

// ---------------------------------------------------------------------------
// Hook interface
// ---------------------------------------------------------------------------

export type ConnectorAuthMode = 'user' | 'admin';

export interface UseConnectorAuthOptions {
  serverId: string;
  authType: string;
  /** USER-level auth param definitions — used to build the credentials object */
  authParams: AuthParamConfig[];
  /** 'user' calls /mcp/user/servers/:id/auth; 'admin' calls /mcp/admin/servers/:id/test-connection */
  mode?: ConnectorAuthMode;
  onSuccess?: (connectionId?: string) => void;
  onError?: (error: string) => void;
  /** Called when the dialog should be dismissed (success AND error paths) */
  onClose?: () => void;
}

export function useConnectorAuth({
  serverId,
  authType,
  authParams,
  mode = 'user',
  onSuccess,
  onError,
  onClose,
}: UseConnectorAuthOptions) {
  const [loading, setLoading] = useState(false);
  const authWindowRef = useRef<Window | null>(null);

  // -------------------------------------------------------------------------
  // Listen for OAuth2 popup postMessage callbacks
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, connectionId, error } = event.data as {
        type?: string;
        connectionId?: string;
        error?: string;
      };

      if (!type) return;

      const messageId = `${type}_${connectionId ?? Date.now()}`;
      if (processedMessages.has(messageId)) return;

      if (type === 'CONNECTOR_AUTH_SUCCESS') {
        processedMessages.add(messageId);
        setLoading(false);
        onClose?.();
        onSuccess?.(connectionId);
      } else if (type === 'CONNECTOR_AUTH_FAILED') {
        processedMessages.add(messageId);
        const msg = error ?? 'Authorization failed';
        toast.error(msg);
        setLoading(false);
        onClose?.();
        onError?.(msg);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError, onClose]);

  // Reset loading state when the target server changes
  useEffect(() => {
    setLoading(false);
  }, [serverId]);

  // -------------------------------------------------------------------------
  // OAuth2 flow — opens a popup window, waits for postMessage
  // -------------------------------------------------------------------------
  const handleOAuth2Auth = useCallback(async () => {
    if (!serverId) return;
    setLoading(true);

    try {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
      const callbackUrl = `${window.location.origin}${basePath}/connector-auth-callback`;

      // Step 4b: POST /mcp/user/servers/{id}/auth with returnUrl
      const result = await initiateUserOAuth2(serverId, { returnUrl: callbackUrl });

      if (result.redirectUrl) {
        const popup = window.open(
          result.redirectUrl,
          'oauth2_authorize',
          'width=620,height=720,scrollbars=yes,resizable=yes',
        );

        if (!popup) {
          toast.error('Popup blocked. Please allow popups for this site and try again.');
          setLoading(false);
          onClose?.();
          onError?.('Popup blocked');
          return;
        }

        authWindowRef.current = popup;
        toast.info('Redirecting to authorization page…');
        // Loading resolved by postMessage from ConnectorAuthCallback page
        // when backend redirects to returnUrl?auth=success&connectionId=xxx
      } else if (result.success) {
        setLoading(false);
        onClose?.();
        onSuccess?.(result.connectionId);
      } else {
        const msg = result.message ?? 'Authorization failed';
        toast.error(msg);
        setLoading(false);
        onClose?.();
        onError?.(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authorization failed';
      toast.error(msg);
      setLoading(false);
      onClose?.();
      onError?.(msg);
    }
  }, [serverId, onSuccess, onError, onClose]);

  // -------------------------------------------------------------------------
  // Non-OAuth2 flow — submit credentials directly
  // -------------------------------------------------------------------------
  const handleCredentialAuth = useCallback(
    async (formValues: Record<string, string>, connectionName?: string) => {
      if (!serverId) return;
      setLoading(true);

      try {
        const credentials = buildCredentials(formValues, authParams);

        let success = false;
        let connectionId: string | undefined;
        let errorMessage: string | undefined;

        // Step 4a: POST /mcp/mcp/user/servers/{id}/auth (non-OAuth2)
        const result = await submitUserCredentials(serverId, {
          credentials,
          connectionName: connectionName ?? (mode === 'admin' ? 'Admin Test' : 'My Connection'),
        });
        success = result.success ?? false;
        connectionId = result.connectionId;
        errorMessage = result.message;

        if (success) {
          setLoading(false);
          onClose?.();
          onSuccess?.(connectionId);
        } else {
          const msg = errorMessage ?? 'Connection failed';
          toast.error(msg);
          setLoading(false);
          onClose?.();
          onError?.(msg);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        toast.error(msg);
        setLoading(false);
        // Re-throw so CredentialFormDialog can distinguish form errors
        throw err;
      }
    },
    [serverId, authParams, mode, onSuccess, onError, onClose],
  );

  return {
    loading,
    authType,
    handleOAuth2Auth,
    handleCredentialAuth,
  };
}

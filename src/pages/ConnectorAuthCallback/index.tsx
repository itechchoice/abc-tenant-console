import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * ConnectorAuthCallback
 *
 * This page is the OAuth2 redirect target. After the third-party OAuth2
 * provider redirects here, we read the URL params, notify the opener window
 * via postMessage, and close this tab.
 *
 * Expected URL params (set by the backend after handling the OAuth callback):
 *   ?auth=success&connectionId=conn-xxxx   → success
 *   ?auth=error&error=<message>            → failure
 *   ?auth=failed&error=<message>           → failure
 */
export default function ConnectorAuthCallback() {
  const [searchParams] = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const auth = searchParams.get('auth');
    const connectionId = searchParams.get('connectionId');
    const errorMsg = searchParams.get('error') ?? 'Authorization failed';

    if (auth === 'success' && connectionId) {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'CONNECTOR_AUTH_SUCCESS', connectionId },
          window.location.origin,
        );
      }
    } else if (auth === 'error' || auth === 'failed') {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'CONNECTOR_AUTH_FAILED', error: errorMsg },
          window.location.origin,
        );
      }
    }

    // Give the postMessage a moment to be received before closing
    const timer = setTimeout(() => window.close(), 150);
    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="text-sm text-slate-500 font-medium">Processing authorization…</p>
        <p className="text-xs text-slate-400">This window will close automatically.</p>
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';
import { useConnectorAuth, type ConnectorAuthMode } from './useConnectorAuth';
import CredentialField from './CredentialField';

interface CredentialFormDialogProps {
  open: boolean;
  serverId: string;
  serverName: string;
  serverIcon?: string;
  authType: string;
  /** USER-level auth params to render as form fields */
  authParams: AuthParamConfig[];
  /** True while authParams are still being fetched */
  isLoadingParams?: boolean;
  mode?: ConnectorAuthMode;
  onSuccess?: (connectionId?: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

function ServerAvatar({ icon, name }: { icon?: string; name: string }) {
  if (icon && (icon.startsWith('http') || icon.startsWith('data:'))) {
    return (
      <img
        src={icon}
        alt={name}
        className="h-10 w-10 rounded-xl object-cover shadow-sm"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-base font-semibold text-slate-500">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CredentialFormDialog({
  open,
  serverId,
  serverName,
  serverIcon,
  authType,
  authParams,
  isLoadingParams = false,
  mode = 'user',
  onSuccess,
  onError,
  onClose,
}: CredentialFormDialogProps) {
  // Only USER-level params need to be filled by the user
  const userParams = useMemo(
    () => authParams.filter((p) => p.levelScope === 'USER'),
    [authParams],
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(userParams.map((p) => [p.paramKey, ''])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { loading, handleCredentialAuth } = useConnectorAuth({
    serverId,
    authType,
    authParams: userParams,
    mode,
    onSuccess,
    onError,
    onClose,
  });

  const handleChange = useCallback((paramKey: string, value: string) => {
    setValues((prev) => ({ ...prev, [paramKey]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[paramKey];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const param of userParams) {
      const val = values[param.paramKey] ?? '';
      if (param.isRequired && !val.trim()) {
        newErrors[param.paramKey] = `${param.paramName ?? param.paramKey} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [userParams, values]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    if (!validate()) return;
    try {
      await handleCredentialAuth(values);
    } catch {
      // Network / API errors already toasted inside the hook
    }
  }, [loading, validate, handleCredentialAuth, values]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="flex-row items-center gap-3 border-b px-6 py-5">
          <ServerAvatar icon={serverIcon} name={serverName} />
          <DialogTitle className="text-base font-semibold text-slate-900 leading-snug">
            Connect to {serverName}
          </DialogTitle>
        </DialogHeader>

        {/* Form fields */}
        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
          {isLoadingParams ? (
            /* Skeleton while auth params are being fetched */
            <div className="space-y-4 py-1">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : userParams.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No credentials required for this server.
            </p>
          ) : (
            userParams.map((param) => (
              <CredentialField
                key={param.paramKey}
                param={param}
                value={values[param.paramKey] ?? ''}
                error={errors[param.paramKey]}
                onChange={(v) => handleChange(param.paramKey, v)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t px-6 py-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading || isLoadingParams}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || isLoadingParams}
            className="min-w-[100px]"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting…</>
            ) : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

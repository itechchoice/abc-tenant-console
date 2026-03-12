import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ConnectorAuthMode } from './useConnectorAuth';
import { useConnectorAuth } from './useConnectorAuth';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';

interface OAuth2AuthDialogProps {
  open: boolean;
  serverId: string;
  serverName: string;
  serverIcon?: string;
  authType: string;
  authParams: AuthParamConfig[];
  mode?: ConnectorAuthMode;
  onSuccess?: (connectionId?: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

function ServerBrand({ icon, name }: { icon?: string; name: string }) {
  if (icon && (icon.startsWith('http') || icon.startsWith('data:'))) {
    return (
      <img
        src={icon}
        alt={name}
        className="h-14 w-14 rounded-2xl object-cover shadow"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-500">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function OAuth2AuthDialog({
  open,
  serverId,
  serverName,
  serverIcon,
  authType,
  authParams,
  mode = 'user',
  onSuccess,
  onError,
  onClose,
}: OAuth2AuthDialogProps) {
  const { loading, handleOAuth2Auth } = useConnectorAuth({
    serverId,
    authType,
    authParams,
    mode,
    onSuccess,
    onError,
    onClose,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden shadow-xl border-0 gap-0">
        <DialogTitle className="sr-only">Connect to {serverName}</DialogTitle>

        <div className="flex flex-col items-center gap-5 px-8 pb-8 pt-10">
          {/* Server brand icon */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <ServerBrand icon={serverIcon} name={serverName} />
          </motion.div>

          {/* Server name */}
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-lg font-semibold text-slate-900 tracking-tight"
          >
            {serverName}
          </motion.h2>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="text-center space-y-1.5"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              In order to use{' '}
              <span className="font-medium">{serverName}</span>
              {', '}authentication with the MCP server is required.
            </p>
            <p className="text-sm text-slate-500">
              Tap the button below to connect.
            </p>
          </motion.div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <Button
              onClick={handleOAuth2Auth}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#3b518a] hover:bg-[#2f4270] text-white font-medium tracking-wide active:scale-[0.98] transition-transform"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting…</>
              ) : 'Connect your account'}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

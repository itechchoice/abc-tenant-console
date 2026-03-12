import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { McpServer } from '@/schemas/mcpManagerSchema';
import { initiateOAuthConnect } from '@/http/mcpManagerApi';

interface ConnectDialogProps {
  server: McpServer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ServerBrand({ icon, name }: { icon?: string; name: string }) {
  if (icon && (icon.startsWith('http') || icon.startsWith('data:'))) {
    return (
      <img
        src={icon}
        alt={name}
        className="h-14 w-14 rounded-2xl object-cover shadow"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-600">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ConnectDialog({ server, open, onOpenChange }: ConnectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!server) return null;

  async function handleConnect() {
    if (!server) return;
    setLoading(true);
    setError(null);
    try {
      const returnUrl = window.location.href;
      await initiateOAuthConnect(server.id, returnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate connection. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden shadow-xl border-0">
        <DialogTitle className="sr-only">Connect to {server.name}</DialogTitle>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-5 px-8 pb-8 pt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <ServerBrand icon={server.icon} name={server.name} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              {server.name}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center space-y-1"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              In order to use{' '}
              <span className="font-medium">{server.name}</span>
              {', '}authentication with the MCP server is required.
            </p>
            <p className="text-sm text-slate-500">
              Tap the button below to connect.
            </p>
          </motion.div>

          {error && (
            <p className="text-xs text-rose-500 text-center">{error}</p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <Button
              className="w-full h-11 rounded-xl bg-[#1e3a6e] text-white hover:bg-[#162e5a] active:scale-[0.98] transition-transform font-medium tracking-wide"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Connect your account
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

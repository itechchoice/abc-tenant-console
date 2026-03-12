import { useCallback, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, ServerCog, GitBranch, BrainCircuit, ChartNoAxesCombined, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { path: '/', label: 'Chat', icon: MessageSquare },
  { path: '/mcp-manager', label: 'MCP Manager', icon: ServerCog },
  { path: '/model-manager', label: 'Model Manager', icon: BrainCircuit },
  { path: '/token-quota', label: 'Token Quota', icon: ChartNoAxesCombined },
  { path: '/workflows', label: 'Workflows', icon: GitBranch },
];

const COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);

  const isWorkflowEditor = location.pathname.startsWith('/workflow-editor');

  const toggle = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  if (isWorkflowEditor) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'flex flex-col h-dvh border-r bg-card shrink-0 transition-[width] duration-200',
          collapsed ? 'w-14' : 'w-52',
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          'flex items-center h-12 border-b shrink-0',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}>
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold shrink-0">
            A
          </div>
          {!collapsed && (
            <span className="ml-2 text-sm font-semibold truncate">AlphaBitCore</span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            const link = (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg mx-2 transition-colors',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'h-9 px-3',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t py-2 space-y-0.5">
          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { logout(); window.location.href = '/login'; }}
                className={cn(
                  'flex items-center gap-3 rounded-lg mx-2 transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'h-9 px-3 w-[calc(100%-16px)]',
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">Logout</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>Logout</TooltipContent>
            )}
          </Tooltip>

          {/* Collapse toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className={cn(
                  'flex items-center gap-3 rounded-lg mx-2 transition-colors text-muted-foreground hover:bg-accent hover:text-foreground',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'h-9 px-3 w-[calc(100%-16px)]',
                )}
              >
                {collapsed
                  ? <ChevronRight className="h-4 w-4 shrink-0" />
                  : <ChevronLeft className="h-4 w-4 shrink-0" />
                }
                {!collapsed && <span className="text-sm">Collapse</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>Expand</TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

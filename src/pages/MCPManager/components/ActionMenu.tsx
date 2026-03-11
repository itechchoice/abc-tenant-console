import { MoreHorizontal, Pencil, Trash2, Eye, Power, PowerOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { McpServer } from '@/schemas/mcpManagerSchema';

interface ActionMenuProps {
  mcp: McpServer;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onSync: () => void;
}

export default function ActionMenu({ mcp, onDetail, onEdit, onDelete, onToggleStatus, onSync }: ActionMenuProps) {
  const isActive = mcp.status === 'ACTIVE';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onDetail}>
          <Eye className="h-4 w-4 mr-2" />
          Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSync}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Tools
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isActive ? (
          <DropdownMenuItem onClick={onToggleStatus}>
            <PowerOff className="h-4 w-4 mr-2" />
            Disable
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onToggleStatus}>
            <Power className="h-4 w-4 mr-2" />
            Enable
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

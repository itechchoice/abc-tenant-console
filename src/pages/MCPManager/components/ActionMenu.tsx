import { MoreHorizontal, Pencil, Trash2, Eye, RefreshCw, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionMenuProps {
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
  onConnect?: () => void;
}

export default function ActionMenu({
  onDetail, onEdit, onDelete, onSync, onConnect,
}: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onDetail}>
          <Eye className="h-3.5 w-3.5 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSync}>
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          Sync Tools
        </DropdownMenuItem>
        {onConnect && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onConnect}>
              <Link2 className="h-3.5 w-3.5 mr-2" />
              Connect OAuth2
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

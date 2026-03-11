import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { POOL_STRATEGIES } from '@/schemas/modelManagerSchema';
import type { ModelPool } from '@/schemas/modelManagerSchema';

interface Props {
  pool: ModelPool;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PoolCard({ pool, onDetail, onEdit, onDelete }: Props) {
  const strategyLabel = POOL_STRATEGIES.find((s) => s.value === pool.strategy)?.label || pool.strategy;

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <h3 className="font-medium truncate">{pool.poolName}</h3>
            </div>
            <Badge variant="secondary" className="mt-1.5 text-[11px] px-1.5 py-0">{strategyLabel}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onDetail}><Eye className="h-4 w-4 mr-2" />Details</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onDetail}>Manage Members</Button>
        </div>
      </CardContent>
    </Card>
  );
}

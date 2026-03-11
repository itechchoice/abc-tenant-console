import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePoolMembers, useRemovePoolMember } from '../hooks/usePoolMembers';

interface Props { poolId: string }

export default function PoolMemberList({ poolId }: Props) {
  const { data: members = [], isLoading } = usePoolMembers(poolId);
  const removeMut = useRemovePoolMember();

  if (isLoading) return <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>;
  if (members.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">No members yet</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Model</TableHead>
          <TableHead className="text-center w-24">Priority</TableHead>
          <TableHead className="text-center w-24">Weight</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <span className="font-mono text-xs">{m.modelName}</span>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline" className="text-[10px]">{m.priority}</Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline" className="text-[10px]">{m.weight}</Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
                onClick={() => removeMut.mutate({ poolId, memberId: m.id })}
                disabled={removeMut.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

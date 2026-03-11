import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useMCPCategories } from '../hooks/useMCPCategories';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategoryMutations';

export default function CategoryTable() {
  const { data: categories, isLoading } = useMCPCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [newCode, setNewCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCreate = () => {
    if (!newCode.trim()) return;
    createMutation.mutate(newCode.trim(), { onSuccess: () => setNewCode('') });
  };

  const startEdit = (id: string, code: string) => {
    setEditingId(id);
    setEditValue(code);
  };

  const confirmEdit = () => {
    if (!editingId || !editValue.trim()) return;
    updateMutation.mutate({ id: editingId, code: editValue.trim() }, {
      onSuccess: () => setEditingId(null),
    });
  };

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New category code..."
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          className="text-sm"
        />
        <Button size="sm" onClick={handleCreate} disabled={!newCode.trim() || createMutation.isPending}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead className="w-20 text-center">Servers</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories?.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>
                {editingId === cat.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={confirmEdit}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm">{cat.code}</span>
                )}
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">
                {cat.serverCount ?? 0}
              </TableCell>
              <TableCell className="text-right">
                {editingId !== cat.id && (
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(cat.id, cat.code)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(cat.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

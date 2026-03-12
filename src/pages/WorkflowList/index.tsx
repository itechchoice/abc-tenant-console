import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, MoreHorizontal, Pencil, Trash2,
  ArrowUpCircle, ArrowDownCircle, FolderPlus, Folder,
  FolderOpen, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationPrevious, PaginationNext, PaginationLink, PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWorkflowList } from './hooks/useWorkflowList';
import {
  useCreateWorkflow, useDeleteWorkflow,
  usePublishWorkflow, useUnpublishWorkflow,
} from './hooks/useWorkflowMutations';
import {
  useGroupList, useCreateGroup, useUpdateGroup, useDeleteGroup,
  useAddWorkflowToGroup,
} from './hooks/useWorkflowGroups';
import type { WorkflowGroup } from '@/schemas/workflowEditorSchema';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  deleted: 'Deleted',
};

export default function WorkflowList() {
  const navigate = useNavigate();
  const {
    data, isLoading, page, setPage, pageSize, searchValue, setSearchValue,
    groupId, setGroupId,
  } = useWorkflowList();
  const createMutation = useCreateWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const publishMutation = usePublishWorkflow();
  const unpublishMutation = useUnpublishWorkflow();

  // Groups
  const { data: groupsData, isLoading: groupsLoading } = useGroupList();
  const createGroupMut = useCreateGroup();
  const updateGroupMut = useUpdateGroup();
  const deleteGroupMut = useDeleteGroup();
  const addToGroupMut = useAddWorkflowToGroup();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Create workflow dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', groupId: '' });

  // Group dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkflowGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<string | null>(null);

  const groups = groupsData?.items ?? [];

  const openCreateDialog = useCallback(() => {
    setCreateForm({ name: '', description: '', groupId: groupId ?? '' });
    setCreateDialogOpen(true);
  }, [groupId]);

  const handleCreateSubmit = useCallback(() => {
    if (!createForm.name.trim()) return;
    const selectedGroupId = createForm.groupId || undefined;
    createMutation.mutate(
      { name: createForm.name.trim(), description: createForm.description.trim() || undefined },
      {
        onSuccess: (wf) => {
          if (selectedGroupId) {
            addToGroupMut.mutate(
              { groupId: selectedGroupId, workflowId: wf.id },
              {
                onSettled: () => {
                  setCreateDialogOpen(false);
                  navigate(`/workflow-editor/${wf.id}`);
                },
              },
            );
          } else {
            setCreateDialogOpen(false);
            navigate(`/workflow-editor/${wf.id}`);
          }
        },
      },
    );
  }, [createMutation, createForm, navigate, addToGroupMut]);

  const openCreateGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupForm({ name: '', description: '' });
    setGroupDialogOpen(true);
  }, []);

  const openEditGroup = useCallback((g: WorkflowGroup) => {
    setEditingGroup(g);
    setGroupForm({ name: g.name, description: g.description ?? '' });
    setGroupDialogOpen(true);
  }, []);

  const handleGroupSave = useCallback(() => {
    if (!groupForm.name.trim()) return;
    if (editingGroup) {
      updateGroupMut.mutate(
        { id: editingGroup.id, payload: { name: groupForm.name, description: groupForm.description || undefined } },
        { onSuccess: () => setGroupDialogOpen(false) },
      );
    } else {
      createGroupMut.mutate(
        { name: groupForm.name, description: groupForm.description || undefined },
        { onSuccess: () => setGroupDialogOpen(false) },
      );
    }
  }, [editingGroup, groupForm, createGroupMut, updateGroupMut]);

  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | 'ellipsis')[] = [0];
    if (page > 2) pages.push('ellipsis');
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages - 2, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 3) pages.push('ellipsis');
    pages.push(totalPages - 1);
    return pages;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── Groups sidebar ─── */}
      <div className="w-56 shrink-0 border-r flex flex-col bg-muted/30">
        <div className="flex items-center justify-between px-3 py-3 border-b">
          <span className="text-sm font-medium">Groups</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openCreateGroup}>
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto py-1">
          <button
            onClick={() => setGroupId(undefined)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left',
              !groupId && 'bg-accent font-medium',
            )}
          >
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            All Workflows
          </button>
          {groupsLoading ? (
            <div className="px-3 py-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-7 rounded" />)}
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="group/item flex items-center">
                <button
                  onClick={() => setGroupId(g.id)}
                  className={cn(
                    'flex-1 flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left truncate',
                    groupId === g.id && 'bg-accent font-medium',
                  )}
                >
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{g.name}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 mr-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => openEditGroup(g)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteGroupTarget(g.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build and manage automated workflow pipelines
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No workflows found</p>
            <p className="text-sm mt-1">Create your first workflow to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
            {data.items.map((wf) => {
              const isPublished = wf.status === 'published';

              return (
                <Card key={wf.id} className="group transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            isPublished ? 'bg-emerald-500' : 'bg-amber-400',
                          )} />
                          <h3 className="font-medium truncate">{wf.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant={isPublished ? 'default' : 'secondary'} className="text-[11px]">
                            {STATUS_LABEL[wf.status] ?? wf.status}
                          </Badge>
                          {wf.version != null && (
                            <span className="text-xs text-muted-foreground">v{wf.version}</span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(`/workflow-editor/${wf.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {groups.length > 0 && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FolderPlus className="h-4 w-4 mr-2" />
                                Add to Group
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {groups.map((g) => (
                                  <DropdownMenuItem
                                    key={g.id}
                                    onClick={() => addToGroupMut.mutate({ groupId: g.id, workflowId: wf.id })}
                                  >
                                    <Folder className="h-3.5 w-3.5 mr-2" />
                                    {g.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          <DropdownMenuSeparator />
                          {isPublished ? (
                            <DropdownMenuItem onClick={() => unpublishMutation.mutate(wf.id)}>
                              <ArrowDownCircle className="h-4 w-4 mr-2" />
                              Unpublish
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => publishMutation.mutate(wf.id)}>
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {!isPublished && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(wf.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {wf.description && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{wf.description}</p>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/workflow-editor/${wf.id}`)}>
                        Open Editor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-auto pt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {total} workflow{total !== 1 ? 's' : ''} · Page {page + 1} of {Math.max(totalPages, 1)}
            </span>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(0, page - 1))}
                      className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((p, idx) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`e-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={page === p} onClick={() => setPage(p)} className="cursor-pointer">
                          {p + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>

      {/* ─── Delete workflow confirm ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The workflow and its definition will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete group confirm ─── */}
      <AlertDialog open={!!deleteGroupTarget} onOpenChange={(open) => { if (!open) setDeleteGroupTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the group. Workflows in this group will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteGroupTarget) {
                  deleteGroupMut.mutate(deleteGroupTarget, {
                    onSettled: () => {
                      setDeleteGroupTarget(null);
                      if (groupId === deleteGroupTarget) setGroupId(undefined);
                    },
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Create workflow dialog ─── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter' && createForm.name.trim()) handleCreateSubmit(); }}
                className="mt-1"
                placeholder="Workflow name"
                autoFocus
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1"
                placeholder="Optional description"
              />
            </div>
            {groups.length > 0 && (
              <div>
                <Label>Group</Label>
                <Select
                  value={createForm.groupId}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, groupId: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No group</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={!createForm.name.trim() || createMutation.isPending || addToGroupMut.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create/Edit group dialog ─── */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
                placeholder="Group name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1"
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleGroupSave}
              disabled={!groupForm.name.trim() || createGroupMut.isPending || updateGroupMut.isPending}
            >
              {(createGroupMut.isPending || updateGroupMut.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              {editingGroup ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

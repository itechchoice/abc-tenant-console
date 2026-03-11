import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';

export default function MCPManagerHeader() {
  const { searchValue, setSearchValue, openCreateDialog } = useMcpManagerStore();

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">MCP Server Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and configure MCP Server connections</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            className="pl-9 w-56"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create
        </Button>
      </div>
    </div>
  );
}

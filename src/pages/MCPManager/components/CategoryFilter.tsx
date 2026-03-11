import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import { useMCPCategories } from '../hooks/useMCPCategories';

export default function CategoryFilter() {
  const { selectedCategoryCode, setSelectedCategoryCode, openCategorySheet } = useMcpManagerStore();
  const { data: categories, isLoading } = useMCPCategories();

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge
        variant={selectedCategoryCode === '' ? 'default' : 'outline'}
        className="cursor-pointer select-none"
        onClick={() => setSelectedCategoryCode('')}
      >
        All
      </Badge>
      {categories?.map((cat) => (
        <Badge
          key={cat.id}
          variant={selectedCategoryCode === cat.code ? 'default' : 'outline'}
          className={cn('cursor-pointer select-none transition-colors')}
          onClick={() => setSelectedCategoryCode(
            selectedCategoryCode === cat.code ? '' : cat.code,
          )}
        >
          {cat.code}
          {cat.serverCount != null && (
            <span className="ml-1 text-[10px] opacity-70">({cat.serverCount})</span>
          )}
        </Badge>
      ))}
      <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={openCategorySheet}>
        <Settings2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

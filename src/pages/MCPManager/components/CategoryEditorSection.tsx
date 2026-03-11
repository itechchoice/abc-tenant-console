import { Badge } from '@/components/ui/badge';

interface CategoryEditorSectionProps {
  serverId: string;
  categories: string[];
}

export default function CategoryEditorSection({ categories }: CategoryEditorSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Categories</h4>
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((code) => (
            <Badge key={code} variant="secondary">
              {code}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No categories assigned</p>
      )}
    </div>
  );
}

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import CategoryTable from './CategoryTable';

export default function CategorySheet() {
  const { categorySheetOpen, closeCategorySheet } = useMcpManagerStore();

  return (
    <Sheet open={categorySheetOpen} onOpenChange={(open) => { if (!open) closeCategorySheet(); }}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Category Management</SheetTitle>
        </SheetHeader>
        <div className="p-6">
          <CategoryTable />
        </div>
      </SheetContent>
    </Sheet>
  );
}

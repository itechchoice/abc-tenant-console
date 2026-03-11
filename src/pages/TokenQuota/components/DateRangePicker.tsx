import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangePickerProps {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
}

export default function DateRangePicker({ start, end, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Start</Label>
        <Input
          type="date"
          value={start}
          onChange={(e) => onChange({ start: e.target.value, end })}
          className="w-[150px] h-8 text-sm"
        />
      </div>
      <span className="text-muted-foreground pb-1.5">—</span>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">End</Label>
        <Input
          type="date"
          value={end}
          onChange={(e) => onChange({ start, end: e.target.value })}
          className="w-[150px] h-8 text-sm"
        />
      </div>
    </div>
  );
}

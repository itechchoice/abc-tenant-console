const SKELETON_WIDTHS = [72, 88, 64, 80, 56, 92, 68, 76];

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col px-2 py-3">
      <div className="mb-3 ml-3 h-2.5 w-12 rounded-sm bg-muted/40 animate-pulse" />
      {SKELETON_WIDTHS.slice(0, 4).map((width) => (
        <div
          key={`sk-a-${width}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5"
        >
          <div className="h-4 w-4 shrink-0 rounded bg-muted/50 animate-pulse" />
          <div
            className="h-3 rounded-sm bg-muted/50 animate-pulse"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
      <div className="mt-4 mb-3 ml-3 h-2.5 w-16 rounded-sm bg-muted/40 animate-pulse" />
      {SKELETON_WIDTHS.slice(4).map((width) => (
        <div
          key={`sk-b-${width}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5"
        >
          <div className="h-4 w-4 shrink-0 rounded bg-muted/50 animate-pulse" />
          <div
            className="h-3 rounded-sm bg-muted/50 animate-pulse"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </div>
  );
}

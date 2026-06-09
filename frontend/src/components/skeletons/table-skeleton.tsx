import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ columns = 4, rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full rounded-md border", className)}>
      {/* Header */}
      <div className="flex w-full items-center justify-between border-b bg-muted/50 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-5 w-[15%]" />
        ))}
      </div>
      
      {/* Body Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex w-full items-center justify-between border-b p-4 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 w-[20%]" />
          ))}
        </div>
      ))}
    </div>
  );
}

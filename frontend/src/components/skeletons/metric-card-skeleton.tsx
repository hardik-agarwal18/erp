import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("relative overflow-hidden bg-card", className)}>
      <CardContent className="p-4 z-10 relative h-full flex flex-col justify-center">
        {/* Label */}
        <Skeleton className="h-3 w-1/3 mb-3" />
        
        {/* Value and Trend */}
        <div className="mt-1 flex items-end justify-between gap-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        {/* Detail */}
        <Skeleton className="h-4 w-2/3 mt-3" />
      </CardContent>
    </Card>
  );
}

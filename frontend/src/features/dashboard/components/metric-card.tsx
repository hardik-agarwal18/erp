"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  detail?: string;
  href?: string;
  sparkline?: ReactNode;
  visibleForRoles?: string[];
}

export function MetricCard({ label, value, trend, detail, href, sparkline }: MetricCardProps) {
  const content = (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 bg-card",
      href && "hover:shadow-md hover:border-border dark:hover:border-slate-700 cursor-pointer"
    )}>
      <CardContent className="p-4 z-10 relative h-full flex flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {trend !== undefined && (
            <Badge variant={trend >= 0 ? "success" : "danger"}>
              {trend >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
              {Math.abs(trend)}%
            </Badge>
          )}
        </div>
        {detail && <p className="mt-2 text-sm text-muted-foreground">{detail}</p>}
      </CardContent>
      {sparkline && (
        <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20 pointer-events-none z-0">
          {sparkline}
        </div>
      )}
    </Card>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}

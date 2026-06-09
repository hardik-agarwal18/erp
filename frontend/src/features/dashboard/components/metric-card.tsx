"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [timeframe, setTimeframe] = useState("last_month");

  const isCompareDetail = typeof detail === "string" && detail.startsWith("vs ");

  // Simulate a trend change based on timeframe selection just for visual feedback in the demo
  const displayTrend = trend !== undefined ? (
    timeframe === "last_quarter" ? Number((trend * 1.8).toFixed(1)) :
    timeframe === "15_days" ? Number((trend * 0.6).toFixed(1)) :
    timeframe === "7_days" ? Number((trend * 0.2).toFixed(1)) : trend
  ) : undefined;

  const content = (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 bg-card",
      href && "hover:shadow-md hover:border-border dark:hover:border-slate-700 cursor-pointer"
    )}>
      <CardContent className="p-4 z-10 relative h-full flex flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {displayTrend !== undefined && (
            <Badge variant={displayTrend >= 0 ? "success" : "danger"}>
              {displayTrend >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
              {Math.abs(displayTrend)}%
            </Badge>
          )}
        </div>
        {isCompareDetail ? (
          <div className="mt-2 flex items-center text-sm text-muted-foreground relative z-20">
            <span className="mr-1">vs</span>
            <select
              className="bg-transparent hover:text-foreground focus:outline-none focus:ring-0 cursor-pointer underline decoration-dashed underline-offset-2 appearance-none p-0 border-none font-medium"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="last_month">last month</option>
              <option value="last_quarter">last quarter</option>
              <option value="15_days">15 days</option>
              <option value="7_days">7 days</option>
            </select>
          </div>
        ) : (
          detail && <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        )}
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

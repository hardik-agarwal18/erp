"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface AlertWidgetItem {
  id: string | number;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeVariant?: "neutral" | "success" | "warning" | "danger" | "info";
  value?: string;
}

export interface AlertWidgetProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  items: AlertWidgetItem[];
}

export function AlertWidget({ title, description, icon, items }: AlertWidgetProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-3 flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
              <div className="min-w-0 pr-4">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
              </div>
              <div className="text-right shrink-0">
                {item.value && <p className="text-sm font-semibold text-foreground mb-1">{item.value}</p>}
                {item.badgeLabel && (
                  <Badge variant={item.badgeVariant || "neutral"}>{item.badgeLabel}</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

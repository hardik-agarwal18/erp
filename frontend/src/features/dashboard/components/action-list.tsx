"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export interface ActionListItem {
  id: string | number;
  title: string;
  detail?: string;
  timestamp?: string;
  href?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export interface ActionListProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  items: ActionListItem[];
  emptyMessage?: string;
}

export function ActionList({ title, description, icon, items, emptyMessage = "No items to display." }: ActionListProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const inner = (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.icon && <div className="shrink-0 text-muted-foreground">{item.icon}</div>}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    {item.detail && <p className="text-xs text-muted-foreground truncate">{item.detail}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.timestamp && <span className="text-xs text-muted-foreground">{item.timestamp}</span>}
                  {item.actions ? item.actions : item.href ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
                </div>
              </div>
            );

            if (item.href && !item.actions) {
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div key={item.id} className="rounded-lg border border-border bg-card p-3">
                {inner}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

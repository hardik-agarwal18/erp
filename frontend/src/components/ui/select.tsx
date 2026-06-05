import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn("h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 focus:border-slate-950", className)}
      {...props}
    >
      {children}
    </select>
  );
}

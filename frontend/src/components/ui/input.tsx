import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-950",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

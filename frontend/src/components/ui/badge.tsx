import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
  variants: {
    variant: {
      neutral: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      success: "bg-success/15 text-success dark:text-emerald-400 hover:bg-success/20",
      warning: "bg-warning/15 text-warning dark:text-amber-400 hover:bg-warning/20",
      danger: "bg-destructive/15 text-destructive dark:text-red-400 hover:bg-destructive/20",
      info: "bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}


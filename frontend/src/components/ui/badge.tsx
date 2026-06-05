import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold", {
  variants: {
    variant: {
      neutral: "bg-slate-100 text-slate-700",
      success: "bg-emerald-50 text-emerald-700",
      warning: "bg-amber-50 text-amber-700",
      danger: "bg-rose-50 text-rose-700",
      info: "bg-blue-50 text-blue-700",
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

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium font-mono uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        info: "border-transparent bg-primary/10 text-primary",
        success: "border-transparent bg-success/10 text-success",
        warn: "border-transparent bg-amber-500/15 text-amber-600",
        error: "border-transparent bg-destructive/10 text-red-600",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

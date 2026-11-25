import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Exhibit tags: square, hairline-bordered, wide-tracked caps. State colors only mark state.
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-gold bg-background text-foreground",
        solid: "border-primary bg-primary text-primary-foreground",
        outline: "border-border text-muted-foreground",
        ok: "border-ok bg-background text-ok",
        warn: "border-warn bg-background text-warn",
        bad: "border-bad bg-background text-bad",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

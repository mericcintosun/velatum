import * as React from "react";
import { cn } from "@/lib/utils";

// A card is a plinth: square corners, a LINE border and a gold hairline along the top edge.
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative rounded-none border border-border bg-card text-card-foreground before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gold",
        className
      )}
      {...props}
    />
  );
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-6", className)} {...props} />;
}
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-display text-2xl font-semibold leading-tight", className)} {...props} />;
}
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

/** Numbered exhibit label: "No. 3  Defenses". */
function CardLabel({ number, className, children, ...props }: React.ComponentProps<"p"> & { number: number }) {
  return (
    <p
      className={cn("flex items-baseline gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground", className)}
      {...props}
    >
      <span className="text-primary">No. {number}</span>
      <span>{children}</span>
    </p>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardLabel };

import * as React from "react";
import { cn } from "@/lib/utils";

/** A native range input in the museum treatment: hairline track, antique-gold thumb. */
function Slider({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="range"
      className={cn(
        "h-6 w-full cursor-pointer rounded-none bg-transparent accent-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
}

export { Slider };

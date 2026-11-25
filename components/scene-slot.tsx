import Image from "next/image";
import { hasBrandFile } from "@/lib/brand-files";
import { cn } from "@/lib/utils";

interface SceneSlotProps {
  n: 1 | 2 | 3 | 4 | 5 | 6;
  /** What the picture shows (not the section it sits in). */
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * One illustration slot. An uploaded public/brand/scene-{n}.png wins; otherwise the
 * hand-drawn SVG at public/illustrations/scene-{n}.svg renders. Call it with literal
 * values (n, alt, width, height): the image prompts are written from these tags.
 * Served unoptimized: the files are local and small, and SVG skips the optimizer anyway.
 */
export function SceneSlot({ n, alt, width, height, className }: SceneSlotProps) {
  const src = hasBrandFile(`scene-${n}`) ? `/brand/scene-${n}.png` : `/illustrations/scene-${n}.svg`;
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      priority={n === 1}
      className={cn("h-auto w-full max-w-full", className)}
    />
  );
}

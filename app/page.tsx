import { ExposureBench } from "@/components/exposure-bench";
import { SceneSlot } from "@/components/scene-slot";
import { CardLabel } from "@/components/ui/card";
import { parseBenchParams } from "@/lib/data";

// S1 single-surface: the home route IS the tool. L4 bento: six unequal cells, the claim
// inside the largest one, no lead paragraph above the grid. State lives in the URL
// (?runner=maya&zone=200&offset=0&trim=0) so a measured result has a link.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initial = parseBenchParams(await searchParams);

  return (
    <ExposureBench
      initial={initial}
      imageCell={
        <>
          <CardLabel number={5}>On display</CardLabel>
          <figure className="space-y-2">
            <SceneSlot
              n={1}
              alt="Two dozen running loops drawn in ink converge on a single small house, framed by a thin gold circle like an exhibit on a plinth"
              width={960}
              height={640}
              className="border border-border"
            />
            <figcaption className="text-xs leading-relaxed text-muted-foreground">
              Every loop begins at the same door. That repetition is the whole attack.
            </figcaption>
          </figure>
        </>
      }
    />
  );
}

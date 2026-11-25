// GET /api/runners: the public synthetic sample profiles, on the shared ApiResponse shape.
//
// Uploaded files are never posted here. This handler accepts no body and serves only the
// seeded synthetic runners. The page does not call it either: it reads the same data through
// lib/adapter.ts, because the product promise is zero fetches from the page.

import { fakeBenchAdapter } from "@/lib/adapter";
import { getAdapterMode } from "@/lib/adapter-mode";
import type { ApiResponse, RunnerSummary } from "@/lib/types";

export const dynamic = "force-static";

export function GET() {
  const body = {
    ok: true,
    mode: getAdapterMode(),
    data: fakeBenchAdapter.listRunners(),
  } satisfies ApiResponse<RunnerSummary[]>;
  return Response.json(body, { status: 200 });
}

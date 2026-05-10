import { ENRICHED_BRIEF } from "@/lib/seed/scenario";
import { startRun } from "@/lib/run-engine";

/**
 * POST /api/run
 *
 * Kicks off (or resumes) the Liaison orchestration for the demo brief.
 * Returns `{ runId }` immediately; the client connects to
 * `/api/run/[id]/stream` to consume FeedEvents as they're produced.
 *
 * Body: `{ runId?: string }` — defaults to "sarah-bakery-001" so the
 * existing pre-set URL keeps working.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_RUN_ID = "sarah-bakery-001";

export async function POST(request: Request): Promise<Response> {
  let runId = DEFAULT_RUN_ID;
  try {
    const body = (await request.json().catch(() => null)) as { runId?: string } | null;
    if (body?.runId && typeof body.runId === "string") {
      runId = body.runId;
    }
  } catch {
    // ignore — empty / non-JSON body
  }

  const session = startRun(runId, ENRICHED_BRIEF);
  return Response.json({
    runId: session.runId,
    startedAtMs: session.startedAtMs,
    bufferedEvents: session.events.length,
    done: session.done,
  });
}

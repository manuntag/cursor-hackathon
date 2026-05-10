import { ENRICHED_BRIEF } from "@/lib/seed/scenario";
import { getRun, startRun, subscribe } from "@/lib/run-engine";
import type { FeedEvent } from "@/lib/types";

/**
 * GET /api/run/[id]/stream
 *
 * Server-Sent Events stream of {@link FeedEvent}s for a run.
 *
 *   - If the run already exists, replay its buffered events first.
 *   - Then subscribe to new events as the orchestrator produces them.
 *   - Closes when the orchestrator finishes (or the client disconnects).
 *
 * If the runId hasn't been started yet (someone GETs the stream before
 * POSTing /api/run), we auto-start it with the seeded brief — convenient
 * for the demo URL which is reached by direct navigation.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: runId } = await ctx.params;

  const session = getRun(runId) ?? startRun(runId, ENRICHED_BRIEF);

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: FeedEvent | null) => {
        if (event === null) {
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          try {
            controller.close();
          } catch {
            // already closed
          }
          return;
        }
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Send a comment so proxies don't buffer the connection establishment.
      controller.enqueue(encoder.encode(`: connected runId=${runId}\n\n`));

      // 1. Catch up: replay all buffered events.
      for (const ev of session.events) send(ev);

      // 2. If the run is already done, emit done and close.
      if (session.done) {
        send(null);
        return;
      }

      // 3. Subscribe to live events.
      const unsubscribe = subscribe(session, send);

      // 4. Heartbeat every 15s so intermediaries don't time out the stream.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      // Called when the client disconnects.
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

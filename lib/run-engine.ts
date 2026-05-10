import { runOrchestrator } from "./orchestrator";
import type { EnrichedBrief, FeedEvent } from "./types";

/**
 * In-memory run registry. One {@link RunSession} per `runId`.
 *
 * The POST `/api/run` handler creates a session and kicks off the
 * orchestrator generator in the background. The GET `/api/run/[id]/stream`
 * handler subscribes to the session's event stream — late subscribers
 * receive the buffered events first, then live ones as they arrive.
 *
 * This is single-process state. Fine for the hackathon (single-tab demo);
 * production would back this with Redis or a per-tenant durable queue.
 */

export type RunSession = {
  runId: string;
  brief: EnrichedBrief;
  events: FeedEvent[];
  /** True once the orchestrator has finished (success or failure). */
  done: boolean;
  /** Error message if the orchestrator threw. */
  error?: string;
  /** Wall-clock millis when the run started. */
  startedAtMs: number;
  abort: AbortController;
  /** Subscribers receive each new event; `null` is the end-of-stream signal. */
  subscribers: Set<(event: FeedEvent | null) => void>;
};

const SESSIONS = new Map<string, RunSession>();

/**
 * Start (or resume) a run with the given id + brief. If a session already
 * exists for the id, return it instead of starting a second orchestrator —
 * lets the demo's pre-set URL (`/run/sarah-bakery-001`) safely re-trigger.
 */
export function startRun(runId: string, brief: EnrichedBrief): RunSession {
  const existing = SESSIONS.get(runId);
  if (existing) return existing;

  const session: RunSession = {
    runId,
    brief,
    events: [],
    done: false,
    startedAtMs: Date.now(),
    abort: new AbortController(),
    subscribers: new Set(),
  };
  SESSIONS.set(runId, session);

  // Fire-and-forget: drive the orchestrator generator. Awaiting here would
  // block the POST response; the orchestrator runs alongside the request.
  void drainOrchestrator(session);

  return session;
}

export function getRun(runId: string): RunSession | undefined {
  return SESSIONS.get(runId);
}

export function cancelRun(runId: string): void {
  const session = SESSIONS.get(runId);
  if (!session) return;
  session.abort.abort();
}

/**
 * Subscribe to a session. The callback fires for every future event, plus
 * a final `null` when the run ends. Returns an unsubscribe function.
 *
 * Buffered (past) events are NOT replayed here — the caller is expected to
 * read `session.events` first to catch up, then subscribe.
 */
export function subscribe(
  session: RunSession,
  cb: (event: FeedEvent | null) => void,
): () => void {
  session.subscribers.add(cb);
  return () => session.subscribers.delete(cb);
}

async function drainOrchestrator(session: RunSession): Promise<void> {
  try {
    for await (const ev of runOrchestrator(session.brief, { signal: session.abort.signal })) {
      session.events.push(ev);
      for (const cb of session.subscribers) cb(ev);
    }
  } catch (err) {
    session.error = err instanceof Error ? err.message : String(err);
    console.error(`run-engine: orchestrator for ${session.runId} failed`, err);
  } finally {
    session.done = true;
    for (const cb of session.subscribers) cb(null);
  }
}

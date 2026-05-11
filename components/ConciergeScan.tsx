"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CLUSTLY_AGENT_NAMES } from "@/lib/seed/clustly-agents";

type Phase = "idle" | "scanning" | "done";

type Props = {
  /** Placeholder shown in the input — the operator's slash command. */
  placeholder?: string;
  /** Display name of the agent the scan resolves to (the Liaison). */
  matchName: string;
  /** ms per agent during the scan. ~110ms is fast but readable. */
  stepMs?: number;
  /** Fires once when the scan finishes and the match card has revealed. */
  onDone?: () => void;
};

/**
 * Terminal-style step in the intake flow. An operator (or a Personal Agent)
 * types a slash command into the prompt, presses Send, and the system runs
 * a network scan over the registry — names whip past in a monospace ticker
 * until the platform converges on a match.
 *
 * The animation is purely presentational: the matched Liaison is hard-wired
 * via the matchName prop (it's the same Carter handle the demo's locked
 * decisions point to). The cycling names come from a real third-party agent-
 * registry export so the scan looks like a live sweep.
 */
export function ConciergeScan({
  placeholder = "/whiteclaw review the sarah_bakery_spec.md and propose a solution",
  matchName,
  stepMs = 110,
  onDone,
}: Props) {
  const [command, setCommand] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanIndex, setScanIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = CLUSTLY_AGENT_NAMES.length;

  const handleSend = () => {
    if (phase === "scanning") return;
    setScanIndex(0);
    setPhase("scanning");
  };

  // Drive the ticker: every stepMs, advance to the next candidate. When the
  // scan reaches the end of the list, hold for a beat, then flip to "done".
  useEffect(() => {
    if (phase !== "scanning") return;
    intervalRef.current = setInterval(() => {
      setScanIndex((i) => {
        if (i + 1 >= total) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // brief hold before revealing the match
          setTimeout(() => setPhase("done"), 420);
          return total - 1;
        }
        return i + 1;
      });
    }, stepMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, total, stepMs]);

  // Notify the parent exactly once when the scan transitions into "done" —
  // downstream steps (Liaison handoff card) gate their reveal on this signal.
  useEffect(() => {
    if (phase === "done") onDone?.();
  }, [phase, onDone]);

  // The visible ticker window — last ~8 candidates ending at scanIndex.
  // Older names scroll off the top; the current name is highlighted.
  const windowSize = 8;
  const visible = useMemo(() => {
    if (phase === "idle") return [] as string[];
    const start = Math.max(0, scanIndex - windowSize + 1);
    return CLUSTLY_AGENT_NAMES.slice(start, scanIndex + 1);
  }, [phase, scanIndex]);

  const evaluatedCount = phase === "idle" ? 0 : scanIndex + 1;

  return (
    <div className="concierge-scan" aria-live="polite">
      <div className="concierge-chrome">
        <span className="concierge-dot dot-red" aria-hidden />
        <span className="concierge-dot dot-amber" aria-hidden />
        <span className="concierge-dot dot-green" aria-hidden />
        <span className="concierge-chrome-label">
          agent concierge &middot; network scan
        </span>
        {phase === "scanning" ? (
          <span className="concierge-status">
            scanning {evaluatedCount} / {total}
          </span>
        ) : phase === "done" ? (
          <span className="concierge-status concierge-status-done">
            match found
          </span>
        ) : (
          <span className="concierge-status concierge-status-idle">ready</span>
        )}
      </div>

      <form
        className="concierge-prompt"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <span className="concierge-caret" aria-hidden>
          &gt;
        </span>
        <input
          type="text"
          className="concierge-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Slash command to dispatch to the agent concierge"
          disabled={phase === "scanning"}
        />
        <button
          type="submit"
          className="concierge-send"
          disabled={phase === "scanning"}
        >
          <span>Send</span>
          <span className="concierge-send-arrow" aria-hidden>
            &#9656;
          </span>
        </button>
      </form>

      {phase !== "idle" ? (
        <div className="concierge-output">
          <div className="concierge-output-label">
            evaluating candidates
            <span className="concierge-output-cursor" aria-hidden />
          </div>
          <ul className="concierge-ticker">
            {visible.map((name, i) => {
              const isCurrent =
                phase === "scanning" && i === visible.length - 1;
              return (
                <li
                  key={`${name}-${scanIndex - (visible.length - 1 - i)}`}
                  className={`concierge-ticker-row ${
                    isCurrent ? "is-current" : ""
                  }`}
                >
                  <span className="concierge-ticker-arrow" aria-hidden>
                    &rsaquo;
                  </span>
                  <span className="concierge-ticker-name">{name}</span>
                  {isCurrent ? (
                    <span className="concierge-ticker-tag">evaluating</span>
                  ) : (
                    <span className="concierge-ticker-tag concierge-ticker-tag-skipped">
                      skipped
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {phase === "done" ? (
            <div className="concierge-match">
              <span className="concierge-match-glyph" aria-hidden>
                &#10003;
              </span>
              <div>
                <div className="concierge-match-label">
                  Match &middot; best fit for this brief
                </div>
                <div className="concierge-match-name">{matchName}</div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

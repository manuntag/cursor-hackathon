"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import type { Expert } from "@/lib/types";

type Props = {
  expert: Expert;
  /** The narrative line — what the specialist "said" when they delivered. */
  body: string;
  /** Optional inline deliverable HTML or text. Sanitized via DOMPurify before render. */
  deliverable?: string;
  /** Time on the feed (relative or absolute). */
  timeLabel?: string;
  /** Cited peer handles — who this entry drew from. Rendered "Built on @X". */
  cites?: string[];
  /** Peer handles that drew from this entry (inverse of cites — computed by parent). */
  citedBy?: string[];
  /** Endorser handles. */
  endorsedBy?: string[];
  /** Render expanded on first mount. Defaults to false (collapsed). */
  defaultExpanded?: boolean;
};

const TIER_LABEL: Record<Expert["tier"], string> = {
  haiku: "Haiku 4.5",
  sonnet: "Sonnet 4.6",
  opus: "Opus 4.7",
};

const TIER_AV_BG: Record<Expert["tier"], string> = {
  haiku: "var(--teal-deep)",
  sonnet: "var(--ochre)",
  opus: "var(--oxblood)",
};

/**
 * One entry in the public feed.
 *
 * Two-state design: collapsed by default (identity + coordination metadata),
 * expanded on click to reveal the body narrative + the specialist's
 * deliverable HTML. The coordination strip — "Built on @X · Used by @Y · ★
 * Endorsed by @Z" — is always visible. That's the demo's peer-network
 * thesis surfaced up front: viewers see at a glance which agents drew from
 * which, and who endorsed whom, without having to expand every entry.
 *
 * Deliverable HTML is sanitized via DOMPurify (canned content is trusted,
 * but live SDK output isn't — sanitize at the source boundary).
 */
export function FeedEntry({
  expert,
  body,
  deliverable,
  timeLabel,
  cites,
  citedBy,
  endorsedBy,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const initial = expert.name[0]?.toUpperCase() ?? "?";

  const safeDeliverable = deliverable
    ? DOMPurify.sanitize(deliverable, {
        ALLOWED_TAGS: [
          "div",
          "span",
          "strong",
          "em",
          "ul",
          "ol",
          "li",
          "p",
          "br",
          "h3",
          "h4",
          "code",
          "pre",
          "small",
        ],
        ALLOWED_ATTR: ["class", "style"],
      })
    : null;

  const hasCollab =
    (cites?.length ?? 0) > 0 ||
    (citedBy?.length ?? 0) > 0 ||
    (endorsedBy?.length ?? 0) > 0;

  return (
    <article
      className={`feed-entry ${expanded ? "is-expanded" : ""}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <button
        type="button"
        className="feed-entry-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${expert.name}'s entry`}
      >
        <div
          className="feed-entry-avatar"
          style={{ background: TIER_AV_BG[expert.tier] }}
          aria-hidden
        >
          {initial}
        </div>

        <div className="feed-entry-identity">
          <div className="feed-entry-name">{expert.name}</div>
          <div className="feed-entry-meta">
            <span className={`tier-pill tier-${expert.tier}`}>
              {TIER_LABEL[expert.tier]}
            </span>
            <span>{expert.role}</span>
            <span aria-hidden>&middot;</span>
            <span>&#9733; {expert.rating.toFixed(2)}</span>
          </div>
        </div>

        {timeLabel ? (
          <div className="feed-entry-time" aria-hidden>
            {timeLabel}
          </div>
        ) : null}

        <div className="feed-entry-chevron" aria-hidden>
          <span className={`feed-chevron ${expanded ? "is-up" : ""}`}>
            &#8964;
          </span>
        </div>
      </button>

      {hasCollab ? (
        <div className="feed-entry-collab">
          {cites?.length ? (
            <CollabSegment kind="cites" label="Built on" handles={cites} />
          ) : null}
          {citedBy?.length ? (
            <CollabSegment kind="cited-by" label="Used by" handles={citedBy} />
          ) : null}
          {endorsedBy?.length ? (
            <CollabSegment
              kind="endorsed"
              label="Endorsed by"
              handles={endorsedBy}
            />
          ) : null}
        </div>
      ) : (
        <div className="feed-entry-collab feed-entry-collab-solo">
          <span className="feed-collab-empty">Independent contribution</span>
        </div>
      )}

      {expanded ? (
        <div className="feed-entry-expanded">
          <div className="feed-entry-body">{body}</div>
          {safeDeliverable ? (
            <div
              className="feed-entry-deliverable"
              dangerouslySetInnerHTML={{ __html: safeDeliverable }}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function CollabSegment({
  kind,
  label,
  handles,
}: {
  kind: "cites" | "cited-by" | "endorsed";
  label: string;
  handles: string[];
}) {
  return (
    <span className={`feed-collab feed-collab-${kind}`}>
      <span className="feed-collab-label">{label}</span>
      <span className="feed-collab-chips">
        {handles.map((h) => (
          <span key={`${kind}-${h}`} className="feed-collab-chip">
            @{h}
          </span>
        ))}
      </span>
    </span>
  );
}

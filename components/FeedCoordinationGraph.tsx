"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export type CoordinationEdge = {
  /** Handle that initiates the edge — for cites, the citer; for endorses, the endorser. */
  from: string;
  /** Handle that receives the edge — for cites, the cited; for endorses, the endorsed. */
  to: string;
  kind: "cite" | "endorse";
};

type RenderedEdge = {
  id: string;
  d: string;
  kind: "cite" | "endorse";
  /** Min Y of the edge — used for top-to-bottom stagger ordering. */
  topY: number;
};

type Props = {
  /** The relative-positioned container that wraps the feed list. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Live map of card handles → DOM nodes. Mutated by the parent's callback refs. */
  cardRefs: RefObject<Map<string, HTMLElement | null>>;
  /** Directed edges to draw. */
  edges: CoordinationEdge[];
};

/**
 * SVG overlay that draws coordination edges (citations + endorsements) between
 * feed cards. The graph turns the chip metadata ("Built on @X · Used by @Y")
 * into actual visible curves that arc out to the left of the card stack —
 * making the peer-network thesis legible at a glance.
 *
 * Layout robustness: a single ResizeObserver watches the container *and* every
 * card; any reflow (expand, deliverable load, viewport resize) recomputes
 * anchor coordinates so the lines stay docked to the cards' left-edge spines.
 *
 * Reveal animation: IntersectionObserver fires once when the feed scrolls into
 * view. Cite edges draw via `stroke-dashoffset` (the `pathLength="100"` trick
 * normalizes any geometry to a 0–100 sweep). Endorse edges keep a permanent
 * dotted pattern and reveal via `stroke-opacity` instead, since the two uses
 * of `stroke-dasharray` would otherwise conflict.
 *
 * Reduced-motion: edges render in their final state immediately, no animation.
 */
export function FeedCoordinationGraph({
  containerRef,
  cardRefs,
  edges,
}: Props) {
  const [paths, setPaths] = useState<RenderedEdge[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(false);
  const roRef = useRef<ResizeObserver | null>(null);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();

    // Record each card's container-relative box so we can compute anchor
    // points on any side (not just the left edge).
    type Box = { left: number; right: number; top: number; bottom: number; midX: number; midY: number };
    const boxes = new Map<string, Box>();
    cardRefs.current?.forEach((el, handle) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = r.left - cRect.left;
      const top = r.top - cRect.top;
      boxes.set(handle, {
        left,
        right: left + r.width,
        top,
        bottom: top + r.height,
        midX: left + r.width / 2,
        midY: top + r.height / 2,
      });
    });

    // Detect column layout — if more than one unique left edge appears, we're
    // in multi-column mode and lines should route through the column gap. In
    // single-column mode every card has the same left edge and we fall back
    // to left-gutter routing.
    const lefts = new Set<number>();
    boxes.forEach((b) => lefts.add(Math.round(b.left)));
    const multiCol = lefts.size > 1;
    const wrapMidX = cRect.width / 2;

    type Side = "left" | "right" | "top" | "bottom";
    const anchorPoint = (b: Box, side: Side) => {
      switch (side) {
        case "left":
          return { x: b.left, y: b.midY };
        case "right":
          return { x: b.right, y: b.midY };
        case "top":
          return { x: b.midX, y: b.top };
        case "bottom":
          return { x: b.midX, y: b.bottom };
      }
    };
    const controlPoint = (a: { x: number; y: number }, side: Side, offset: number) => {
      switch (side) {
        case "left":
          return { x: a.x - offset, y: a.y };
        case "right":
          return { x: a.x + offset, y: a.y };
        case "top":
          return { x: a.x, y: a.y - offset };
        case "bottom":
          return { x: a.x, y: a.y + offset };
      }
    };

    const pickSides = (s: Box, t: Box): { sSide: Side; tSide: Side } => {
      if (!multiCol) {
        // Single-column fallback — both anchors on the left, lines arc out
        // into the left margin.
        return { sSide: "left", tSide: "left" };
      }
      // Multi-column: route through the column gap. Each card's "inner" side
      // is whichever faces the page midline.
      const sInner: Side = s.midX < wrapMidX ? "right" : "left";
      const tInner: Side = t.midX < wrapMidX ? "right" : "left";
      return { sSide: sInner, tSide: tInner };
    };

    const rendered: RenderedEdge[] = [];
    edges.forEach((e, i) => {
      const s = boxes.get(e.from);
      const t = boxes.get(e.to);
      if (!s || !t) return;

      const { sSide, tSide } = pickSides(s, t);
      const sa = anchorPoint(s, sSide);
      const ta = anchorPoint(t, tSide);

      // Curve bulge: scale with the longer dimension of the connection, but
      // cap so far edges don't balloon. Endorse lines get a bigger offset so
      // they sit visibly outside any parallel cite line between the same pair.
      const span = Math.max(Math.abs(ta.x - sa.x), Math.abs(ta.y - sa.y));
      const base = Math.min(110, Math.max(40, span * 0.45));
      const bulge = e.kind === "endorse" ? base + 22 : base;

      const sc = controlPoint(sa, sSide, bulge);
      const tc = controlPoint(ta, tSide, bulge);

      const d = `M ${sa.x} ${sa.y} C ${sc.x} ${sc.y}, ${tc.x} ${tc.y}, ${ta.x} ${ta.y}`;
      rendered.push({
        id: `${e.kind}-${e.from}-${e.to}-${i}`,
        d,
        kind: e.kind,
        topY: Math.min(sa.y, ta.y),
      });
    });

    // Top-to-bottom stagger — edges whose earliest endpoint is highest
    // reveal first. Matches the eye's natural downward scan.
    rendered.sort((a, b) => a.topY - b.topY);

    setPaths(rendered);
    setSize({ w: cRect.width, h: cRect.height });
  }, [edges, containerRef, cardRefs]);

  // Observe the container + every card; any size/position change triggers
  // a recompute so curves track cards through expand/collapse.
  useLayoutEffect(() => {
    recompute();
    const ro = new ResizeObserver(() => recompute());
    roRef.current = ro;
    const container = containerRef.current;
    if (container) ro.observe(container);
    cardRefs.current?.forEach((el) => {
      if (el) ro.observe(el);
    });
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
    };
  }, [recompute, containerRef, cardRefs]);

  // Trigger reveal once when the feed first comes into view.
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(c);
    return () => io.disconnect();
  }, [containerRef]);

  if (size.w === 0 || size.h === 0) return null;

  return (
    <svg
      className={`feed-coordination-graph ${active ? "is-active" : ""}`}
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {paths.map((p, i) => {
        const delay = `${0.08 * i + 0.1}s`;
        return (
          <path
            key={p.id}
            d={p.d}
            pathLength={p.kind === "cite" ? 100 : undefined}
            className={`feed-coord-edge feed-coord-edge-${p.kind}`}
            style={{ transitionDelay: delay, animationDelay: delay }}
          />
        );
      })}
    </svg>
  );
}

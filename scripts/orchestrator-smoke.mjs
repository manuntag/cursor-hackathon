process.env.LIAISON_MOCK = "1";
const { runOrchestrator } = await import("../lib/orchestrator.ts");
const { ENRICHED_BRIEF } = await import("../lib/seed/scenario.ts");

let n = 0;
for await (const ev of runOrchestrator(ENRICHED_BRIEF, { stubDelayMs: 50 })) {
  n++;
  const preview =
    ev.type === "post"
      ? `${ev.handle}: ${ev.body.slice(0, 60).replace(/\n/g, " ")}...`
      : ev.type === "summary"
        ? `spent=$${(ev.spentCents / 100).toFixed(2)} naive=$${(ev.naiveCents / 100).toFixed(2)} saved=${ev.savedPct.toFixed(1)}%`
        : ev.type === "decompose"
          ? `${ev.items.length} items`
          : ev.type === "select"
            ? `${ev.itemId} -> ${ev.handle}`
            : ev.type === "brief"
              ? `${ev.text.slice(0, 50).replace(/\n/g, " ")}...`
              : "";
  console.log(`[${String(n).padStart(2, "0")}] ${ev.type.padEnd(10)} ${preview}`);
}

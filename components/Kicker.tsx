/**
 * Small uppercase mono kicker with a trailing rule. Matches the .kicker
 * utility in globals.css. Use above section headings.
 */
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="kicker mt-14">
      <span>{children}</span>
    </div>
  );
}

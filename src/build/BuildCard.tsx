import { useState } from "react";

export function BuildCard() {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const agent = window.helix;
    if (!agent || busy) return;
    setBusy(true);
    try {
      const result = await agent.benchmark();
      setNote(result.ok ? `Cottage built in ${result.ms} ms. ${result.operations} ops, cost ${result.cost}.` : result.issues.map((issue) => issue.message).join(" ") || "The cottage did not pass.");
    } catch {
      setNote("The build API did not answer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h2 className="text-xs tracking-wide text-muted uppercase">Build</h2>
        <p className="mt-1 text-xs text-muted">Agents construct from the world state, not from clicks. A batch commits once, or rolls back if a wall collides.</p>
      </div>
      <pre className="overflow-auto rounded-md bg-bg p-2 font-mono text-xs text-fg">{`await helix.build([
  { op: "room", id: "hall", x: -4, z: -3, width: 8, depth: 6, door: "south" }
])`}</pre>
      <button type="button" className="h-10 w-full rounded-md bg-accent text-sm font-medium text-accent-ink disabled:opacity-50" disabled={busy} onClick={() => void run()}>
        {busy ? "Building…" : "Build the cottage"}
      </button>
      {note ? <p className="px-1 text-xs text-muted">{note}</p> : null}
    </section>
  );
}

import { useState } from "react";

export function AgentCard() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const sample = async () => {
    const agent = window.helix;
    if (!agent || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const result = await agent.run([
        { op: "clear" },
        { op: "scene", name: "Bot yard" },
        { op: "place", id: "gate", asset: "knight", x: 2, z: -2, yaw: 180 },
        { op: "place", id: "hoard", asset: "Treasure chest", x: -2, z: -2 },
        {
          op: "story",
          beats: [{ title: "The gate", body: "The knight does not move. The chest does.", kind: "setup", speaker: "Yard" }],
        },
      ]);
      setStatus(result.ok ? `Placed ${result.applied} commands. Scene is “${result.scene.name}”.` : result.errors.map((error) => error.error).join(" "));
    } catch {
      setStatus("The agent bridge did not answer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h2 className="text-xs tracking-wide text-muted uppercase">For bots</h2>
        <p className="mt-1 text-xs text-muted">
          Game bots drive this page through <span className="font-mono text-fg">window.helix</span>. Read the catalog, place by title, then read the scene back.
        </p>
      </div>
      <pre className="overflow-auto rounded-md bg-bg p-2 font-mono text-xs text-fg">{`await helix.run([
  { op: "place", id: "gate", asset: "knight", x: 2, z: -2 }
])`}</pre>
      <div className="flex gap-1">
        <button type="button" className="h-10 flex-1 rounded-md border border-line text-sm text-fg disabled:opacity-50" disabled={busy} onClick={() => void sample()}>
          {busy ? "Running…" : "Run the sample"}
        </button>
        <a className="inline-flex h-10 items-center rounded-md border border-line px-3 text-sm text-fg" href="/agent/schema.json" target="_blank" rel="noreferrer">
          Schema
        </a>
      </div>
      {status ? <p className="px-1 text-xs text-muted">{status}</p> : null}
    </section>
  );
}

import { useEffect, useState } from "react";
import { applyPlan } from "./applyPlan";
import { directScene } from "./direct";
import type { LibraryAsset } from "./ModelShelf";

const STARTS = [
  "A night watch: a dragon overhead, a knight at the gate, and a chest that should not be opened.",
  "A cottage road at dusk, with a wolf, a horse, a campfire, and a pine.",
  "Pirates camped under a watchtower, shields up, a ghost in the doorway.",
];

export function Director() {
  const [catalog, setCatalog] = useState<LibraryAsset[]>([]);
  const [prompt, setPrompt] = useState(STARTS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/library/manifest.json")
      .then((response) => response.json())
      .then((data: { assets?: LibraryAsset[] }) => {
        if (live) setCatalog(Array.isArray(data.assets) ? data.assets : []);
      })
      .catch(() => {
        if (live) setError("The model catalog did not load.");
      });
    return () => {
      live = false;
    };
  }, []);

  const run = async () => {
    const next = prompt.trim();
    if (next.length < 8 || busy || catalog.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const result = await directScene({
        data: {
          prompt: next,
          catalog: catalog.map((asset) => ({ id: asset.id, title: asset.title, category: asset.category })),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      applyPlan(result.plan, catalog);
    } catch {
      setError("The director did not answer. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h2 className="text-xs tracking-wide text-muted uppercase">Director</h2>
        <p className="mt-1 text-xs text-muted">Describe the game. Grok places catalog models and writes the beats. The warden stays so you can walk it.</p>
      </div>
      <textarea
        aria-label="Scene prompt"
        className="h-24 w-full resize-none rounded-md border border-line bg-bg px-2 py-2 text-sm text-fg outline-none focus:border-accent"
        value={prompt}
        maxLength={500}
        disabled={busy}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <div className="flex flex-wrap gap-1">
        {STARTS.map((line) => (
          <button
            key={line}
            type="button"
            className="h-10 max-w-full truncate rounded-md border border-line px-2 text-left text-xs text-muted"
            disabled={busy}
            onClick={() => setPrompt(line)}
          >
            {line.split(":")[0]}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="h-10 w-full rounded-md bg-accent text-sm font-medium text-accent-ink disabled:opacity-50"
        disabled={busy || catalog.length === 0 || prompt.trim().length < 8}
        onClick={() => void run()}
      >
        {busy ? "Directing…" : "Direct this scene"}
      </button>
      {error ? <p className="px-1 text-xs text-accent">{error}</p> : null}
    </section>
  );
}

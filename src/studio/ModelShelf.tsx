import { useEffect, useMemo, useState, type DragEvent } from "react";
import type { DragPayload } from "./catalog";
import { modelEntity, placeInScene } from "./place";

export type LibraryAsset = {
  id: string;
  title: string;
  category: string;
  summary: string;
  src: string;
  thumb: string;
  fit: number;
};

type Manifest = {
  license: string;
  assets: LibraryAsset[];
};

function dragStart(event: DragEvent, payload: DragPayload) {
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "copy";
}

export function ModelShelf({ onPlaced }: { onPlaced?: () => void }) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/library/manifest.json")
      .then((response) => response.json())
      .then((data: Manifest) => {
        if (live) setAssets(Array.isArray(data.assets) ? data.assets : []);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const categories = useMemo(() => ["All", ...new Set(assets.map((asset) => asset.category))], [assets]);
  const shown = assets.filter((asset) => {
    if (category !== "All" && asset.category !== category) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return `${asset.title} ${asset.category} ${asset.summary}`.toLowerCase().includes(needle);
  });

  const place = (asset: LibraryAsset, x: number, z: number) => {
    placeInScene(modelEntity(asset.title, asset.src, asset.fit, x, z));
    onPlaced?.();
  };

  const dropSet = () => {
    const list = shown.slice(0, 8);
    list.forEach((asset, index) => place(asset, 5 + (index % 4) * 2.2, -5 - Math.floor(index / 4) * 2.2));
  };

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h2 className="text-xs tracking-wide text-muted uppercase">Catalog</h2>
        <p className="mt-1 text-xs text-muted">
          {assets.length} CC0 models the director can place. Search if you want to drop one by hand.
        </p>
      </div>
      <input
        className="h-10 w-full rounded-md border border-line bg-bg px-2 text-sm text-fg outline-none focus:border-accent"
        aria-label="Search models"
        placeholder="Search dragon, sword, cottage…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex gap-1 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={
              category === item
                ? "h-8 shrink-0 rounded-md bg-accent px-2 text-xs font-medium text-accent-ink"
                : "h-8 shrink-0 rounded-md border border-line px-2 text-xs text-muted"
            }
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {shown.length > 0 ? (
        <button type="button" className="h-10 w-full rounded-md border border-line text-sm text-fg" onClick={dropSet}>
          Drop this set on the ground
        </button>
      ) : null}
      {failed ? <p className="px-1 text-xs text-muted">The model library did not load.</p> : null}
      {!failed && assets.length === 0 ? <p className="px-1 text-xs text-muted">Loading models…</p> : null}
      {shown.length === 0 && assets.length > 0 ? <p className="px-1 text-xs text-muted">Nothing matches that search.</p> : null}
      <div className="space-y-1">
        {shown.map((asset) => (
          <article
            key={asset.id}
            draggable
            onDragStart={(event) => dragStart(event, { kind: "model", title: asset.title, src: asset.src, fit: asset.fit })}
            className="flex items-center gap-2 rounded-md border border-line bg-bg p-1.5"
          >
            {asset.thumb ? (
              <img src={asset.thumb} alt="" className="h-12 w-12 shrink-0 rounded-md bg-raised object-cover" />
            ) : (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-raised text-xs text-muted">3D</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-fg">{asset.title}</div>
              <div className="text-xs text-muted">{asset.category}</div>
            </div>
            <button
              type="button"
              className="h-10 shrink-0 rounded-md bg-raised px-2 text-xs text-fg"
              onClick={() => place(asset, 4 + (assets.indexOf(asset) % 5) * 0.4, -4)}
            >
              Add
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

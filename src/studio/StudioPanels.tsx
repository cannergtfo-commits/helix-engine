import { useState, type DragEvent, type ReactNode } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, Wallet } from "lucide-react";
import { useEditor } from "@/editor/store";
import type { Component, StoryKind } from "@/engine";
import {
  CATALOG,
  CLIP_NOTES,
  FIELD_CLIPS,
  KITS,
  RITUAL_CLIPS,
  chainLabel,
  standardLabel,
  type CatalogItem,
  type DragPayload,
  type UserAsset,
} from "./catalog";
import { applyClip, bindChainToSelection, chainProp, entityFromDrag, placeInScene } from "./place";
import { ModelShelf } from "./ModelShelf";
import { shortAddress, useWallet } from "./wallet";

export type Workspace = "design" | "story" | "concept" | "chain";

const field =
  "h-10 w-full rounded-md border border-line bg-bg px-2 text-sm text-fg outline-none focus:border-accent disabled:opacity-50";

export function WorkspaceBar({ value, onChange }: { value: Workspace; onChange: (value: Workspace) => void }) {
  const items: Array<[Workspace, string]> = [
    ["design", "Design"],
    ["story", "Story"],
    ["concept", "Concept"],
    ["chain", "Chain"],
  ];
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-bg px-2">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={
            value === id
              ? "h-8 shrink-0 rounded-md bg-accent px-3 text-sm font-medium text-accent-ink"
              : "h-8 shrink-0 rounded-md px-3 text-sm text-muted hover:bg-raised hover:text-fg"
          }
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function dragStart(event: DragEvent, payload: DragPayload) {
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "copy";
}

function placePayload(payload: DragPayload, onPlaced?: () => void) {
  if (payload.kind === "clip") {
    applyClip(payload.clip);
    return;
  }
  const count = useEditor.getState().doc.entities.length;
  const entity = entityFromDrag(payload, ((count % 5) - 2) * 0.9, 0.4);
  if (!entity) return;
  placeInScene(entity);
  onPlaced?.();
}

export function Library({ onPlaced }: { onPlaced?: () => void }) {
  const assets = useWallet((state) => state.assets);
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto px-2 py-3">
      <ModelShelf onPlaced={onPlaced} />
      <p className="px-1 text-xs text-muted">Or drag a block character, a clip, or a simple prop. Tap Add if dragging is awkward.</p>
      <Section title="Characters">
        {KITS.map((kit) => (
          <Card
            key={kit.id}
            title={kit.name}
            detail={kit.blurb}
            payload={{ kind: "character", kit: kit.id }}
            onAdd={() => placePayload({ kind: "character", kit: kit.id }, onPlaced)}
            swatch={kit.accent}
          />
        ))}
      </Section>
      <Section title="Field set">
        {FIELD_CLIPS.map((clip) => (
          <Card
            key={clip}
            title={CLIP_NOTES[clip].name}
            detail={CLIP_NOTES[clip].blurb}
            payload={{ kind: "clip", clip }}
            action="Apply"
            onAdd={() => applyClip(clip)}
          />
        ))}
      </Section>
      <Section title="Ritual set">
        {RITUAL_CLIPS.map((clip) => (
          <Card
            key={clip}
            title={CLIP_NOTES[clip].name}
            detail={CLIP_NOTES[clip].blurb}
            payload={{ kind: "clip", clip }}
            action="Apply"
            onAdd={() => applyClip(clip)}
          />
        ))}
      </Section>
      <Section title="Props">
        <Card title="Pedestal" detail="A low block for relics." payload={{ kind: "prop", shape: "pedestal", name: "Pedestal" }} onAdd={() => placePayload({ kind: "prop", shape: "pedestal", name: "Pedestal" }, onPlaced)} />
        <Card title="Box" detail="A crate or wall piece." payload={{ kind: "prop", shape: "box", name: "Box" }} onAdd={() => placePayload({ kind: "prop", shape: "box", name: "Box" }, onPlaced)} />
        <Card title="Sphere" detail="Orbs, hearts, pickups." payload={{ kind: "prop", shape: "sphere", name: "Sphere" }} onAdd={() => placePayload({ kind: "prop", shape: "sphere", name: "Sphere" }, onPlaced)} />
        <Card title="Light" detail="A warm point light." payload={{ kind: "prop", shape: "light", name: "Light" }} onAdd={() => placePayload({ kind: "prop", shape: "light", name: "Light" }, onPlaced)} />
        <Card title="Rover" detail="The original driveable vehicle." payload={{ kind: "prop", shape: "rover", name: "Rover" }} onAdd={() => placePayload({ kind: "prop", shape: "rover", name: "Rover" }, onPlaced)} />
      </Section>
      <Section title="Your assets">
        {assets.length === 0 ? <p className="px-1 text-xs text-muted">Nothing saved yet. Add a shape below and it stays in this browser.</p> : null}
        {assets.map((asset) => (
          <Card
            key={asset.id}
            title={asset.name}
            detail={asset.shape}
            swatch={asset.color}
            payload={{ kind: "asset", assetId: asset.id }}
            onAdd={() => placePayload({ kind: "asset", assetId: asset.id }, onPlaced)}
            onRemove={() => useWallet.getState().removeAsset(asset.id)}
          />
        ))}
        <AssetForm />
      </Section>
    </div>
  );
}

function AssetForm() {
  const [name, setName] = useState("Banner");
  const [color, setColor] = useState("#c9863a");
  const [shape, setShape] = useState<UserAsset["shape"]>("plaque");
  return (
    <form
      className="space-y-2 rounded-md border border-line bg-bg p-2"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        useWallet.getState().addAsset({
          id: `asset_${Math.random().toString(36).slice(2, 8)}`,
          name: trimmed,
          color,
          shape,
        });
        setName("");
      }}
    >
      <div className="text-xs tracking-wide text-muted uppercase">Add an asset</div>
      <input className={field} aria-label="Asset name" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
      <div className="flex gap-2">
        <select className={field} aria-label="Shape" value={shape} onChange={(event) => setShape(event.target.value as UserAsset["shape"])}>
          <option value="plaque">Plaque</option>
          <option value="box">Box</option>
          <option value="sphere">Sphere</option>
          <option value="cylinder">Cylinder</option>
        </select>
        <input aria-label="Color" className="h-10 w-14 shrink-0 rounded-md border border-line bg-bg" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      </div>
      <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-md bg-raised text-sm text-fg">
        <Plus className="size-4" />
        Save to library
      </button>
    </form>
  );
}

export function StoryBoard() {
  const story = useEditor((state) => state.doc.story);
  const beat = useEditor((state) => state.beat);
  const editing = useEditor((state) => state.mode === "edit");
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-xl flex-col gap-3 overflow-auto px-4 py-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Story</h2>
        <p className="mt-1 text-sm text-muted">Drag a beat onto another to reorder it. Play shows the current beat, and collecting the relic or opening the door moves forward.</p>
      </div>
      <ol className="space-y-2">
        {story.map((item, index) => (
          <li
            key={item.id}
            className={index === beat ? "rounded-md border border-accent bg-surface p-2" : "rounded-md border border-line bg-surface p-2"}
            onDragOver={(event) => {
              if (editing) event.preventDefault();
            }}
            onDrop={(event) => {
              const raw = event.dataTransfer.getData("text/plain");
              if (!raw.startsWith("beat:")) return;
              event.preventDefault();
              useEditor.getState().moveBeat(raw.slice(5), item.id);
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                draggable={editing}
                className="inline-flex h-10 w-8 cursor-grab items-center justify-center text-muted"
                aria-label="Drag to reorder"
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", `beat:${item.id}`);
                  event.dataTransfer.effectAllowed = "move";
                }}
              >
                <GripVertical className="size-4" />
              </span>
              <span className="font-mono text-xs text-muted">{index + 1}</span>
              <input
                className={field}
                aria-label="Beat title"
                disabled={!editing}
                value={item.title}
                onChange={(event) => useEditor.getState().editBeat(item.id, { title: event.target.value })}
              />
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-muted disabled:opacity-40" aria-label="Move beat up" disabled={!editing || index === 0} onClick={() => moveBy(item.id, -1)}>
                <ChevronUp className="size-4" />
              </button>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-muted disabled:opacity-40" aria-label="Move beat down" disabled={!editing || index === story.length - 1} onClick={() => moveBy(item.id, 1)}>
                <ChevronDown className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-10">
              <select
                className={field}
                aria-label="Beat kind"
                disabled={!editing}
                value={item.kind}
                onChange={(event) => useEditor.getState().editBeat(item.id, { kind: event.target.value as StoryKind })}
              >
                <option value="setup">Setup</option>
                <option value="dialogue">Dialogue</option>
                <option value="objective">Objective</option>
                <option value="payoff">Payoff</option>
              </select>
              <input
                className={field}
                aria-label="Speaker"
                placeholder="Speaker"
                disabled={!editing}
                value={item.speaker}
                onChange={(event) => useEditor.getState().editBeat(item.id, { speaker: event.target.value })}
              />
            </div>
            <textarea
              className="mt-2 h-20 w-full resize-y rounded-md border border-line bg-bg p-2 text-sm text-fg outline-none focus:border-accent disabled:opacity-50"
              aria-label="Beat text"
              disabled={!editing}
              value={item.body}
              onChange={(event) => useEditor.getState().editBeat(item.id, { body: event.target.value })}
            />
            <div className="mt-2 flex justify-end">
              <button type="button" className="inline-flex h-8 items-center gap-1 text-xs text-muted disabled:opacity-40" disabled={!editing || story.length < 2} onClick={() => useEditor.getState().removeBeat(item.id)}>
                <Trash2 className="size-3.5" />
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-line text-sm text-fg disabled:opacity-40" disabled={!editing} onClick={() => useEditor.getState().addBeat()}>
        <Plus className="size-4" />
        Add beat
      </button>
    </div>
  );
}

function moveBy(id: string, delta: number) {
  const story = useEditor.getState().doc.story;
  const index = story.findIndex((beat) => beat.id === id);
  const target = story[index + delta];
  if (!target) return;
  if (delta < 0) useEditor.getState().moveBeat(id, target.id);
  else {
    const after = story[index + 2];
    if (after) useEditor.getState().moveBeat(id, after.id);
    else {
      const copy = [...story];
      const [item] = copy.splice(index, 1);
      if (item) copy.push(item);
      useEditor.getState().patchDoc({ story: copy });
    }
  }
}

export function ConceptBoard() {
  const name = useEditor((state) => state.doc.name);
  const concept = useEditor((state) => state.doc.concept);
  const editing = useEditor((state) => state.mode === "edit");
  const setPillar = (index: number, value: string) => {
    const pillars = [...concept.pillars];
    pillars[index] = value;
    useEditor.getState().patchDoc({ concept: { ...concept, pillars } });
  };
  return (
    <div className="mx-auto grid h-full min-h-0 w-full max-w-4xl gap-4 overflow-auto px-4 py-4 md:grid-cols-2">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Concept</h2>
          <p className="mt-1 text-sm text-muted">Write the promise of the game before the polygons. The pitch card stays next to the scene name.</p>
        </div>
        <label className="block text-xs text-muted">
          Logline
          <textarea
            className="mt-1 h-28 w-full resize-y rounded-md border border-line bg-surface p-2 text-sm text-fg outline-none focus:border-accent disabled:opacity-50"
            disabled={!editing}
            value={concept.logline}
            onChange={(event) => useEditor.getState().patchDoc({ concept: { ...concept, logline: event.target.value } })}
          />
        </label>
        <label className="block text-xs text-muted">
          Tone
          <select
            className={`${field} mt-1`}
            disabled={!editing}
            value={concept.tone}
            onChange={(event) => useEditor.getState().patchDoc({ concept: { ...concept, tone: event.target.value } })}
          >
            {["Quiet", "Mythic", "Arcade", "Tender"].map((tone) => (
              <option key={tone}>{tone}</option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          <div className="text-xs text-muted">Pillars</div>
          {concept.pillars.map((pillar, index) => (
            <input
              key={index}
              className={field}
              aria-label={`Pillar ${index + 1}`}
              disabled={!editing}
              value={pillar}
              onChange={(event) => setPillar(index, event.target.value)}
            />
          ))}
        </div>
      </div>
      <article className="flex min-h-64 flex-col justify-between rounded-md border border-line bg-surface p-5">
        <div>
          <div className="text-xs tracking-wide text-muted uppercase">Pitch</div>
          <h3 className="mt-2 text-2xl font-semibold text-fg">{name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-fg">{concept.logline}</p>
        </div>
        <div>
          <div className="text-xs text-accent">{concept.tone}</div>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {concept.pillars.filter(Boolean).map((pillar) => (
              <li key={pillar}>{pillar}</li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  );
}

export function ChainDesk({ onPlaced }: { onPlaced?: () => void }) {
  const network = useWallet((state) => state.network);
  const holdings = useWallet((state) => state.holdings);
  const address = useWallet((state) => state.address);
  const mode = useWallet((state) => state.mode);
  const note = useWallet((state) => state.note);
  const links = useWallet((state) => state.links);
  const items = CATALOG.filter((item) => item.chain === network);
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-4 overflow-auto px-4 py-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Chain</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Drop Ethereum or Polygon tokens into the game as pickups, doors, currencies, or skins. The studio wallet is local — claiming a sample never sends a transaction.
        </p>
      </div>
      <section className="rounded-md border border-line bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Wallet className="size-4 text-accent" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-fg">{mode === "browser" ? "Browser wallet" : "Studio wallet"}</div>
            <div className="font-mono text-xs text-muted">{shortAddress(address)}</div>
          </div>
          <div className="ml-auto flex flex-wrap gap-1">
            <Chip active={network === "ethereum"} onClick={() => useWallet.getState().setNetwork("ethereum")}>
              Ethereum
            </Chip>
            <Chip active={network === "polygon"} onClick={() => useWallet.getState().setNetwork("polygon")}>
              Polygon
            </Chip>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="h-10 rounded-md bg-accent px-3 text-sm font-medium text-accent-ink" onClick={() => useWallet.getState().loadSamples()}>
            Load sample wallet
          </button>
          <button type="button" className="h-10 rounded-md border border-line px-3 text-sm text-fg" onClick={() => void useWallet.getState().connectBrowser()}>
            Browser wallet
          </button>
          <button type="button" className="h-10 rounded-md px-3 text-sm text-muted" onClick={() => useWallet.getState().clearHoldings()}>
            Clear
          </button>
        </div>
        {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
        <ul className="mt-3 flex flex-wrap gap-2">
          {holdings.length === 0 ? <li className="text-xs text-muted">Wallet is empty. Claim a key before the archive door will open.</li> : null}
          {holdings.map((holding) => (
            <li key={`${holding.chain}:${holding.contract}:${holding.tokenId}`} className="rounded-md bg-bg px-2 py-1 text-xs text-fg">
              {holding.symbol} · {holding.amount}
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <TokenCard key={item.id} item={item} onPlaced={onPlaced} />
        ))}
      </div>
      {links.length > 0 ? (
        <Section title="Your links">
          <div className="grid gap-2 md:grid-cols-2">
            {links.map((item) => (
              <TokenCard key={item.id} item={item} onPlaced={onPlaced} onRemove={() => useWallet.getState().removeLink(item.id)} linked />
            ))}
          </div>
        </Section>
      ) : null}
      <LinkForm />
    </div>
  );
}

function TokenCard({
  item,
  onPlaced,
  onRemove,
  linked = false,
}: {
  item: CatalogItem;
  onPlaced?: () => void;
  onRemove?: () => void;
  linked?: boolean;
}) {
  const payload: DragPayload = linked ? { kind: "link", linkId: item.id } : { kind: "chain", itemId: item.id };
  return (
    <article
      draggable
      onDragStart={(event) => dragStart(event, payload)}
      className="rounded-md border border-line bg-surface p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-fg">{item.label}</h3>
          <p className="mt-1 text-xs text-muted">
            {chainLabel(item.chain)} · {standardLabel(item.standard)} · {item.role}
          </p>
        </div>
        <span className="font-mono text-xs text-accent">{item.symbol}</span>
      </div>
      <p className="mt-2 text-sm text-muted">{item.blurb}</p>
      <div className="mt-3 grid grid-cols-3 gap-1">
        <button
          type="button"
          className="h-10 rounded-md bg-raised text-xs text-fg"
          onClick={() => {
            const count = useEditor.getState().doc.entities.length;
            placeInScene(chainProp(item, ((count % 4) - 1.5) * 1.2, -0.4));
            onPlaced?.();
          }}
        >
          Place
        </button>
        <button type="button" className="h-10 rounded-md bg-raised text-xs text-fg" onClick={() => useWallet.getState().claim(item)}>
          Claim
        </button>
        <button type="button" className="h-10 rounded-md bg-raised text-xs text-fg" onClick={() => bindChainToSelection(item)}>
          Bind
        </button>
      </div>
      {onRemove ? (
        <button type="button" className="mt-2 text-xs text-muted" onClick={onRemove}>
          Remove link
        </button>
      ) : null}
    </article>
  );
}

function LinkForm() {
  const [label, setLabel] = useState("");
  const [symbol, setSymbol] = useState("");
  const [chain, setChain] = useState<"ethereum" | "polygon">("ethereum");
  const [standard, setStandard] = useState<CatalogItem["standard"]>("erc721");
  const [role, setRole] = useState<CatalogItem["role"]>("collectible");
  const [contract, setContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  return (
    <form
      className="grid gap-2 rounded-md border border-line bg-surface p-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const name = label.trim();
        if (!name) return;
        const local = `0x${Math.random().toString(16).slice(2).padEnd(40, "0").slice(0, 40)}`;
        useWallet.getState().addLink({
          id: `link_${Math.random().toString(36).slice(2, 8)}`,
          label: name,
          symbol: (symbol.trim() || name.slice(0, 4)).toUpperCase(),
          chain,
          standard,
          role,
          contract: contract.trim() || local,
          tokenId: standard === "erc20" ? "" : tokenId.trim() || "1",
          amount: standard === "erc20" ? 10 : 1,
          tint: "#e8a54b",
          blurb: "A token you linked. Place it, claim a sample, or bind it to the selection.",
        });
        setLabel("");
        setSymbol("");
        setContract("");
        setTokenId("");
      }}
    >
      <div className="md:col-span-2">
        <div className="text-sm font-medium text-fg">Link your own token</div>
        <p className="mt-1 text-xs text-muted">Leave the address blank to keep the token inside Helix. Nothing is read from mainnet.</p>
      </div>
      <input className={field} aria-label="Token name" placeholder="Name" value={label} onChange={(event) => setLabel(event.target.value)} />
      <input className={field} aria-label="Symbol" placeholder="Symbol" value={symbol} onChange={(event) => setSymbol(event.target.value)} />
      <select className={field} aria-label="Chain" value={chain} onChange={(event) => setChain(event.target.value as "ethereum" | "polygon")}>
        <option value="ethereum">Ethereum</option>
        <option value="polygon">Polygon</option>
      </select>
      <select className={field} aria-label="Standard" value={standard} onChange={(event) => setStandard(event.target.value as CatalogItem["standard"])}>
        <option value="erc20">ERC-20</option>
        <option value="erc721">ERC-721</option>
        <option value="erc1155">ERC-1155</option>
      </select>
      <select className={field} aria-label="Role in game" value={role} onChange={(event) => setRole(event.target.value as CatalogItem["role"])}>
        <option value="collectible">Collectible</option>
        <option value="gate">Door</option>
        <option value="currency">Currency</option>
        <option value="skin">Skin</option>
      </select>
      <input className={field} aria-label="Contract address" placeholder="Contract, optional" value={contract} onChange={(event) => setContract(event.target.value)} />
      <input className={`${field} md:col-span-2`} aria-label="Token id" placeholder="Token id, optional" value={tokenId} onChange={(event) => setTokenId(event.target.value)} />
      <button type="submit" className="h-10 rounded-md bg-accent text-sm font-medium text-accent-ink md:col-span-2">
        Save link
      </button>
    </form>
  );
}

export function ExtraFields({
  component,
  editing,
  patch,
}: {
  component: Component;
  editing: boolean;
  patch: (value: Record<string, unknown>) => void;
}) {
  if (component.type === "character") {
    return (
      <div className="space-y-2">
        <label className="block text-xs text-muted">
          Kit
          <select className={`${field} mt-1`} disabled={!editing} value={component.kit} onChange={(event) => patch({ kit: event.target.value })}>
            <option value="warden">Warden</option>
            <option value="relay">Relay</option>
          </select>
        </label>
        <label className="block text-xs text-muted">
          Clip
          <select className={`${field} mt-1`} disabled={!editing} value={component.clip} onChange={(event) => patch({ clip: event.target.value })}>
            {Object.entries(CLIP_NOTES).map(([id, note]) => (
              <option key={id} value={id}>
                {note.set} · {note.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between text-xs text-muted">
          Accent
          <input type="color" disabled={!editing} value={component.accent} onChange={(event) => patch({ accent: event.target.value })} />
        </label>
      </div>
    );
  }
  if (component.type === "chain") {
    return (
      <div className="space-y-1 text-xs text-muted">
        <p className="text-fg">
          {component.label} · {component.symbol}
        </p>
        <p>
          {chainLabel(component.chain)} · {standardLabel(component.standard)} · {component.role}
        </p>
        <p className="font-mono break-all">{component.contract}</p>
        {component.tokenId ? <p>Token {component.tokenId}</p> : null}
        <p>{component.role === "gate" ? `Needs ${component.amount}` : `Grants ${component.amount}`}</p>
      </div>
    );
  }
  return null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Card({
  title,
  detail,
  payload,
  onAdd,
  action = "Add",
  swatch,
  onRemove,
}: {
  title: string;
  detail: string;
  payload: DragPayload;
  onAdd: () => void;
  action?: string;
  swatch?: string;
  onRemove?: () => void;
}) {
  return (
    <article draggable onDragStart={(event) => dragStart(event, payload)} className="rounded-md border border-line bg-bg p-2">
      <div className="flex items-start gap-2">
        {swatch ? <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: swatch }} /> : null}
        <div className="min-w-0 flex-1">
          <div className="text-sm text-fg">{title}</div>
          <p className="text-xs text-muted">{detail}</p>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        <button type="button" className="h-9 flex-1 rounded-md bg-raised text-xs text-fg" onClick={onAdd}>
          {action}
        </button>
        {onRemove ? (
          <button type="button" className="h-9 rounded-md px-2 text-xs text-muted" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      className={active ? "h-9 rounded-md bg-accent px-3 text-sm text-accent-ink" : "h-9 rounded-md border border-line px-3 text-sm text-muted"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

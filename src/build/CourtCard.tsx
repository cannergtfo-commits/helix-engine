import { useState } from "react";
import { useEditor } from "@/editor/store";
import { makeEntity, mesh, vec } from "@/engine/document";
import { packetById } from "@/engine/packets";

export const ELVES = [
  { id: "vaelith", name: "Vaelith", title: "Moon priestess", src: "/elves/vaelith.png", x: -2.2 },
  { id: "seryne", name: "Seryne", title: "Dusk coat", src: "/elves/seryne.png", x: -1.1 },
  { id: "ilyra", name: "Ilyra", title: "Green court", src: "/elves/ilyra.png", x: 0 },
  { id: "nimrael", name: "Nimrael", title: "Night sash", src: "/elves/nimrael.png", x: 1.1 },
  { id: "orinel", name: "Orinel", title: "Indigo scholar", src: "/elves/orinel.png", x: 2.2 },
] as const;

function paint(id: string, material: string) {
  const packet = packetById(material);
  const state = useEditor.getState();
  const entity = state.doc.entities.find((item) => item.id === id);
  if (!packet || !entity) return;
  const components = entity.components.map((component) => {
    if (component.type === "mesh" && !component.src && !component.portrait) {
      return { ...component, finish: material, color: packet.color, metalness: packet.metal, roughness: packet.rough };
    }
    if (component.type === "build") return { ...component, material };
    return component;
  });
  state.updateEntity(id, { components });
}

function figure(id: string, name: string, src: string, x: number, z: number) {
  return makeEntity(name, {
    id,
    position: vec(x, 0.92, z),
    components: [mesh("plane", "#ffffff", { portrait: src, metalness: 0.02, roughness: 0.8, castShadow: false, receiveShadow: false })],
  });
}

export function CourtCard() {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const raise = async () => {
    const agent = window.helix;
    if (!agent || busy) return;
    setBusy(true);
    try {
      await agent.run([
        { op: "clear" },
        { op: "scene", name: "Moon court" },
        { op: "move", id: "warden", x: -6.2, z: 3.4, yaw: 30 },
      ]);
      const built = await agent.build([
        { op: "site" },
        { op: "room", id: "court", name: "Moon court", x: -5, z: -5.4, width: 10, depth: 6, door: "north", material: "moonstone" },
        { op: "roof", room: "court" },
      ]);
      if (!built.ok) {
        setNote("The court did not commit.");
        return;
      }
      paint("court-floor", "nightwood");
      paint("court-roof", "moon-slate");
      paint("court-door", "nightwood");
      paint("ground", "night-moss");
      const current = useEditor.getState();
      current.loadDoc({
        ...current.doc,
        name: "Moon court",
        entities: current.doc.entities.filter((entity) => entity.id !== "court-lamp" && !entity.id.startsWith("elf-")),
      });
      const state = useEditor.getState();
      for (const elf of ELVES) state.addEntity(figure(`elf-${elf.id}`, elf.name, elf.src, elf.x, 2.15));
      state.addEntity(
        makeEntity("Moon lamp", {
          id: "court-lamp",
          position: vec(0, 3.2, 2.2),
          components: [{ type: "light", light: "point", color: "#d4c4ff", intensity: 16, castShadow: false }],
        }),
      );
      setNote("Moon court raised. Five elves stand before the moonstone hall.");
    } catch {
      setNote("The court could not be raised.");
    } finally {
      setBusy(false);
    }
  };

  const place = (id: string) => {
    const elf = ELVES.find((item) => item.id === id);
    if (!elf) return;
    const state = useEditor.getState();
    const existing = state.doc.entities.find((entity) => entity.id === `elf-${elf.id}`);
    const next = figure(`elf-${elf.id}`, elf.name, elf.src, elf.x, 2.15);
    if (existing) state.updateEntity(existing.id, { position: next.position, components: next.components });
    else state.addEntity(next);
    state.log("info", `${elf.name} takes her place.`);
  };

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h2 className="text-xs tracking-wide text-muted uppercase">Moon court</h2>
        <p className="mt-1 text-xs text-muted">Dark-fantasy elves. The hall is moonstone, nightwood, and moon slate. Click a name to place her, or raise the whole court.</p>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {ELVES.map((elf) => (
          <button key={elf.id} type="button" className="overflow-hidden rounded-md border border-line bg-bg text-left" onClick={() => place(elf.id)}>
            <img src={elf.src} alt="" className="h-16 w-full object-cover object-top" />
            <span className="block truncate px-0.5 py-1 text-[10px] text-fg">{elf.name}</span>
          </button>
        ))}
      </div>
      <button type="button" className="h-10 w-full rounded-md bg-accent text-sm font-medium text-accent-ink disabled:opacity-50" disabled={busy} onClick={() => void raise()}>
        {busy ? "Raising…" : "Raise the moon court"}
      </button>
      {note ? <p className="px-1 text-xs text-muted">{note}</p> : null}
    </section>
  );
}

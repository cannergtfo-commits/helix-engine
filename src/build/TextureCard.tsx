import { useEffect, useState } from "react";
import { useEditor } from "@/editor/store";
import { makeEntity, mesh, vec } from "@/engine/document";
import { PACKETS, packetById, packetSwatch, type PacketFamily } from "@/engine/packets";

const FAMILIES: Array<PacketFamily | "all"> = ["all", "wall", "floor", "roof", "metal", "ground"];

export function TextureCard() {
  const [family, setFamily] = useState<PacketFamily | "all">("all");
  const [query, setQuery] = useState("");
  const [swatches, setSwatches] = useState<Map<string, string>>(new Map());
  const selectedId = useEditor((state) => state.selectedId);
  useEffect(() => {
    setSwatches(new Map(PACKETS.map((packet) => [packet.id, packetSwatch(packet.id)])));
  }, []);
  const needle = query.trim().toLowerCase();
  const shown = PACKETS.filter((packet) => (family === "all" || packet.family === family) && (!needle || packet.label.toLowerCase().includes(needle) || packet.id.includes(needle)));

  const apply = (id: string) => {
    const packet = packetById(id);
    if (!packet) return;
    const state = useEditor.getState();
    const entity = state.doc.entities.find((item) => item.id === state.selectedId);
    if (!entity) {
      const index = state.doc.entities.length % 6;
      state.addEntity(
        makeEntity(packet.label, {
          position: vec(index - 2.5, 0.7, 2.2),
          scale: vec(1.6, 1.2, 0.16),
          components: [
            { ...mesh("box", packet.color, { metalness: packet.metal, roughness: packet.rough }), finish: id },
            {
              type: "build",
              kind: packet.family === "floor" || packet.family === "ground" ? "floor" : packet.family === "roof" ? "roof" : "wall",
              tags: [id],
              parent: null,
              material: id,
              size: { x: 1.6, y: 1.2, z: 0.16 },
              cost: packet.rate,
            },
          ],
        }),
      );
      state.log("info", `Placed ${packet.label}.`);
      return;
    }
    const paintable = entity.components.some((component) => (component.type === "mesh" && !component.src) || component.type === "build");
    if (!paintable) {
      state.log("warn", "Select a wall, floor, or plain prop.");
      return;
    }
    const components = entity.components.map((component) => {
      if (component.type === "mesh" && !component.src) return { ...component, finish: id, color: packet.color, metalness: packet.metal, roughness: packet.rough };
      if (component.type === "build") return { ...component, material: id };
      return component;
    });
    state.updateEntity(entity.id, { components });
    state.log("info", `${entity.name} uses ${packet.label}.`);
  };

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h2 className="text-xs tracking-wide text-muted uppercase">Textures</h2>
        <p className="mt-1 text-xs text-muted">{PACKETS.length} packets. {selectedId ? "Applies to the selection." : "Click a packet to drop a sample."} Agents pass the same id as a material.</p>
      </div>
      <input
        className="h-10 w-full rounded-md border border-line bg-bg px-2 text-sm text-fg outline-none focus:border-accent"
        aria-label="Search textures"
        placeholder="Search marble, thatch, brass…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex gap-1 overflow-x-auto">
        {FAMILIES.map((item) => (
          <button key={item} type="button" className={family === item ? "h-7 shrink-0 rounded-md bg-raised px-2 text-xs text-fg" : "h-7 shrink-0 px-2 text-xs text-muted"} onClick={() => setFamily(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="grid max-h-64 grid-cols-3 gap-1 overflow-auto">
        {shown.map((packet) => (
          <button key={packet.id} type="button" className="overflow-hidden rounded-md border border-line bg-bg text-left" onClick={() => apply(packet.id)}>
            <img src={swatches.get(packet.id)} alt="" className="h-12 w-full object-cover" />
            <span className="block truncate px-1 py-1 text-[11px] text-fg">{packet.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

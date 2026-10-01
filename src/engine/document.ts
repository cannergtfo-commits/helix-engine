import { CATALOG, chainFromItem } from "@/studio/catalog";
import {
  CUSTOM_SCRIPT_TEMPLATE,
  type AnimClip,
  type Behavior,
  type CharacterKit,
  type Component,
  type Concept,
  type EntityData,
  type Primitive,
  type SceneDocument,
  type ScriptComponent,
  type StoryBeat,
  type Vec3,
} from "./types";

export function uid(prefix = "e"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function vec(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function cloneDoc(doc: SceneDocument): SceneDocument {
  return structuredClone(doc);
}

const SWATCHES = ["#d9d3c7", "#c9863a", "#8a93a0", "#d4654a", "#9aa58b"];

export function mesh(
  primitive: Primitive,
  color = "#d9d3c7",
  extras: Partial<Extract<Component, { type: "mesh" }>> = {},
): Extract<Component, { type: "mesh" }> {
  return {
    type: "mesh",
    primitive,
    color,
    metalness: primitive === "torus" || primitive === "rover" ? 0.7 : 0.12,
    roughness: primitive === "torus" ? 0.28 : 0.62,
    castShadow: primitive !== "plane",
    receiveShadow: true,
    ...extras,
  };
}

export function colliderFor(primitive: Primitive, isStatic = false): Extract<Component, { type: "collider" }> {
  if (primitive === "sphere") {
    return { type: "collider", shape: "sphere", halfExtents: vec(0.5, 0.5, 0.5), isStatic };
  }
  if (primitive === "rover") {
    return { type: "collider", shape: "box", halfExtents: vec(0.38, 0.32, 0.58), isStatic };
  }
  if (primitive === "capsule") {
    return { type: "collider", shape: "box", halfExtents: vec(0.35, 0.7, 0.35), isStatic };
  }
  return { type: "collider", shape: "box", halfExtents: vec(0.5, 0.5, 0.5), isStatic };
}

export function script(behavior: Behavior, extras: Partial<ScriptComponent> = {}): ScriptComponent {
  return {
    type: "script",
    behavior,
    speed: behavior === "player" ? 7 : behavior === "spin" ? 42 : behavior === "orbit" ? 0.45 : 1.6,
    amplitude: 0.12,
    turnRate: 2.4,
    source: CUSTOM_SCRIPT_TEMPLATE,
    ...extras,
  };
}

export function makeEntity(name: string, partial: Partial<EntityData> = {}): EntityData {
  return {
    id: partial.id ?? uid(),
    name,
    position: partial.position ?? vec(0, 1, 0),
    rotation: partial.rotation ?? vec(),
    scale: partial.scale ?? vec(1, 1, 1),
    visible: partial.visible ?? true,
    components: partial.components ?? [],
  };
}

export function primitiveEntity(primitive: Primitive, index = 0): EntityData {
  const color = SWATCHES[index % SWATCHES.length] ?? "#d9d3c7";
  const y = primitive === "plane" ? 0 : primitive === "rover" ? 0 : 1;
  return makeEntity(labelFor(primitive), {
    position: vec((index % 4) * 0.15, y, 0),
    scale: primitive === "plane" ? vec(8, 1, 8) : vec(1, 1, 1),
    components: [mesh(primitive, color), colliderFor(primitive, primitive === "plane")],
  });
}

function labelFor(primitive: Primitive): string {
  return primitive.charAt(0).toUpperCase() + primitive.slice(1);
}

export function lightEntity(kind: "directional" | "point" | "ambient" | "spot"): EntityData {
  const elevated = kind === "directional" || kind === "spot";
  return makeEntity(kind === "ambient" ? "Fill" : kind === "directional" ? "Sun" : kind === "spot" ? "Spot" : "Light", {
    id: kind === "ambient" ? "fill" : kind === "directional" ? "sun" : kind,
    position: elevated ? vec(8, 14, 6) : kind === "point" ? vec(0, 2, 0) : vec(),
    components: [
      {
        type: "light",
        light: kind,
        color: kind === "point" ? "#e8a54b" : "#f4efe6",
        intensity: kind === "directional" ? 3.4 : kind === "point" ? 26 : kind === "spot" ? 18 : 0.55,
        castShadow: kind === "directional",
      },
    ],
  });
}

export function cameraEntity(): EntityData {
  return makeEntity("Camera", {
    id: "camera",
    position: vec(0, 3, 10),
    components: [{ type: "camera", fov: 50, near: 0.1, far: 200, isMain: true }],
  });
}

export function playerEntity(): EntityData {
  return makeEntity("Rover", {
    id: "rover",
    position: vec(0, 0, 4.2),
    components: [
      mesh("rover", "#8e97a1", { metalness: 0.72, roughness: 0.32, castShadow: true, receiveShadow: false }),
      script("player"),
    ],
  });
}

export function characterEntity(
  kit: CharacterKit,
  options: { clip?: AnimClip; player?: boolean } = {},
): EntityData {
  const accent = kit === "warden" ? "#c9863a" : "#9aa58b";
  const player = options.player ?? kit === "warden";
  const components: Component[] = [
    { type: "character", kit, clip: options.clip ?? "idle", accent },
  ];
  if (player) components.push(script("player", { speed: 5.6, turnRate: 2.3 }));
  return makeEntity(kit === "warden" ? "Warden" : "Relay", {
    position: vec(0, 0, 0),
    components,
  });
}

export function defaultConcept(): Concept {
  return {
    logline: "A warden walks a quiet hall where Ethereum relics and Polygon keys decide which doors open.",
    tone: "Mythic",
    pillars: ["Drag a token into the room", "Wallets are the inventory", "Two chains, one hall"],
  };
}

export function defaultStory(): StoryBeat[] {
  return [
    {
      id: "beat-welcome",
      kind: "setup",
      speaker: "Hall",
      title: "The hall remembers wallets",
      body: "Drive the warden. The brass relic on the pedestal belongs to whoever reaches it.",
    },
    {
      id: "beat-relic",
      kind: "objective",
      speaker: "Warden",
      title: "The relic answers",
      body: "It sits in the studio wallet now. The archive door is still waiting on a Polygon key.",
    },
    {
      id: "beat-open",
      kind: "payoff",
      speaker: "Hall",
      title: "Both chains agreed",
      body: "The door lifts. The heart of the archive was never locked against you — only unclaimed.",
    },
  ];
}

export function emptyScene(): SceneDocument {
  return {
    version: 1,
    name: "Untitled",
    gravity: 18,
    background: "#12141a",
    fog: { enabled: true, color: "#12141a", near: 18, far: 48 },
    concept: {
      logline: "A small scene, ready for characters, beats, and tokens.",
      tone: "Quiet",
      pillars: ["One readable room", "A character who can walk", "Tokens only where they matter"],
    },
    story: [
      {
        id: "beat-start",
        kind: "setup",
        speaker: "Narrator",
        title: "Begin here",
        body: "Add a character from the library, then press Play.",
      },
    ],
    entities: [
      makeEntity("Ground", {
        id: "ground",
        position: vec(0, -0.2, 0),
        scale: vec(40, 0.4, 40),
        components: [
          mesh("box", "#23262d", { metalness: 0.04, roughness: 0.94, castShadow: false, receiveShadow: true }),
          colliderFor("box", true),
        ],
      }),
      lightEntity("ambient"),
      lightEntity("directional"),
      cameraEntity(),
    ],
  };
}

function sample(id: string) {
  const item = CATALOG.find((entry) => entry.id === id);
  if (!item) throw new Error(`Missing catalog sample ${id}`);
  return chainFromItem(item);
}

export function createStarterScene(): SceneDocument {
  const doc = emptyScene();
  doc.name = "Relic Hall";
  doc.concept = defaultConcept();
  doc.story = defaultStory();
  const warden = characterEntity("warden", { player: true, clip: "idle" });
  warden.id = "warden";
  warden.position = vec(0, 0, 2.6);
  const relay = characterEntity("relay", { player: false, clip: "wave" });
  relay.id = "relay";
  relay.position = vec(-1.55, 0, 0.85);
  relay.rotation = vec(0, 28, 0);
  doc.entities.push(
    makeEntity("Wall L", {
      id: "wall-l",
      position: vec(-3.35, 0.8, 0.15),
      scale: vec(0.28, 1.6, 7.4),
      components: [mesh("box", "#34322e", { metalness: 0.08, roughness: 0.86 }), colliderFor("box", true)],
    }),
    makeEntity("Wall R", {
      id: "wall-r",
      position: vec(3.35, 0.8, 0.15),
      scale: vec(0.28, 1.6, 7.4),
      components: [mesh("box", "#34322e", { metalness: 0.08, roughness: 0.86 }), colliderFor("box", true)],
    }),
    makeEntity("Pedestal", {
      id: "pedestal",
      position: vec(1.35, 0.18, 0.15),
      scale: vec(1.35, 0.36, 1.35),
      components: [mesh("box", "#3a3632", { metalness: 0.2, roughness: 0.78 }), colliderFor("box", true)],
    }),
    makeEntity("Brass Relic", {
      id: "relic",
      position: vec(1.35, 0.78, 0.15),
      scale: vec(0.62, 0.62, 0.62),
      components: [
        mesh("sphere", "#c9863a", { metalness: 0.7, roughness: 0.26 }),
        script("bob", { speed: 1.5, amplitude: 0.07 }),
        sample("helix-relic"),
      ],
    }),
    makeEntity("Loom Shard", {
      id: "loom",
      position: vec(-1.15, 0.72, -0.85),
      scale: vec(0.7, 0.7, 0.7),
      components: [
        mesh("torus", "#9aa58b", { metalness: 0.55, roughness: 0.32 }),
        script("spin", { speed: 28 }),
        sample("loom"),
      ],
    }),
    makeEntity("Archive Door", {
      id: "door",
      position: vec(0, 1.1, -3.45),
      scale: vec(6.4, 2.2, 0.28),
      components: [
        mesh("box", "#2a2622", { metalness: 0.42, roughness: 0.5 }),
        colliderFor("box", true),
        sample("courtyard-key"),
      ],
    }),
    makeEntity("Door Seal", {
      id: "seal",
      position: vec(0, 1.15, -3.26),
      scale: vec(1.35, 1.7, 0.08),
      components: [mesh("box", "#c9863a", { metalness: 0.72, roughness: 0.28 })],
    }),
    makeEntity("Archive Heart", {
      id: "heart",
      position: vec(0, 1.15, -5.15),
      components: [
        mesh("sphere", "#e8a54b", { metalness: 0.45, roughness: 0.22 }),
        script("bob", { speed: 1.2, amplitude: 0.1 }),
        { type: "light", light: "point", color: "#e8a54b", intensity: 14, castShadow: false },
      ],
    }),
    makeEntity("Pillar L", {
      id: "pillar-l",
      position: vec(-1.9, 0.9, -1.35),
      scale: vec(0.38, 1.8, 0.38),
      components: [mesh("cylinder", "#8a93a0", { metalness: 0.4, roughness: 0.42 }), colliderFor("cylinder", true)],
    }),
    makeEntity("Pillar R", {
      id: "pillar-r",
      position: vec(1.9, 0.9, -1.35),
      scale: vec(0.38, 1.8, 0.38),
      components: [mesh("cylinder", "#8a93a0", { metalness: 0.4, roughness: 0.42 }), colliderFor("cylinder", true)],
    }),
    relay,
    warden,
  );
  return doc;
}

function cleanConcept(value: Concept | undefined): Concept {
  if (!value || typeof value.logline !== "string") return defaultConcept();
  const pillars = Array.isArray(value.pillars) ? value.pillars.filter((item) => typeof item === "string").slice(0, 3) : [];
  while (pillars.length < 3) pillars.push("");
  return {
    logline: value.logline,
    tone: typeof value.tone === "string" && value.tone ? value.tone : "Quiet",
    pillars,
  };
}

function cleanStory(value: StoryBeat[] | undefined): StoryBeat[] {
  if (!Array.isArray(value) || value.length === 0) return defaultStory();
  const beats = value.filter(
    (beat) => beat && typeof beat.id === "string" && typeof beat.title === "string" && typeof beat.body === "string",
  );
  if (beats.length === 0) return defaultStory();
  return beats.map((beat) => ({
    id: beat.id,
    title: beat.title,
    body: beat.body,
    kind: beat.kind === "dialogue" || beat.kind === "objective" || beat.kind === "payoff" ? beat.kind : "setup",
    speaker: typeof beat.speaker === "string" ? beat.speaker : "",
  }));
}

export function parseScene(raw: string): SceneDocument | null {
  try {
    const data = JSON.parse(raw) as Partial<SceneDocument>;
    if (!data || data.version !== 1 || !Array.isArray(data.entities)) return null;
    if (typeof data.name !== "string" || typeof data.gravity !== "number") return null;
    const concept = cleanConcept(data.concept);
    const story = cleanStory(data.story);
    return { ...(data as SceneDocument), concept, story };
  } catch {
    return null;
  }
}

export function downloadScene(doc: SceneDocument) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = doc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scene";
  link.href = url;
  link.download = `${slug}.helix.json`;
  link.click();
  URL.revokeObjectURL(url);
}

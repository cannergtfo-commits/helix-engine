import {
  CUSTOM_SCRIPT_TEMPLATE,
  type Behavior,
  type Component,
  type EntityData,
  type Primitive,
  type SceneDocument,
  type ScriptComponent,
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

export function emptyScene(): SceneDocument {
  return {
    version: 1,
    name: "Untitled",
    gravity: 18,
    background: "#12141a",
    fog: { enabled: true, color: "#12141a", near: 18, far: 48 },
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

export function createStarterScene(): SceneDocument {
  const doc = emptyScene();
  doc.name = "Courtyard";
  doc.entities.push(
    makeEntity("Pedestal", {
      id: "pedestal",
      position: vec(0, 0.175, -0.3),
      scale: vec(2.4, 0.35, 2.4),
      components: [
        mesh("box", "#3a3632", { metalness: 0.2, roughness: 0.78, castShadow: true, receiveShadow: true }),
        colliderFor("box", true),
      ],
    }),
    makeEntity("Core", {
      id: "core",
      position: vec(0, 1.05, -0.3),
      scale: vec(1.05, 1.05, 1.05),
      components: [
        mesh("sphere", "#d9d3c7", { metalness: 0.55, roughness: 0.22, castShadow: true, receiveShadow: true }),
        script("bob", { speed: 1.4, amplitude: 0.06 }),
      ],
    }),
    makeEntity("Ring", {
      id: "ring",
      position: vec(0, 2.35, -0.3),
      scale: vec(1.35, 1.35, 1.35),
      components: [
        mesh("torus", "#c9863a", { metalness: 0.86, roughness: 0.22, castShadow: true, receiveShadow: false }),
        script("spin", { speed: 36 }),
      ],
    }),
    makeEntity("Pillar L", {
      id: "pillar-l",
      position: vec(-2.35, 1.1, -1.7),
      scale: vec(0.42, 2.2, 0.42),
      components: [
        mesh("cylinder", "#8a93a0", { metalness: 0.45, roughness: 0.4, castShadow: true, receiveShadow: true }),
        colliderFor("cylinder", true),
      ],
    }),
    makeEntity("Pillar R", {
      id: "pillar-r",
      position: vec(2.35, 1.1, -1.7),
      scale: vec(0.42, 2.2, 0.42),
      components: [
        mesh("cylinder", "#8a93a0", { metalness: 0.45, roughness: 0.4, castShadow: true, receiveShadow: true }),
        colliderFor("cylinder", true),
      ],
    }),
    makeEntity("Crate A", {
      id: "crate-a",
      position: vec(1.7, 2.6, 0.5),
      scale: vec(0.7, 0.7, 0.7),
      components: [
        mesh("box", "#9aa58b", { metalness: 0.05, roughness: 0.84, castShadow: true, receiveShadow: true }),
        colliderFor("box", false),
        { type: "rigidbody", mass: 1, useGravity: true, restitution: 0.22, friction: 1.4 },
      ],
    }),
    makeEntity("Crate B", {
      id: "crate-b",
      position: vec(-1.15, 3.5, -0.15),
      scale: vec(0.55, 0.55, 0.55),
      components: [
        mesh("box", "#d4654a", { metalness: 0.08, roughness: 0.7, castShadow: true, receiveShadow: true }),
        colliderFor("box", false),
        { type: "rigidbody", mass: 1, useGravity: true, restitution: 0.3, friction: 1.1 },
      ],
    }),
    makeEntity("Ember", {
      id: "ember",
      position: vec(0, 1.7, -0.3),
      components: [{ type: "light", light: "point", color: "#e8a54b", intensity: 22, castShadow: false }],
    }),
    playerEntity(),
  );
  return doc;
}

export function parseScene(raw: string): SceneDocument | null {
  try {
    const data = JSON.parse(raw) as Partial<SceneDocument>;
    if (!data || data.version !== 1 || !Array.isArray(data.entities)) return null;
    if (typeof data.name !== "string" || typeof data.gravity !== "number") return null;
    return data as SceneDocument;
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

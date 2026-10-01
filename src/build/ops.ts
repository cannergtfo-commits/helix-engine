import { colliderFor, makeEntity, mesh, vec } from "@/engine/document";
import type { BuildKind, EntityData, SceneDocument } from "@/engine/types";

export type BuildOp =
  | { op: "site" }
  | { op: "room"; id?: string; name?: string; tag?: string; x: number; z: number; width: number; depth: number; door?: "south" | "north" | "east" | "west"; material?: string }
  | { op: "wall"; id?: string; x1: number; z1: number; x2: number; z2: number; height?: number; material?: string; kind?: "wall" | "exterior-wall" | "interior-wall"; parent?: string }
  | { op: "door"; id?: string; wall: string; at?: number }
  | { op: "window"; id?: string; wall: string; at?: number }
  | { op: "roof"; id?: string; room: string }
  | { op: "furnish"; id?: string; room: string; tag?: string; name?: string };

export type BuildFailure = {
  ok: false;
  reason: string;
  blocking?: string;
  suggestion?: { x: number; z: number };
};

export type BuildSuccess = { ok: true; id: string; cost: number; warnings: string[] };

export type BuildResult = BuildSuccess | BuildFailure;

export type BuildIssue = { level: "error" | "warn"; code: string; message: string; ids: string[] };

const RATES: Record<string, { color: string; metal: number; rough: number; rate: number }> = {
  brick: { color: "#8d4a3a", metal: 0.04, rough: 0.86, rate: 42 },
  wood: { color: "#8a6244", metal: 0.08, rough: 0.72, rate: 28 },
  drywall: { color: "#d9d3c7", metal: 0.02, rough: 0.9, rate: 18 },
  concrete: { color: "#8d8a84", metal: 0.05, rough: 0.88, rate: 22 },
  glass: { color: "#b7c4ce", metal: 0.1, rough: 0.12, rate: 55 },
  roofing: { color: "#3e4248", metal: 0.2, rough: 0.7, rate: 36 },
};

const HEIGHT = 2.6;
const THICK = 0.16;

export function applyBuild(doc: SceneDocument, op: BuildOp): BuildResult {
  if (op.op === "site") return clearSite(doc);
  if (op.op === "room") return createRoom(doc, op);
  if (op.op === "wall") return createWall(doc, op);
  if (op.op === "door") return placeDoor(doc, op);
  if (op.op === "window") return placeWindow(doc, op);
  if (op.op === "roof") return placeRoof(doc, op);
  return furnish(doc, op);
}

export function applyAll(doc: SceneDocument, ops: BuildOp[]): { results: BuildResult[]; committed: boolean } {
  const draft = structuredClone(doc);
  const results = ops.map((op) => applyBuild(draft, op));
  const committed = results.every((result) => result.ok) && validate(draft).every((issue) => issue.level !== "error");
  if (committed) {
    doc.entities = draft.entities;
    doc.name = draft.name;
  }
  return { results, committed };
}

export function validate(doc: SceneDocument): BuildIssue[] {
  const issues: BuildIssue[] = [];
  const parts = doc.entities.filter(isBuild);
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    if (!a) continue;
    const box = aabb(a);
    if (box.cx < -24 || box.cx > 24 || box.cz < -24 || box.cz > 24) {
      issues.push({ level: "error", code: "OUT_OF_BOUNDS", message: `${a.name} sits outside the lot.`, ids: [a.id] });
    }
    if (!solid(a)) continue;
    for (let j = i + 1; j < parts.length; j++) {
      const b = parts[j];
      if (!b || !solid(b) || joined(a, b)) continue;
      if (overlap(inset(aabb(a), 0.06), inset(aabb(b), 0.06))) {
        issues.push({ level: "error", code: "COLLISION", message: `${a.name} overlaps ${b.name}.`, ids: [a.id, b.id] });
      }
    }
  }
  for (const room of parts.filter((entity) => kindOf(entity) === "room")) {
    const door = parts.some((entity) => entityParent(entity) === room.id && (kindOf(entity) === "door" || kindOf(entity) === "exterior-door"));
    if (!door) issues.push({ level: "warn", code: "NO_DOOR", message: `${room.name} has no door.`, ids: [room.id] });
  }
  return issues;
}

export function worldView(doc: SceneDocument) {
  const parts = doc.entities.filter(isBuild);
  const rooms = parts.filter((entity) => kindOf(entity) === "room");
  return {
    property: doc.name,
    cost: parts.reduce((sum, entity) => sum + costOf(entity), 0),
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      tag: tagsOf(room)[0] ?? "room",
      x: round(room.position.x),
      z: round(room.position.z),
      width: round(sizeOf(room).x),
      depth: round(sizeOf(room).z),
      parts: parts
        .filter((entity) => entityParent(entity) === room.id)
        .map((entity) => ({ id: entity.id, kind: kindOf(entity), material: materialOf(entity), cost: costOf(entity) })),
    })),
  };
}

export function queryNear(doc: SceneDocument, x: number, z: number, radius: number, kind?: string) {
  return doc.entities.filter(isBuild).flatMap((entity) => {
    if (kind && kindOf(entity) !== kind && !tagsOf(entity).includes(kind)) return [];
    const box = aabb(entity);
    const dist = Math.hypot(box.cx - x, box.cz - z);
    if (dist > radius) return [];
    return [{ id: entity.id, kind: kindOf(entity), name: entity.name, x: round(box.cx), z: round(box.cz), distance: round(dist) }];
  });
}

export function canReach(doc: SceneDocument, from: string, to: string) {
  return findRooms(doc, from, to).ok;
}

export function findPath(doc: SceneDocument, from: string, to: string) {
  return findRooms(doc, from, to);
}

export function cottagePlan(): BuildOp[] {
  return [
    { op: "site" },
    { op: "room", id: "hall", name: "Hall", tag: "hallway", x: -4, z: -3, width: 8, depth: 6, door: "south", material: "brick" },
    { op: "wall", id: "split", x1: -3.6, z1: 0.4, x2: 3.6, z2: 0.4, kind: "interior-wall", material: "drywall", parent: "hall" },
    { op: "door", id: "split-door", wall: "split", at: 0.3 },
    { op: "window", id: "north-light", wall: "hall-n" },
    { op: "roof", id: "hall-roof", room: "hall" },
    { op: "furnish", id: "bed", room: "hall", tag: "bed", name: "Bed" },
  ];
}

export function worldHash(doc: SceneDocument) {
  const body = doc.entities
    .filter(isBuild)
    .map((entity) => `${entity.id}:${kindOf(entity)}:${round(entity.position.x)}:${round(entity.position.z)}:${round(entity.scale.x)}`)
    .sort()
    .join("|");
  let hash = 5381;
  for (let i = 0; i < body.length; i++) hash = ((hash << 5) + hash + body.charCodeAt(i)) >>> 0;
  return hash.toString(16);
}

function clearSite(doc: SceneDocument): BuildResult {
  doc.entities = doc.entities.filter((entity) => !isBuild(entity));
  doc.name = "Lot";
  return { ok: true, id: "lot", cost: 0, warnings: [] };
}

function createRoom(doc: SceneDocument, op: Extract<BuildOp, { op: "room" }>): BuildResult {
  const width = op.width;
  const depth = op.depth;
  if (width < 2.4 || depth < 2.4) return { ok: false, reason: "CLEARANCE", suggestion: { x: op.x, z: op.z } };
  const id = op.id ?? nextId(doc, "room");
  const material = op.material ?? "brick";
  const warnings: string[] = [];
  const room = marker(id, op.name ?? "Room", "room", [op.tag ?? "room"], null, "concrete", { x: width, y: HEIGHT, z: depth }, 0);
  room.position = vec(op.x + width / 2, 0, op.z + depth / 2);
  const floor = slab(`${id}-floor`, "Floor", "floor", id, "concrete", op.x + width / 2, 0.04, op.z + depth / 2, width, 0.08, depth);
  const created: EntityData[] = [room, floor];
  const walls = [
    ["s", op.x, op.z, op.x + width, op.z],
    ["n", op.x, op.z + depth, op.x + width, op.z + depth],
    ["w", op.x, op.z, op.x, op.z + depth],
    ["e", op.x + width, op.z, op.x + width, op.z + depth],
  ] as const;
  for (const [side, x1, z1, x2, z2] of walls) {
    const piece = wallEntity(`${id}-${side}`, x1, z1, x2, z2, HEIGHT, material, "exterior-wall", id);
    if (!piece) return { ok: false, reason: "DEGENERATE" };
    created.push(piece);
  }
  const doorSide = op.door ?? "south";
  const doorWall = created.find((entity) => entity.id === `${id}-${doorSide[0]}`);
  if (doorWall) {
    const opened = splitForDoor(doorWall, 0.5, `${id}-door`);
    if (!opened.ok) warnings.push(opened.reason);
    else {
      const index = created.findIndex((entity) => entity.id === doorWall.id);
      created.splice(index, 1, ...opened.parts);
    }
  }
  const blocked = created.find((entity) => hitsSolid(doc, entity));
  if (blocked) {
    const other = doc.entities.find((entity) => isBuild(entity) && solid(entity) && overlap(inset(aabb(entity), 0.06), inset(aabb(blocked), 0.06)));
    return { ok: false, reason: "COLLISION", blocking: other?.id, suggestion: { x: round(op.x + width + 1), z: round(op.z) } };
  }
  for (const entity of created) doc.entities.push(entity);
  return { ok: true, id, cost: created.reduce((sum, entity) => sum + costOf(entity), 0), warnings };
}

function createWall(doc: SceneDocument, op: Extract<BuildOp, { op: "wall" }>): BuildResult {
  const id = op.id ?? nextId(doc, "wall");
  const entity = wallEntity(id, op.x1, op.z1, op.x2, op.z2, op.height ?? HEIGHT, op.material ?? "drywall", op.kind ?? "interior-wall", op.parent ?? null);
  if (!entity) return { ok: false, reason: "DEGENERATE" };
  const blocking = doc.entities.find((other) => isBuild(other) && solid(other) && !joined(other, entity) && overlap(inset(aabb(other), 0.06), inset(aabb(entity), 0.06)));
  if (blocking) return { ok: false, reason: "COLLISION", blocking: blocking.id, suggestion: { x: round(op.x1), z: round(op.z1 + 0.4) } };
  doc.entities.push(entity);
  return { ok: true, id, cost: costOf(entity), warnings: [] };
}

function placeDoor(doc: SceneDocument, op: Extract<BuildOp, { op: "door" }>): BuildResult {
  const wall = doc.entities.find((entity) => entity.id === op.wall);
  if (!wall || !isWall(wall)) return { ok: false, reason: "MISSING_WALL" };
  const opened = splitForDoor(wall, op.at ?? 0.5, op.id ?? `${wall.id}-door`);
  if (!opened.ok) return opened;
  doc.entities = doc.entities.filter((entity) => entity.id !== wall.id);
  for (const part of opened.parts) doc.entities.push(part);
  const door = opened.parts.find((entity) => kindOf(entity) === "door" || kindOf(entity) === "exterior-door");
  return { ok: true, id: door?.id ?? opened.parts[0]?.id ?? op.wall, cost: opened.parts.reduce((sum, entity) => sum + costOf(entity), 0), warnings: [] };
}

function placeWindow(doc: SceneDocument, op: Extract<BuildOp, { op: "window" }>): BuildResult {
  const wall = doc.entities.find((entity) => entity.id === op.wall);
  if (!wall || !isWall(wall)) return { ok: false, reason: "MISSING_WALL" };
  const along = pointAlong(wall, op.at ?? 0.5);
  const id = op.id ?? nextId(doc, "window");
  const entity = marker(id, "Window", "window", ["window"], entityParent(wall), "glass", { x: 1.1, y: 1, z: 0.06 }, rate("glass") * 1.1);
  entity.position = vec(along.x, 1.5, along.z);
  entity.rotation = { ...wall.rotation };
  entity.scale = vec(1.1, 1, 0.06);
  entity.components.unshift(mesh("box", RATES.glass.color, { metalness: RATES.glass.metal, roughness: RATES.glass.rough }));
  doc.entities.push(entity);
  return { ok: true, id, cost: costOf(entity), warnings: [] };
}

function placeRoof(doc: SceneDocument, op: Extract<BuildOp, { op: "roof" }>): BuildResult {
  const room = doc.entities.find((entity) => entity.id === op.room && kindOf(entity) === "room");
  if (!room) return { ok: false, reason: "MISSING_ROOM" };
  const size = sizeOf(room);
  const id = op.id ?? `${room.id}-roof`;
  const entity = slab(id, "Roof", "roof", room.id, "roofing", room.position.x, HEIGHT + 0.08, room.position.z, size.x + 0.4, 0.14, size.z + 0.4);
  doc.entities.push(entity);
  return { ok: true, id, cost: costOf(entity), warnings: [] };
}

function furnish(doc: SceneDocument, op: Extract<BuildOp, { op: "furnish" }>): BuildResult {
  const room = doc.entities.find((entity) => entity.id === op.room && kindOf(entity) === "room");
  if (!room) return { ok: false, reason: "MISSING_ROOM" };
  const size = sizeOf(room);
  const id = op.id ?? nextId(doc, "item");
  const tag = op.tag ?? "furniture";
  const footprint = tag === "bed" ? { x: 2, y: 0.5, z: 1.3 } : { x: 0.8, y: 0.75, z: 0.8 };
  const entity = marker(id, op.name ?? tag, "furniture", [tag], room.id, "wood", footprint, rate("wood") * footprint.x * footprint.z);
  entity.position = vec(room.position.x, footprint.y / 2, room.position.z + size.z * 0.25);
  entity.scale = vec(footprint.x, footprint.y, footprint.z);
  entity.components.unshift(mesh("box", RATES.wood.color, { metalness: 0.08, roughness: 0.72 }));
  entity.components.push(colliderFor("box", true));
  const blocking = doc.entities.find((other) => isBuild(other) && solid(other) && overlap(inset(aabb(other), 0.05), inset(aabb(entity), 0.05)));
  if (blocking) return { ok: false, reason: "COLLISION", blocking: blocking.id, suggestion: { x: round(room.position.x), z: round(room.position.z - size.z * 0.25) } };
  if (Math.abs(entity.position.x - room.position.x) > size.x / 2 - 0.3) return { ok: false, reason: "CLEARANCE" };
  doc.entities.push(entity);
  return { ok: true, id, cost: costOf(entity), warnings: [] };
}

function splitForDoor(wall: EntityData, at: number, doorId: string): { ok: true; parts: EntityData[] } | BuildFailure {
  const ends = endpoints(wall);
  const length = Math.hypot(ends.x2 - ends.x1, ends.z2 - ends.z1);
  const opening = 0.9;
  const t = Math.min(0.8, Math.max(0.2, at));
  const center = length * t;
  if (center - opening / 2 < 0.35 || length - (center + opening / 2) < 0.35) return { ok: false, reason: "CLEARANCE" };
  const a = pointAt(ends, (center - opening / 2) / length);
  const b = pointAt(ends, (center + opening / 2) / length);
  const mid = pointAt(ends, t);
  const kind = kindOf(wall) === "interior-wall" ? "door" : "exterior-door";
  const left = wallEntity(`${wall.id}-a`, ends.x1, ends.z1, a.x, a.z, wall.scale.y, materialOf(wall), isWallKind(kindOf(wall)), entityParent(wall));
  const right = wallEntity(`${wall.id}-b`, b.x, b.z, ends.x2, ends.z2, wall.scale.y, materialOf(wall), isWallKind(kindOf(wall)), entityParent(wall));
  const door = marker(doorId, "Door", kind, ["door"], entityParent(wall), "wood", { x: opening, y: 2.1, z: 0.08 }, rate("wood") * opening * 2.1);
  door.position = vec(mid.x, 1.05, mid.z);
  door.rotation = { ...wall.rotation };
  door.scale = vec(opening, 2.1, 0.08);
  door.components.unshift(mesh("box", "#6e4b32", { metalness: 0.12, roughness: 0.62 }));
  if (!left || !right) return { ok: false, reason: "DEGENERATE" };
  return { ok: true, parts: [left, right, door] };
}

function wallEntity(id: string, x1: number, z1: number, x2: number, z2: number, height: number, material: string, kind: "wall" | "exterior-wall" | "interior-wall", parent: string | null) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  if (length < 0.2) return null;
  const yaw = (Math.atan2(-dz, dx) * 180) / Math.PI;
  const finish = RATES[material] ?? RATES.drywall;
  const cost = finish.rate * length * height;
  const entity = marker(id, kind === "interior-wall" ? "Interior wall" : "Wall", kind, [kind], parent, material, { x: length, y: height, z: THICK }, cost);
  entity.position = vec((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
  entity.rotation = vec(0, yaw, 0);
  entity.scale = vec(length, height, THICK);
  entity.components.unshift(mesh("box", finish.color, { metalness: finish.metal, roughness: finish.rough }));
  entity.components.push(colliderFor("box", true));
  return entity;
}

function slab(id: string, name: string, kind: BuildKind, parent: string, material: string, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  const finish = RATES[material] ?? RATES.concrete;
  const entity = marker(id, name, kind, [kind], parent, material, { x: sx, y: sy, z: sz }, finish.rate * sx * sz);
  entity.position = vec(x, y, z);
  entity.scale = vec(sx, sy, sz);
  entity.components.unshift(mesh("box", finish.color, { metalness: finish.metal, roughness: finish.rough }));
  if (kind === "floor") entity.components.push(colliderFor("box", true));
  return entity;
}

function marker(id: string, name: string, kind: BuildKind, tags: string[], parent: string | null, material: string, size: { x: number; y: number; z: number }, cost: number) {
  return makeEntity(name, {
    id,
    position: vec(0, 0, 0),
    components: [{ type: "build", kind, tags, parent, material, size, cost }],
  });
}

function hitsSolid(doc: SceneDocument, entity: EntityData) {
  if (!solid(entity)) return false;
  return doc.entities.some((other) => isBuild(other) && solid(other) && !joined(other, entity) && overlap(inset(aabb(other), 0.06), inset(aabb(entity), 0.06)));
}

function joined(a: EntityData, b: EntityData) {
  if (!isWall(a) || !isWall(b)) return false;
  const left = endpoints(a);
  const right = endpoints(b);
  const points = [
    [left.x1, left.z1],
    [left.x2, left.z2],
  ];
  const others = [
    [right.x1, right.z1],
    [right.x2, right.z2],
  ];
  return points.some(([x, z]) => others.some(([u, v]) => Math.hypot(x - u, z - v) < 0.3));
}

type Box = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number; cx: number; cz: number };

function aabb(entity: EntityData): Box {
  const yaw = (entity.rotation.y * Math.PI) / 180;
  const hx = Math.abs(entity.scale.x) / 2;
  const hy = Math.abs(entity.scale.y) / 2;
  const hz = Math.abs(entity.scale.z) / 2;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  const wx = hx * c + hz * s;
  const wz = hx * s + hz * c;
  return {
    minX: entity.position.x - wx,
    maxX: entity.position.x + wx,
    minY: entity.position.y - hy,
    maxY: entity.position.y + hy,
    minZ: entity.position.z - wz,
    maxZ: entity.position.z + wz,
    cx: entity.position.x,
    cz: entity.position.z,
  };
}

function inset(box: Box, n: number): Box {
  return { ...box, minX: box.minX + n, maxX: box.maxX - n, minZ: box.minZ + n, maxZ: box.maxZ - n, minY: box.minY + n, maxY: box.maxY - n };
}

function overlap(a: Box, b: Box) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

function endpoints(entity: EntityData) {
  const yaw = (entity.rotation.y * Math.PI) / 180;
  const hx = entity.scale.x / 2;
  const x = Math.cos(yaw) * hx;
  const z = -Math.sin(yaw) * hx;
  return { x1: entity.position.x - x, z1: entity.position.z - z, x2: entity.position.x + x, z2: entity.position.z + z };
}

function pointAlong(entity: EntityData, t: number) {
  const ends = endpoints(entity);
  return pointAt(ends, t);
}

function pointAt(ends: { x1: number; z1: number; x2: number; z2: number }, t: number) {
  return { x: ends.x1 + (ends.x2 - ends.x1) * t, z: ends.z1 + (ends.z2 - ends.z1) * t };
}

function findRooms(doc: SceneDocument, from: string, to: string) {
  const rooms = doc.entities.filter((entity) => kindOf(entity) === "room");
  if (!rooms.some((room) => room.id === from) || !rooms.some((room) => room.id === to)) return { ok: false, path: [] as string[] };
  if (from === to) return { ok: true, path: [from] };
  const doors = doc.entities.filter((entity) => kindOf(entity) === "door" || kindOf(entity) === "exterior-door");
  const links = new Map<string, Set<string>>();
  for (const room of rooms) links.set(room.id, new Set());
  for (const door of doors) {
    const near = rooms.filter((room) => Math.hypot(room.position.x - door.position.x, room.position.z - door.position.z) < Math.max(sizeOf(room).x, sizeOf(room).z));
    for (const a of near) for (const b of near) if (a.id !== b.id) links.get(a.id)?.add(b.id);
  }
  const queue = [from];
  const prev = new Map<string, string | null>([[from, null]]);
  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    if (current === to) break;
    for (const next of links.get(current) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, current);
      queue.push(next);
    }
  }
  if (!prev.has(to)) return { ok: false, path: [] as string[] };
  const path = [to];
  let cursor = to;
  while (prev.get(cursor)) {
    cursor = prev.get(cursor) ?? cursor;
    path.push(cursor);
  }
  return { ok: true, path: path.reverse() };
}

function isBuild(entity: EntityData) {
  return entity.components.some((component) => component.type === "build");
}

function buildOf(entity: EntityData) {
  return entity.components.find((component) => component.type === "build");
}

function kindOf(entity: EntityData): BuildKind | "" {
  const build = buildOf(entity);
  return build && build.type === "build" ? build.kind : "";
}

function isWall(entity: EntityData) {
  const kind = kindOf(entity);
  return kind === "wall" || kind === "exterior-wall" || kind === "interior-wall";
}

function isWallKind(kind: string): "wall" | "exterior-wall" | "interior-wall" {
  if (kind === "interior-wall" || kind === "exterior-wall" || kind === "wall") return kind;
  return "wall";
}

function solid(entity: EntityData) {
  const kind = kindOf(entity);
  return kind === "wall" || kind === "exterior-wall" || kind === "interior-wall" || kind === "furniture";
}

function entityParent(entity: EntityData) {
  const build = buildOf(entity);
  return build && build.type === "build" ? build.parent : null;
}

function materialOf(entity: EntityData) {
  const build = buildOf(entity);
  return build && build.type === "build" ? build.material : "drywall";
}

function costOf(entity: EntityData) {
  const build = buildOf(entity);
  return build && build.type === "build" ? build.cost : 0;
}

function sizeOf(entity: EntityData) {
  const build = buildOf(entity);
  return build && build.type === "build" ? build.size : entity.scale;
}

function tagsOf(entity: EntityData) {
  const build = buildOf(entity);
  return build && build.type === "build" ? build.tags : [];
}

function rate(material: string) {
  return (RATES[material] ?? RATES.drywall).rate;
}

function nextId(doc: SceneDocument, prefix: string) {
  let n = doc.entities.filter(isBuild).length + 1;
  let id = `${prefix}_${n}`;
  while (doc.entities.some((entity) => entity.id === id)) {
    n += 1;
    id = `${prefix}_${n}`;
  }
  return id;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

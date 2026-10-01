import {
  characterEntity,
  colliderFor,
  lightEntity,
  makeEntity,
  mesh,
  playerEntity,
  primitiveEntity,
  script,
  vec,
} from "@/engine/document";
import type { AnimClip, EntityData } from "@/engine/types";
import { chainFromItem, catalogItem, type CatalogItem, type DragPayload, type UserAsset } from "./catalog";
import { useWallet } from "./wallet";
import { useEditor } from "@/editor/store";

export function characterEntitySafe(kit: "warden" | "relay", clip: AnimClip = "idle") {
  return characterEntity(kit, { clip, player: kit === "warden" });
}

export function entityFromDrag(payload: DragPayload, x: number, z: number): EntityData | null {
  if (payload.kind === "clip") return null;
  if (payload.kind === "prop") return propEntity(payload.shape, x, z);
  if (payload.kind === "character") {
    const entity = characterEntitySafe(payload.kit);
    entity.position = vec(x, 0, z);
    return entity;
  }
  if (payload.kind === "model") return modelEntity(payload.title, payload.src, payload.fit, x, z);
  if (payload.kind === "asset") {
    const asset = useWallet.getState().assets.find((item) => item.id === payload.assetId);
    if (!asset) return null;
    return assetEntity(asset, x, z);
  }
  const item =
    payload.kind === "chain"
      ? catalogItem(payload.itemId)
      : useWallet.getState().links.find((link) => link.id === payload.linkId);
  if (!item) return null;
  return chainProp(item, x, z);
}

export function modelEntity(title: string, src: string, fit: number, x: number, z: number): EntityData {
  const halfY = Math.max(0.2, fit * 0.5);
  return makeEntity(title, {
    position: vec(x, halfY, z),
    components: [
      { ...mesh("box", "#d9d3c7"), src, fit },
      { type: "collider", shape: "box", halfExtents: vec(fit * 0.28, halfY, fit * 0.28), isStatic: true },
    ],
  });
}

function propEntity(shape: "box" | "sphere" | "cylinder" | "cone" | "pedestal" | "rover" | "light", x: number, z: number) {
  if (shape === "rover") {
    const rover = playerEntity();
    rover.position = vec(x, 0, z);
    return rover;
  }
  if (shape === "light") {
    const light = lightEntity("point");
    light.position = vec(x, 1.6, z);
    return light;
  }
  if (shape === "pedestal") {
    return makeEntity("Pedestal", {
      position: vec(x, 0.2, z),
      scale: vec(1.4, 0.4, 1.4),
      components: [mesh("box", "#3a3632", { metalness: 0.2, roughness: 0.78 }), colliderFor("box", true)],
    });
  }
  const primitive = shape === "cone" ? "cone" : shape;
  const entity = primitiveEntity(primitive);
  const y = shape === "sphere" || shape === "cone" ? 0.5 : 0.5;
  entity.position = vec(x, y, z);
  return entity;
}

function assetEntity(asset: UserAsset, x: number, z: number): EntityData {
  if (asset.shape === "plaque") {
    return makeEntity(asset.name, {
      position: vec(x, 0.6, z),
      scale: vec(0.9, 1.2, 0.08),
      components: [mesh("box", asset.color, { metalness: 0.15, roughness: 0.55 }), colliderFor("box", true)],
    });
  }
  const primitive = asset.shape === "cylinder" ? "cylinder" : asset.shape;
  return makeEntity(asset.name, {
    position: vec(x, 0.5, z),
    components: [mesh(primitive, asset.color), colliderFor(primitive, false)],
  });
}

export function chainProp(item: CatalogItem, x: number, z: number): EntityData {
  const binding = chainFromItem(item);
  if (item.role === "gate") {
    return makeEntity(item.label, {
      position: vec(x, 1.1, z),
      scale: vec(1.6, 2.2, 0.28),
      components: [
        mesh("box", "#2e2a26", { metalness: 0.35, roughness: 0.58 }),
        colliderFor("box", true),
        binding,
      ],
    });
  }
  if (item.role === "currency") {
    return makeEntity(item.label, {
      position: vec(x, 0.7, z),
      components: [
        mesh("torus", item.tint, { metalness: 0.7, roughness: 0.28 }),
        script("bob", { speed: 1.5, amplitude: 0.06 }),
        binding,
      ],
    });
  }
  if (item.role === "skin") {
    return makeEntity(item.label, {
      position: vec(x, 0.9, z),
      scale: vec(0.7, 0.9, 0.12),
      components: [mesh("box", item.tint, { metalness: 0.25, roughness: 0.45 }), binding],
    });
  }
  return makeEntity(item.label, {
    position: vec(x, 0.7, z),
    scale: vec(0.7, 0.7, 0.7),
    components: [
      mesh("sphere", item.tint, { metalness: 0.62, roughness: 0.28 }),
      script("bob", { speed: 1.5, amplitude: 0.08 }),
      binding,
    ],
  });
}

export function placeInScene(entity: EntityData) {
  useEditor.getState().addEntity(entity);
  useEditor.getState().log("info", `Placed ${entity.name}.`);
}

export function placeDrag(payload: DragPayload, x: number, z: number) {
  if (payload.kind === "clip") {
    applyClip(payload.clip);
    return;
  }
  const entity = entityFromDrag(payload, x, z);
  if (!entity) {
    useEditor.getState().log("warn", "That asset is no longer in the library.");
    return;
  }
  placeInScene(entity);
}

export function applyClip(clip: AnimClip) {
  const state = useEditor.getState();
  const entity = state.doc.entities.find((item) => item.id === state.selectedId);
  const index = entity?.components.findIndex((component) => component.type === "character") ?? -1;
  if (!entity || index < 0) {
    state.log("info", "Select a character, then apply the animation.");
    return;
  }
  state.updateComponent(entity.id, index, { clip });
  state.log("info", `${entity.name} now plays ${clip}. While driving, walk and idle take over.`);
}

export function bindChainToSelection(item: CatalogItem) {
  const state = useEditor.getState();
  const entity = state.doc.entities.find((entry) => entry.id === state.selectedId);
  if (!entity) {
    state.log("info", "Select something in the scene, then bind the token.");
    return;
  }
  const component = chainFromItem(item);
  const index = entity.components.findIndex((entry) => entry.type === "chain");
  if (index >= 0) state.updateComponent(entity.id, index, component);
  else state.addComponent(entity.id, component);
  state.log("info", `${item.label} is bound to ${entity.name}.`);
}

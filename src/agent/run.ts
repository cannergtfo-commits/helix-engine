import { characterEntity } from "@/engine/document";
import type { EntityData, SceneDocument, StoryKind } from "@/engine/types";
import { modelEntity } from "@/studio/place";
import { grantToken, stampRule } from "@/studio/rules";
import { useWallet } from "@/studio/wallet";
import type { AgentAsset, AgentCommand, AgentError, AgentResult, SceneView } from "./types";

const KINDS = new Set<StoryKind>(["setup", "dialogue", "objective", "payoff"]);
const LOCKED = new Set(["ground", "camera"]);

export function runCommands(doc: SceneDocument, catalog: AgentAsset[], commands: AgentCommand[]): { doc: SceneDocument; applied: number; errors: AgentError[]; selectedId: string | null | undefined } {
  const next = structuredClone(doc);
  const errors: AgentError[] = [];
  let applied = 0;
  let selectedId: string | null | undefined;
  const list = commands.slice(0, 24);
  if (commands.length > 24) errors.push({ index: 24, error: "Stopped at 24 commands." });

  list.forEach((command, index) => {
    const error = applyOne(next, catalog, command, (id) => {
      selectedId = id;
    });
    if (error) errors.push({ index, error });
    else applied += 1;
  });

  return { doc: next, applied, errors, selectedId };
}

export function sceneView(doc: SceneDocument, mode: "edit" | "play"): SceneView {
  return {
    name: doc.name,
    mode,
    gravity: doc.gravity,
    background: doc.background,
    concept: doc.concept,
    story: doc.story.map((beat) => ({ id: beat.id, title: beat.title, kind: beat.kind, speaker: beat.speaker })),
    wallet: useWallet.getState().holdings.map((holding) => ({ symbol: holding.symbol, amount: holding.amount, chain: holding.chain })),
    entities: doc.entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      x: round(entity.position.x),
      y: round(entity.position.y),
      z: round(entity.position.z),
      yaw: round(entity.rotation.y),
      locked: locked(entity),
      assetId: assetIdOf(entity),
      kit: kitOf(entity),
      rule: ruleOf(entity),
    })),
  };
}

export function findAssets(catalog: AgentAsset[], query: string): AgentAsset[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return catalog.slice(0, 12);
  return catalog.filter((asset) => `${asset.id} ${asset.title} ${asset.category}`.toLowerCase().includes(needle)).slice(0, 12);
}

function applyOne(doc: SceneDocument, catalog: AgentAsset[], command: AgentCommand, select: (id: string | null) => void): string | null {
  switch (command.op) {
    case "clear": {
      doc.entities = doc.entities.filter((entity) => locked(entity) || entity.id === "warden" || isPlayer(entity));
      return null;
    }
    case "scene": {
      if (command.name) doc.name = String(command.name).slice(0, 42);
      if (typeof command.gravity === "number") doc.gravity = clamp(command.gravity, 0, 40);
      if (command.background) {
        if (!/^#[0-9a-fA-F]{6}$/.test(command.background)) return "background must be #rrggbb.";
        doc.background = command.background;
        doc.fog = { ...doc.fog, color: command.background };
      }
      return null;
    }
    case "concept": {
      doc.concept = {
        logline: command.logline != null ? String(command.logline).slice(0, 180) : doc.concept.logline,
        tone: command.tone != null ? String(command.tone).slice(0, 32) : doc.concept.tone,
        pillars: Array.isArray(command.pillars) ? command.pillars.map((item) => String(item).slice(0, 60)).filter(Boolean).slice(0, 4) : doc.concept.pillars,
      };
      return null;
    }
    case "story": {
      if (!Array.isArray(command.beats) || command.beats.length === 0) return "story needs at least one beat.";
      doc.story = command.beats.slice(0, 8).map((beat, index) => {
        const kind = KINDS.has(beat.kind as StoryKind) ? (beat.kind as StoryKind) : "setup";
        return {
          id: safeId(beat.id) ?? `bot-beat-${index}`,
          title: String(beat.title ?? "Beat").slice(0, 48),
          body: String(beat.body ?? "").slice(0, 220),
          kind,
          speaker: String(beat.speaker ?? "Narrator").slice(0, 24),
        };
      });
      return null;
    }
    case "place": {
      const asset = resolveAsset(catalog, command.asset ?? "");
      if ("error" in asset) return asset.error;
      const id = safeId(command.id) ?? `bot_${asset.asset.id.slice(0, 12)}`;
      const entity = modelEntity(asset.asset.title, asset.asset.src, asset.asset.fit, clamp(num(command.x), -20, 20), clamp(num(command.z), -20, 20));
      entity.id = id;
      entity.rotation = { x: 0, y: clamp(num(command.yaw), -360, 360), z: 0 };
      upsert(doc, entity);
      select(id);
      return null;
    }
    case "spawn": {
      const kit = command.kit === "relay" ? "relay" : "warden";
      const entity = characterEntity(kit, { player: command.player ?? kit === "warden", clip: "idle" });
      entity.id = safeId(command.id) ?? kit;
      entity.position = { x: clamp(num(command.x), -20, 20), y: 0, z: clamp(num(command.z), -20, 20) };
      entity.rotation = { x: 0, y: clamp(num(command.yaw), -360, 360), z: 0 };
      upsert(doc, entity);
      select(entity.id);
      return null;
    }
    case "move": {
      const entity = doc.entities.find((item) => item.id === command.id);
      if (!entity) return `No entity "${command.id}".`;
      if (typeof command.x === "number") entity.position.x = clamp(command.x, -20, 20);
      if (typeof command.y === "number") entity.position.y = clamp(command.y, -2, 20);
      if (typeof command.z === "number") entity.position.z = clamp(command.z, -20, 20);
      if (typeof command.yaw === "number") entity.rotation.y = clamp(command.yaw, -360, 360);
      select(entity.id);
      return null;
    }
    case "remove": {
      const entity = doc.entities.find((item) => item.id === command.id);
      if (!entity) return `No entity "${command.id}".`;
      if (locked(entity)) return `"${command.id}" is part of the stage.`;
      doc.entities = doc.entities.filter((item) => item.id !== command.id);
      return null;
    }
    case "select": {
      if (command.id && !doc.entities.some((item) => item.id === command.id)) return `No entity "${command.id}".`;
      select(command.id);
      return null;
    }
    case "rule": {
      const error = stampRule(doc, command);
      if (!error) select(command.role === "skin" ? command.target || "warden" : safeId(command.id) ?? command.role ?? null);
      return error;
    }
    case "grant":
      return grantToken(command.token ?? "");
    default:
      return "Unknown op.";
  }
}

function resolveAsset(catalog: AgentAsset[], query: string): { asset: AgentAsset } | { error: string } {
  const needle = query.trim().toLowerCase();
  if (!needle) return { error: "place needs an asset id or title." };
  const exact = catalog.find((asset) => asset.id.toLowerCase() === needle || asset.title.toLowerCase() === needle);
  if (exact) return { asset: exact };
  const hits = catalog.filter((asset) => asset.title.toLowerCase().includes(needle) || asset.id.toLowerCase().includes(needle));
  if (hits.length === 1) return { asset: hits[0] };
  if (hits.length === 0) return { error: `No catalog asset matches "${query}".` };
  return { error: `"${query}" matches ${hits.length}. Use one of: ${hits.slice(0, 4).map((asset) => asset.title).join(", ")}.` };
}

function upsert(doc: SceneDocument, entity: EntityData) {
  const index = doc.entities.findIndex((item) => item.id === entity.id);
  if (index >= 0) doc.entities[index] = entity;
  else doc.entities.push(entity);
}

function locked(entity: EntityData) {
  if (LOCKED.has(entity.id)) return true;
  const hasBody = entity.components.some((component) => component.type === "mesh" || component.type === "character");
  const hasLight = entity.components.some((component) => component.type === "light");
  return hasLight && !hasBody;
}

function isPlayer(entity: EntityData) {
  return entity.components.some((component) => component.type === "script" && component.behavior === "player");
}

function assetIdOf(entity: EntityData) {
  const mesh = entity.components.find((component) => component.type === "mesh");
  if (!mesh || mesh.type !== "mesh" || !mesh.src) return null;
  const file = mesh.src.split("/").pop() ?? "";
  return file.replace(/\.glb$/, "") || null;
}

function kitOf(entity: EntityData) {
  const character = entity.components.find((component) => component.type === "character");
  return character && character.type === "character" ? character.kit : null;
}

function ruleOf(entity: EntityData) {
  const chain = entity.components.find((component) => component.type === "chain");
  if (!chain || chain.type !== "chain") return null;
  return { role: chain.role, symbol: chain.symbol, chain: chain.chain, amount: chain.amount, label: chain.label };
}

function safeId(value: unknown) {
  if (typeof value !== "string") return null;
  return /^[a-zA-Z0-9_-]{1,40}$/.test(value) ? value : null;
}

function num(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function resultOf(doc: SceneDocument, mode: "edit" | "play", applied: number, errors: AgentError[]): AgentResult {
  return { ok: errors.length === 0, applied, errors, scene: sceneView(doc, mode) };
}

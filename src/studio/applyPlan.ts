import { characterEntity } from "@/engine/document";
import type { EntityData, SceneDocument } from "@/engine/types";
import { useEditor } from "@/editor/store";
import type { DirectPlan } from "./direct";
import type { LibraryAsset } from "./ModelShelf";
import { modelEntity } from "./place";

export function applyPlan(plan: DirectPlan, catalog: LibraryAsset[]) {
  const current = useEditor.getState().doc;
  const byId = new Map(catalog.map((asset) => [asset.id, asset]));
  const kept = current.entities.filter(keepStage);
  if (!kept.some((entity) => entity.id === "warden")) {
    const warden = characterEntity("warden", { player: true, clip: "idle" });
    warden.id = "warden";
    warden.position = { x: 0, y: 0, z: 3.2 };
    kept.push(warden);
  }
  const placed: EntityData[] = [];
  for (const spot of plan.placements) {
    const asset = byId.get(spot.assetId);
    if (!asset) continue;
    const entity = modelEntity(asset.title, asset.src, asset.fit, spot.x, spot.z);
    entity.rotation = { x: 0, y: spot.yaw, z: 0 };
    placed.push(entity);
  }
  const next: SceneDocument = {
    ...current,
    name: plan.name,
    concept: { logline: plan.logline, tone: plan.tone, pillars: plan.pillars },
    story: plan.beats.map((beat, index) => ({
      id: `ai-beat-${index}`,
      title: beat.title,
      body: beat.body,
      kind: beat.kind,
      speaker: beat.speaker,
    })),
    entities: [...kept, ...placed],
  };
  useEditor.getState().loadDoc(next);
  useEditor.getState().select(placed[0]?.id ?? "warden");
  useEditor.getState().log("info", `Directed “${plan.name}” with ${placed.length} models.`);
  return placed.length;
}

function keepStage(entity: EntityData) {
  if (entity.id === "ground" || entity.id === "camera" || entity.id === "warden") return true;
  if (entity.components.some((component) => component.type === "light")) return true;
  return entity.components.some((component) => component.type === "script" && component.behavior === "player");
}

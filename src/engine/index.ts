export { HelixEngine } from "./Engine";
export type { EngineStats, LogLevel, ScriptApi, Tool } from "./Engine";
export {
  cameraEntity,
  cloneDoc,
  colliderFor,
  createStarterScene,
  downloadScene,
  emptyScene,
  lightEntity,
  makeEntity,
  mesh,
  parseScene,
  playerEntity,
  primitiveEntity,
  script,
} from "./document";
export type {
  Behavior,
  Component,
  EntityData,
  Primitive,
  SceneDocument,
  ScriptComponent,
  Vec3,
} from "./types";
export { CUSTOM_SCRIPT_TEMPLATE, SCENE_STORAGE_KEY } from "./types";

export const HELIX_VERSION = "0.1.0";

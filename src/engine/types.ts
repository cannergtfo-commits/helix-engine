export type Vec3 = { x: number; y: number; z: number };

export type Primitive =
  | "box"
  | "sphere"
  | "cylinder"
  | "cone"
  | "torus"
  | "plane"
  | "capsule"
  | "rover";

export type Behavior = "spin" | "bob" | "orbit" | "player" | "custom";

export type MeshComponent = {
  type: "mesh";
  primitive: Primitive;
  color: string;
  metalness: number;
  roughness: number;
  castShadow: boolean;
  receiveShadow: boolean;
};

export type LightKind = "ambient" | "directional" | "point" | "spot";

export type LightComponent = {
  type: "light";
  light: LightKind;
  color: string;
  intensity: number;
  castShadow: boolean;
};

export type CameraComponent = {
  type: "camera";
  fov: number;
  near: number;
  far: number;
  isMain: boolean;
};

export type RigidbodyComponent = {
  type: "rigidbody";
  mass: number;
  useGravity: boolean;
  restitution: number;
  friction: number;
};

export type ColliderComponent = {
  type: "collider";
  shape: "box" | "sphere";
  /** Half extents of the unit mesh, multiplied by the entity scale at play. */
  halfExtents: Vec3;
  isStatic: boolean;
};

export type ScriptComponent = {
  type: "script";
  behavior: Behavior;
  /** Spin: deg/s. Bob & orbit: rad/s. Player: max speed m/s. */
  speed: number;
  amplitude: number;
  /** Player turn rate, radians/second. */
  turnRate: number;
  source: string;
};

export type Component =
  | MeshComponent
  | LightComponent
  | CameraComponent
  | RigidbodyComponent
  | ColliderComponent
  | ScriptComponent;

export type EntityData = {
  id: string;
  name: string;
  position: Vec3;
  /** Euler degrees. Y is heading: 0 faces world −Z. */
  rotation: Vec3;
  scale: Vec3;
  visible: boolean;
  components: Component[];
};

export type SceneDocument = {
  version: 1;
  name: string;
  gravity: number;
  background: string;
  fog: { enabled: boolean; color: string; near: number; far: number };
  entities: EntityData[];
};

export const SCENE_STORAGE_KEY = "helix.scene.v1";

export const CUSTOM_SCRIPT_TEMPLATE = `// Runs every fixed step. World axes, degrees for rotate().
api.rotate(0, 35 * api.dt, 0);
`;

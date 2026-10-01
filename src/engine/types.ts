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

export type CharacterKit = "warden" | "relay";

export type AnimClip = "idle" | "walk" | "greet" | "strike" | "wave" | "dash";

export type ChainId = "ethereum" | "polygon";

export type TokenStandard = "erc20" | "erc721" | "erc1155";

export type ChainRole = "collectible" | "gate" | "currency" | "skin" | "vendor";

export type MeshComponent = {
  type: "mesh";
  primitive: Primitive;
  color: string;
  metalness: number;
  roughness: number;
  castShadow: boolean;
  receiveShadow: boolean;
  /** Public path to a glTF model. When set, the primitive is only a fallback. */
  src?: string;
  /** Target size of the longest side, in metres. */
  fit?: number;
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

export type CharacterComponent = {
  type: "character";
  kit: CharacterKit;
  clip: AnimClip;
  accent: string;
};

export type ChainComponent = {
  type: "chain";
  chain: ChainId;
  standard: TokenStandard;
  role: ChainRole;
  contract: string;
  tokenId: string;
  symbol: string;
  label: string;
  /** Pickup grant, or tokens required to open a gate. */
  amount: number;
  /** Worn in play when role is skin and the wallet holds the token. */
  tint: string;
};

export type Component =
  | MeshComponent
  | LightComponent
  | CameraComponent
  | RigidbodyComponent
  | ColliderComponent
  | ScriptComponent
  | CharacterComponent
  | ChainComponent;

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

export type StoryKind = "setup" | "dialogue" | "objective" | "payoff";

export type StoryBeat = {
  id: string;
  title: string;
  body: string;
  kind: StoryKind;
  speaker: string;
};

export type Concept = {
  logline: string;
  tone: string;
  pillars: string[];
};

export type SceneDocument = {
  version: 1;
  name: string;
  gravity: number;
  background: string;
  fog: { enabled: boolean; color: string; near: number; far: number };
  entities: EntityData[];
  concept: Concept;
  story: StoryBeat[];
};

export type ChainQuery = {
  chain: ChainId;
  standard: TokenStandard;
  contract: string;
  tokenId: string;
  amount: number;
};

export type ChainEvent =
  | {
      type: "pickup";
      id: string;
      label: string;
      symbol: string;
      role: ChainRole;
      chain: ChainId;
      standard: TokenStandard;
      contract: string;
      tokenId: string;
      amount: number;
    }
  | { type: "unlock"; id: string; label: string }
  | { type: "spent"; id: string; label: string; symbol: string; chain: ChainId; standard: TokenStandard; contract: string; tokenId: string; amount: number }
  | { type: "locked"; id: string; label: string; symbol: string; amount: number };

export const SCENE_STORAGE_KEY = "helix.scene.v3";

export const CUSTOM_SCRIPT_TEMPLATE = `// Runs every fixed step. World axes, degrees for rotate().
api.rotate(0, 35 * api.dt, 0);
`;

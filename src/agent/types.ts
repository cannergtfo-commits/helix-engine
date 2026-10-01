export type AgentAsset = {
  id: string;
  title: string;
  category: string;
  src: string;
  fit: number;
};

export type AgentCommand =
  | { op: "clear" }
  | { op: "scene"; name?: string; gravity?: number; background?: string }
  | { op: "concept"; logline?: string; tone?: string; pillars?: string[] }
  | { op: "story"; beats: { id?: string; title?: string; body?: string; kind?: string; speaker?: string }[] }
  | { op: "place"; id?: string; asset: string; x?: number; z?: number; yaw?: number }
  | { op: "spawn"; id?: string; kit?: "warden" | "relay"; x?: number; z?: number; yaw?: number; player?: boolean }
  | { op: "move"; id: string; x?: number; y?: number; z?: number; yaw?: number }
  | { op: "remove"; id: string }
  | { op: "select"; id: string | null };

export type AgentError = { index: number; error: string };

export type SceneEntityView = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  locked: boolean;
  assetId: string | null;
  kit: string | null;
};

export type SceneView = {
  name: string;
  mode: "edit" | "play";
  gravity: number;
  background: string;
  concept: { logline: string; tone: string; pillars: string[] };
  story: { id: string; title: string; kind: string; speaker: string }[];
  entities: SceneEntityView[];
};

export type AgentResult = {
  ok: boolean;
  applied: number;
  errors: AgentError[];
  scene: SceneView;
};

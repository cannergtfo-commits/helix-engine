import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { buildCharacter, poseCharacter, type CharacterRig } from "./characters";
import { duskEnvironment, finishMaterial, tuneRepeat, type FinishName } from "./finish";
import { packetById } from "./packets";
import { integrate, type SimBody } from "./physics";
import type {
  ChainEvent,
  ChainQuery,
  ColliderComponent,
  Component,
  EntityData,
  LightComponent,
  MeshComponent,
  Primitive,
  SceneDocument,
  ScriptComponent,
} from "./types";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const FIXED = 1 / 60;

export type Tool = "translate" | "rotate" | "scale";
export type LogLevel = "info" | "warn" | "error";

export type EngineStats = {
  fps: number;
  calls: number;
  triangles: number;
  entities: number;
};

export type ScriptApi = {
  dt: number;
  time: number;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  translate: (x: number, y: number, z: number) => void;
  rotate: (x: number, y: number, z: number) => void;
  setPosition: (x: number, y: number, z: number) => void;
  setRotation: (x: number, y: number, z: number) => void;
  setColor: (hex: string) => void;
};

type Hooks = {
  onLog: (level: LogLevel, text: string) => void;
  onTransform: (id: string, patch: Pick<EntityData, "position" | "rotation" | "scale">) => void;
  onGesture: (phase: "start" | "end") => void;
  onSelect: (id: string | null) => void;
  onStats: (stats: EngineStats) => void;
  onChain?: (event: ChainEvent) => void;
  holdsToken?: (query: ChainQuery) => boolean;
};

type Runtime = {
  id: string;
  root: THREE.Group;
  sig: string;
  proxy: THREE.Object3D | null;
  disposables: Array<{ dispose: () => void }>;
  script?: ScriptComponent;
  bobBase: number;
  orbitAngle: number;
  orbitRadius: number;
  compiled?: (api: ScriptApi) => void;
  scriptFailed: boolean;
  rig: CharacterRig | null;
  gem: THREE.Object3D | null;
  consumed: boolean;
  opened: boolean;
  chainNoted: boolean;
  baseY?: number;
  loadToken: number;
  mixer: THREE.AnimationMixer | null;
};

function signature(entity: EntityData): string {
  return entity.components
    .map((component) => {
      if (component.type === "mesh") return `mesh:${component.src ?? component.primitive}:${component.finish ?? ""}:${component.portrait ?? ""}`;
      if (component.type === "light") return `light:${component.light}`;
      if (component.type === "camera") return "camera";
      if (component.type === "character") return `character:${component.kit}`;
      if (component.type === "chain") return `chain:${component.role}`;
      if (component.type === "build") return `build:${component.material}`;
      return component.type;
    })
    .join("|");
}

function findComponent<T extends Component["type"]>(
  entity: EntityData,
  type: T,
): Extract<Component, { type: T }> | undefined {
  return entity.components.find((component) => component.type === type) as
    | Extract<Component, { type: T }>
    | undefined;
}

function finishOf(entity: EntityData): { name: FinishName; repeat: "wall" | "flat" } | null {
  const mesh = findComponent(entity, "mesh");
  const build = findComponent(entity, "build");
  const named = mesh?.finish || (entity.id === "ground" ? "lot" : "") || build?.material || "";
  const packet = named ? packetById(named) : undefined;
  if (!packet) return null;
  const flat =
    entity.id === "ground" ||
    mesh?.primitive === "plane" ||
    build?.kind === "floor" ||
    build?.kind === "roof" ||
    (!build && (packet.family === "floor" || packet.family === "ground" || packet.family === "roof"));
  return { name: packet.id, repeat: flat ? "flat" : "wall" };
}

function createGeometry(primitive: Primitive): THREE.BufferGeometry {
  switch (primitive) {
    case "sphere":
      return new THREE.SphereGeometry(0.5, 32, 20);
    case "cylinder":
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
    case "cone":
      return new THREE.ConeGeometry(0.5, 1, 24);
    case "torus":
      return new THREE.TorusGeometry(0.46, 0.14, 16, 40);
    case "plane": {
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      return geo;
    }
    case "capsule":
      return new THREE.CapsuleGeometry(0.35, 0.7, 6, 12);
    case "rover":
    case "box":
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function buildRover(): { group: THREE.Group; disposables: Array<{ dispose: () => void }> } {
  const disposables: Array<{ dispose: () => void }> = [];
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: "#8e97a1", metalness: 0.72, roughness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: "#16181c", metalness: 0.35, roughness: 0.6 });
  const brass = new THREE.MeshStandardMaterial({ color: "#c9863a", metalness: 0.84, roughness: 0.26 });
  const glass = new THREE.MeshStandardMaterial({
    color: "#b7c6d2",
    metalness: 0.15,
    roughness: 0.08,
    transparent: true,
    opacity: 0.82,
  });
  disposables.push(bodyMat, dark, brass, glass);

  const bodyGeo = new THREE.BoxGeometry(0.62, 0.28, 1.08);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.28;
  body.castShadow = true;
  group.add(body);

  const cabinGeo = new THREE.BoxGeometry(0.48, 0.24, 0.4);
  const cabin = new THREE.Mesh(cabinGeo, glass);
  cabin.position.set(0, 0.5, 0.08);
  cabin.castShadow = true;
  group.add(cabin);

  const noseGeo = new THREE.BoxGeometry(0.64, 0.055, 0.1);
  const nose = new THREE.Mesh(noseGeo, brass);
  nose.position.set(0, 0.34, -0.52);
  nose.castShadow = true;
  group.add(nose);

  const wheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  disposables.push(bodyGeo, cabinGeo, noseGeo, wheelGeo);
  for (const [x, y, z] of [
    [-0.36, 0.14, -0.36],
    [0.36, 0.14, -0.36],
    [-0.36, 0.14, 0.38],
    [0.36, 0.14, 0.38],
  ] as const) {
    const wheel = new THREE.Mesh(wheelGeo, dark);
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  }
  return { group, disposables };
}

export class HelixEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly editorCamera: THREE.PerspectiveCamera;

  mode: "edit" | "play" = "edit";
  paused = false;

  private readonly hooks: Hooks;
  private readonly orbit: OrbitControls;
  private readonly transform: TransformControls;
  private readonly helper: THREE.Object3D;
  private readonly timer = new THREE.Timer();
  private readonly geos = new Map<Primitive, THREE.BufferGeometry>();
  private readonly gltfLoader = new GLTFLoader();
  private readonly modelCache = new Map<string, Promise<{ template: THREE.Object3D; clips: THREE.AnimationClip[] }>>();
  private readonly runtimes = new Map<string, Runtime>();
  private readonly selection: THREE.BoxHelper;
  private readonly grid: THREE.GridHelper;
  private readonly gameCam = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly desired = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly portraitAt = new THREE.Vector3();
  private readonly keySet = new Set<string>();
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onKeyUp: (event: KeyboardEvent) => void;
  private readonly onBlur: () => void;
  private readonly onPointerDown: (event: PointerEvent) => void;
  private readonly onPointerUp: (event: PointerEvent) => void;

  private bodies: SimBody[] = [];
  private gravity = 18;
  private selectedId: string | null = null;
  private draggingId: string | null = null;
  private didDrag = false;
  private pointerX = 0;
  private pointerY = 0;
  private accumulator = 0;
  private simTime = 0;
  private animTime = 0;
  private playerId: string | null = null;
  private playerYaw = 0;
  private playerSpeed = 0;
  private playerMax = 7;
  private playerTurn = 2.4;
  private snapCam = true;
  private injected: Set<string> | null = null;
  private steerOverride: number | null = null;
  private stickThrottle = 0;
  private stickSteer = 0;
  private readonly renderPass: RenderPass;
  private readonly composer: EffectComposer;
  private fps = 60;
  private statsClock = 0;
  private running = false;
  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement, hooks: Hooks) {
    this.hooks = hooks;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.info.autoReset = false;
    const environment = duskEnvironment(this.renderer);
    this.scene = new THREE.Scene();
    this.scene.environment = environment;
    this.scene.background = new THREE.Color("#12141a");
    this.editorCamera = new THREE.PerspectiveCamera(50, 1, 0.08, 250);
    this.editorCamera.position.set(5.6, 3.5, 8.4);

    this.grid = new THREE.GridHelper(40, 40, 0x3a3e48, 0x242830);
    this.grid.position.y = 0.02;
    this.scene.add(this.grid);

    this.selection = new THREE.BoxHelper(new THREE.Object3D(), 0xe8a54b);
    this.selection.visible = false;
    this.scene.add(this.selection);

    this.transform = new TransformControls(this.editorCamera, canvas);
    this.transform.size = 0.85;
    this.helper = this.transform.getHelper();
    this.scene.add(this.helper);

    this.orbit = new OrbitControls(this.editorCamera, canvas);
    this.orbit.target.set(0, 0.7, 0);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.09;
    this.renderPass = new RenderPass(this.scene, this.editorCamera);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.16, 0.42, 0.92);
    this.composer.addPass(bloom);
    this.composer.addPass(new OutputPass());
    this.orbit.maxPolarAngle = Math.PI / 2 - 0.04;
    this.orbit.minDistance = 1.4;
    this.orbit.maxDistance = 80;
    this.orbit.update();

    this.transform.addEventListener("dragging-changed", (event) => {
      const dragging = Boolean((event as { value?: boolean }).value);
      this.orbit.enabled = !dragging && this.mode === "edit";
      this.didDrag = dragging || this.didDrag;
      this.draggingId = dragging ? this.selectedId : null;
      if (dragging) this.hooks.onGesture("start");
    });
    this.transform.addEventListener("mouseUp", () => {
      this.draggingId = null;
      this.hooks.onGesture("end");
    });
    this.transform.addEventListener("objectChange", () => {
      const object = this.transform.object;
      const id = this.selectedId;
      if (!object || !id || this.mode !== "edit") return;
      this.hooks.onTransform(id, {
        position: { x: object.position.x, y: object.position.y, z: object.position.z },
        rotation: {
          x: object.rotation.x * RAD,
          y: object.rotation.y * RAD,
          z: object.rotation.z * RAD,
        },
        scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z },
      });
    });

    this.onKeyDown = (event) => {
      if (isTyping(event.target)) return;
      this.keySet.add(event.code);
    };
    this.onKeyUp = (event) => {
      this.keySet.delete(event.code);
    };
    this.onBlur = () => this.keySet.clear();
    this.onPointerDown = (event) => {
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
      this.didDrag = false;
    };
    this.onPointerUp = (event) => {
      const moved = Math.hypot(event.clientX - this.pointerX, event.clientY - this.pointerY);
      if (this.mode !== "edit" || this.didDrag || moved > 5) return;
      this.pick(event);
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    this.timer.connect(document);
    window.__controlsTest = this.probe;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.renderer.setAnimationLoop((time) => this.tick(time));
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(this.width, this.height, false);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.composer.setSize(this.width, this.height);
    const aspect = this.width / this.height;
    this.editorCamera.aspect = aspect;
    this.editorCamera.updateProjectionMatrix();
    this.gameCam.aspect = aspect;
    this.gameCam.updateProjectionMatrix();
    for (const runtime of this.runtimes.values()) {
      runtime.root.traverse((obj) => {
        if (obj instanceof THREE.PerspectiveCamera) {
          obj.aspect = aspect;
          obj.updateProjectionMatrix();
        }
      });
    }
  }

  apply(doc: SceneDocument) {
    this.gravity = doc.gravity;
    this.scene.background = new THREE.Color(doc.background);
    this.scene.fog = doc.fog.enabled ? new THREE.Fog(doc.fog.color, doc.fog.near, doc.fog.far) : null;

    const alive = new Set(doc.entities.map((entity) => entity.id));
    for (const id of this.runtimes.keys()) {
      if (!alive.has(id)) this.destroyRuntime(id);
    }
    for (const entity of doc.entities) this.upsert(entity);
    if (this.selectedId && !alive.has(this.selectedId)) this.setSelected(null);
    else this.setSelected(this.selectedId);
  }

  setSelected(id: string | null) {
    this.selectedId = id;
    const runtime = id ? this.runtimes.get(id) : undefined;
    if (runtime && this.mode === "edit") this.transform.attach(runtime.root);
    else this.transform.detach();
  }

  setTool(tool: Tool) {
    this.transform.setMode(tool);
  }

  setSnap(enabled: boolean) {
    this.transform.translationSnap = enabled ? 0.5 : null;
    this.transform.rotationSnap = enabled ? 15 * DEG : null;
    this.transform.scaleSnap = enabled ? 0.1 : null;
  }

  setMode(mode: "edit" | "play") {
    if (mode === this.mode) return;
    this.mode = mode;
    const editing = mode === "edit";
    this.grid.visible = editing;
    this.transform.enabled = editing;
    this.orbit.enabled = editing;
    for (const runtime of this.runtimes.values()) {
      if (runtime.proxy) runtime.proxy.visible = editing;
    }
    if (!editing) {
      this.transform.detach();
      this.captureSimulation();
      this.snapCam = true;
      this.accumulator = 0;
      this.paused = false;
      this.hooks.onLog("info", "Play mode. W drives, A turns left, D turns right, S brakes.");
    } else {
      this.bodies = [];
      this.playerId = null;
      this.playerSpeed = 0;
      this.setSelected(this.selectedId);
      this.hooks.onLog("info", "Stopped. Scene restored.");
    }
  }

  private poseCharacters() {
    for (const runtime of this.runtimes.values()) {
      if (runtime.gem) runtime.gem.rotation.y = this.animTime * 1.5;
      if (!runtime.rig) continue;
      const entity = runtime.root.userData.entity as EntityData | undefined;
      if (!entity) continue;
      const character = findComponent(entity, "character");
      if (!character) continue;
      let clip = character.clip;
      if (this.mode === "play" && runtime.id === this.playerId) {
        clip = Math.abs(this.playerSpeed) > 0.35 ? "walk" : "idle";
      }
      poseCharacter(runtime.rig, clip, this.animTime);
      let accent = character.accent;
      const chain = findComponent(entity, "chain");
      if (
        this.mode === "play" &&
        chain?.role === "skin" &&
        this.hooks.holdsToken?.({
          chain: chain.chain,
          standard: chain.standard,
          contract: chain.contract,
          tokenId: chain.tokenId,
          amount: chain.amount || 1,
        })
      ) {
        accent = chain.tint;
      }
      runtime.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData.accent && obj.material instanceof THREE.MeshStandardMaterial) {
          obj.material.color.set(accent);
        }
      });
    }
  }

  private settleChain() {
    if (!this.playerId) return;
    const player = this.runtimes.get(this.playerId);
    if (!player) return;
    for (const runtime of this.runtimes.values()) {
      if (runtime.id === this.playerId) continue;
      const entity = runtime.root.userData.entity as EntityData | undefined;
      const chain = entity ? findComponent(entity, "chain") : undefined;
      if (!chain || chain.role === "skin") continue;
      const dx = runtime.root.position.x - player.root.position.x;
      const dz = runtime.root.position.z - player.root.position.z;
      const dist = Math.hypot(dx, dz);
      if (chain.role === "gate") {
        if (runtime.opened) {
          const base = runtime.baseY ?? runtime.root.position.y;
          runtime.baseY = base;
          const target = base + 2.6;
          runtime.root.position.y += (target - runtime.root.position.y) * 0.12;
          continue;
        }
        const query = {
          chain: chain.chain,
          standard: chain.standard,
          contract: chain.contract,
          tokenId: chain.tokenId,
          amount: chain.amount || 1,
        };
        if (dist < 2.6) {
          if (this.hooks.holdsToken?.(query)) {
            runtime.opened = true;
            runtime.baseY = runtime.root.position.y;
            const body = this.bodies.find((item) => item.id === runtime.id);
            if (body) body.pos.y = -40;
            this.hooks.onChain?.({ type: "unlock", id: runtime.id, label: chain.label });
          } else if (!runtime.chainNoted) {
            runtime.chainNoted = true;
            this.hooks.onChain?.({ type: "locked", id: runtime.id, label: chain.label, symbol: chain.symbol, amount: chain.amount || 1 });
          }
        } else {
          runtime.chainNoted = false;
        }
        continue;
      }
      if (chain.role === "vendor") {
        if (runtime.consumed || dist > 1.6) continue;
        const price = {
          chain: chain.chain,
          standard: chain.standard,
          contract: chain.contract,
          tokenId: chain.tokenId,
          amount: chain.amount || 1,
        };
        if (this.hooks.holdsToken?.(price)) {
          runtime.consumed = true;
          runtime.root.visible = false;
          const body = this.bodies.find((item) => item.id === runtime.id);
          if (body) body.pos.y = -40;
          this.hooks.onChain?.({
            type: "spent",
            id: runtime.id,
            label: chain.label,
            symbol: chain.symbol,
            chain: chain.chain,
            standard: chain.standard,
            contract: chain.contract,
            tokenId: chain.tokenId,
            amount: price.amount,
          });
        } else if (!runtime.chainNoted) {
          runtime.chainNoted = true;
          this.hooks.onChain?.({ type: "locked", id: runtime.id, label: chain.label, symbol: chain.symbol, amount: price.amount });
        }
        continue;
      }
      if (runtime.consumed || dist > 1.6) continue;
      runtime.consumed = true;
      runtime.root.visible = false;
      const body = this.bodies.find((item) => item.id === runtime.id);
      if (body) body.pos.y = -40;
      this.hooks.onChain?.({
        type: "pickup",
        id: runtime.id,
        label: chain.label,
        symbol: chain.symbol,
        role: chain.role,
        chain: chain.chain,
        standard: chain.standard,
        contract: chain.contract,
        tokenId: chain.tokenId,
        amount: chain.amount || 1,
      });
    }
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  setStick(throttle: number, steer: number) {
    this.stickThrottle = throttle;
    this.stickSteer = steer;
  }

  frame(id: string | null) {
    const runtime = id ? this.runtimes.get(id) : undefined;
    const target = runtime ? runtime.root.position : new THREE.Vector3(0, 0.6, 0);
    this.orbit.target.copy(target);
    this.editorCamera.position.copy(target).add(new THREE.Vector3(4.2, 2.6, 5.4));
    this.orbit.update();
  }

  groundPoint(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.editorCamera);
    const hit = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    if (!this.raycaster.ray.intersectPlane(plane, hit)) return null;
    return {
      x: Math.max(-18, Math.min(18, hit.x)),
      z: Math.max(-18, Math.min(18, hit.z)),
    };
  }

  dispose() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
    this.timer.disconnect();
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
    this.orbit.dispose();
    this.transform.dispose();
    this.composer.dispose();
    for (const id of [...this.runtimes.keys()]) this.destroyRuntime(id);
    for (const geo of this.geos.values()) geo.dispose();
    this.renderer.dispose();
    if (window.__controlsTest === this.probe) delete window.__controlsTest;
  }

  private readonly probe = {
    getYaw: () => this.playerYaw,
    getSpeed: () => this.playerSpeed,
    setKeys: (codes: string[]) => {
      this.injected = codes.length ? new Set(codes) : null;
    },
    setSteer: (value: number) => {
      this.steerOverride = value;
    },
  };

  private tick(time?: number) {
    this.timer.update(time);
    const dt = Math.min(this.timer.getDelta(), 0.1);
    if (this.mode === "edit") this.orbit.update();
    if (this.mode === "play" && !this.paused) {
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= FIXED && steps < 5) {
        this.step(FIXED);
        this.accumulator -= FIXED;
        steps += 1;
      }
    }
    this.animTime += dt;
    for (const runtime of this.runtimes.values()) runtime.mixer?.update(dt);
    this.poseCharacters();
    this.facePortraits(this.activeCamera());
    this.syncHelpers();
    const camera = this.activeCamera();
    this.renderPass.camera = camera;
    this.renderer.info.reset();
    this.composer.render();

    if (dt > 0) this.fps = this.fps * 0.9 + (1 / dt) * 0.1;
    this.statsClock += dt;
    if (this.statsClock > 0.25) {
      this.statsClock = 0;
      const info = this.renderer.info.render;
      this.hooks.onStats({
        fps: Math.round(this.fps),
        calls: info.calls,
        triangles: info.triangles,
        entities: this.runtimes.size,
      });
    }
  }

  private activeCamera(): THREE.Camera {
    if (this.mode === "edit") return this.editorCamera;
    if (this.playerId) return this.gameCam;
    for (const runtime of this.runtimes.values()) {
      let found: THREE.PerspectiveCamera | null = null;
      runtime.root.traverse((obj) => {
        if (obj instanceof THREE.PerspectiveCamera && obj.userData.main) found = obj;
      });
      if (found) return found;
    }
    return this.editorCamera;
  }

  private step(dt: number) {
    this.simTime += dt;
    this.runScripts(dt);
    this.runPlayer(dt);
    if (this.bodies.length) {
      integrate(this.bodies, this.gravity, dt);
      this.writeBodies();
    }
    this.updateChase(dt);
    this.settleChain();
  }

  private runScripts(dt: number) {
    for (const runtime of this.runtimes.values()) {
      const script = runtime.script;
      if (!script || script.behavior === "player" || runtime.consumed) continue;
      const root = runtime.root;
      if (script.behavior === "spin") {
        root.rotation.y += script.speed * DEG * dt;
      } else if (script.behavior === "bob") {
        root.position.y = runtime.bobBase + Math.sin(this.simTime * script.speed) * script.amplitude;
      } else if (script.behavior === "orbit") {
        runtime.orbitAngle += script.speed * dt;
        root.position.x = Math.sin(runtime.orbitAngle) * runtime.orbitRadius;
        root.position.z = Math.cos(runtime.orbitAngle) * runtime.orbitRadius;
      } else if (script.behavior === "custom" && runtime.compiled && !runtime.scriptFailed) {
        const api = this.makeApi(runtime, dt);
        try {
          runtime.compiled(api);
        } catch (error) {
          runtime.scriptFailed = true;
          const message = error instanceof Error ? error.message : "Script failed";
          this.hooks.onLog("error", `${runtime.id}: ${message}`);
        }
      }
    }
  }

  private makeApi(runtime: Runtime, dt: number): ScriptApi {
    const root = runtime.root;
    return {
      dt,
      time: this.simTime,
      name: runtime.id,
      position: { x: root.position.x, y: root.position.y, z: root.position.z },
      rotation: { x: root.rotation.x * RAD, y: root.rotation.y * RAD, z: root.rotation.z * RAD },
      translate: (x, y, z) => root.position.add(new THREE.Vector3(x, y, z)),
      rotate: (x, y, z) => {
        root.rotation.x += x * DEG;
        root.rotation.y += y * DEG;
        root.rotation.z += z * DEG;
      },
      setPosition: (x, y, z) => root.position.set(x, y, z),
      setRotation: (x, y, z) => root.rotation.set(x * DEG, y * DEG, z * DEG),
      setColor: (hex) => {
        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            obj.material.color.set(hex);
          }
        });
      },
    };
  }

  private runPlayer(dt: number) {
    if (!this.playerId) return;
    const runtime = this.runtimes.get(this.playerId);
    const body = this.bodies.find((item) => item.id === this.playerId && item.feet);
    if (!runtime || !body) return;
    const script = runtime.script;
    this.playerMax = script?.speed ?? 7;
    this.playerTurn = script?.turnRate ?? 2.4;

    let throttle = (this.held("KeyW") || this.held("ArrowUp") ? 1 : 0) - (this.held("KeyS") || this.held("ArrowDown") ? 1 : 0);
    throttle = clamp(throttle + (this.injected ? 0 : this.stickThrottle), -1, 1);
    let steer = (this.held("KeyA") || this.held("ArrowLeft") ? 1 : 0) - (this.held("KeyD") || this.held("ArrowRight") ? 1 : 0);
    steer = clamp(steer + (this.injected ? 0 : this.stickSteer), -1, 1);
    if (this.steerOverride != null) steer = this.steerOverride;

    const drive = 12;
    if (throttle > 0.05) this.playerSpeed = Math.min(this.playerMax, this.playerSpeed + drive * throttle * dt);
    else if (throttle < -0.05) this.playerSpeed = Math.max(-this.playerMax * 0.45, this.playerSpeed + drive * throttle * dt);
    else this.playerSpeed *= Math.exp(-2.6 * dt);
    if (Math.abs(this.playerSpeed) < 0.02) this.playerSpeed = 0;

    const speedFactor = Math.min(1, Math.abs(this.playerSpeed) / 3);
    const reverse = this.playerSpeed >= 0 ? 1 : -1;
    this.playerYaw += steer * this.playerTurn * Math.max(0.55, speedFactor) * reverse * dt;

    const fx = -Math.sin(this.playerYaw);
    const fz = -Math.cos(this.playerYaw);
    body.vel.x = fx * this.playerSpeed;
    body.vel.z = fz * this.playerSpeed;
    runtime.root.rotation.y = this.playerYaw;
  }

  private updateChase(dt: number) {
    if (!this.playerId) return;
    const runtime = this.runtimes.get(this.playerId);
    if (!runtime) return;
    const fx = -Math.sin(this.playerYaw);
    const fz = -Math.cos(this.playerYaw);
    const follow = 6.2;
    const height = 2.15;
    this.desired.set(
      runtime.root.position.x - fx * follow,
      runtime.root.position.y + height,
      runtime.root.position.z - fz * follow,
    );
    if (this.snapCam) {
      this.gameCam.position.copy(this.desired);
      this.snapCam = false;
    } else {
      const blend = 1 - Math.exp(-5 * dt);
      this.gameCam.position.lerp(this.desired, blend);
    }
    this.look.set(runtime.root.position.x, runtime.root.position.y + 0.7, runtime.root.position.z);
    this.gameCam.lookAt(this.look);
  }

  private held(code: string) {
    if (this.injected) return this.injected.has(code);
    return this.keySet.has(code);
  }

  private captureSimulation() {
    this.bodies = [];
    this.playerId = null;
    this.playerSpeed = 0;
    this.simTime = 0;
    let players = 0;
    for (const runtime of this.runtimes.values()) {
      const entity = runtime.root.userData.entity as EntityData | undefined;
      if (!entity) continue;
      runtime.script = findComponent(entity, "script");
      runtime.bobBase = runtime.root.position.y;
      runtime.orbitRadius = Math.hypot(runtime.root.position.x, runtime.root.position.z) || 2;
      runtime.orbitAngle = Math.atan2(runtime.root.position.x, runtime.root.position.z);
      runtime.scriptFailed = false;
      runtime.compiled = undefined;
      runtime.consumed = false;
      runtime.opened = false;
      runtime.chainNoted = false;
      runtime.baseY = undefined;
      if (runtime.script?.behavior === "custom") {
        try {
          runtime.compiled = new Function("api", `"use strict";\n${runtime.script.source}`) as (api: ScriptApi) => void;
        } catch (error) {
          runtime.scriptFailed = true;
          const message = error instanceof Error ? error.message : "Could not compile script";
          this.hooks.onLog("error", `${entity.name}: ${message}`);
        }
      }
      if (runtime.script?.behavior === "player") {
        players += 1;
        if (!this.playerId) {
          this.playerId = entity.id;
          this.playerYaw = runtime.root.rotation.y;
          this.playerMax = runtime.script.speed;
          this.playerTurn = runtime.script.turnRate;
          const character = findComponent(entity, "character");
          const half = character
            ? scaledHalf(entity, vec3(0.32, character.kit === "relay" ? 0.96 : 0.9, 0.26))
            : scaledHalf(entity, vec3(0.38, 0.32, 0.58));
          this.bodies.push({
            id: entity.id,
            pos: {
              x: runtime.root.position.x,
              y: runtime.root.position.y + half.y,
              z: runtime.root.position.z,
            },
            vel: { x: 0, y: 0, z: 0 },
            half,
            isStatic: false,
            restitution: 0,
            friction: 1,
            grounded: false,
            feet: true,
          });
        }
      }
      const rigid = findComponent(entity, "rigidbody");
      const collider = findComponent(entity, "collider");
      if (collider && runtime.script?.behavior !== "player") {
        const half = scaledHalf(entity, collider.halfExtents);
        const isStatic = collider.isStatic || !rigid;
        this.bodies.push({
          id: entity.id,
          pos: { ...readVec(runtime.root.position) },
          vel: { x: 0, y: 0, z: 0 },
          half,
          isStatic,
          restitution: rigid?.restitution ?? 0,
          friction: rigid?.friction ?? 1,
          grounded: false,
          feet: false,
        });
      }
    }
    if (players > 1) this.hooks.onLog("warn", "Multiple player scripts. Only the first is driven.");
  }

  private writeBodies() {
    for (const body of this.bodies) {
      if (body.isStatic) continue;
      const runtime = this.runtimes.get(body.id);
      if (!runtime) continue;
      if (body.feet) runtime.root.position.set(body.pos.x, body.pos.y - body.half.y, body.pos.z);
      else runtime.root.position.set(body.pos.x, body.pos.y, body.pos.z);
    }
  }

  private syncHelpers() {
    const runtime = this.selectedId ? this.runtimes.get(this.selectedId) : undefined;
    if (runtime && this.mode === "edit") {
      this.selection.setFromObject(runtime.root);
      this.selection.visible = true;
    } else {
      this.selection.visible = false;
    }
  }

  private pick(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.editorCamera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const hit of hits) {
      if (isDescendant(hit.object, this.helper) || hit.object === this.grid) continue;
      let node: THREE.Object3D | null = hit.object;
      while (node && !node.userData.entityId) node = node.parent;
      if (node?.userData.entityId) {
        this.hooks.onSelect(String(node.userData.entityId));
        return;
      }
    }
    this.hooks.onSelect(null);
  }

  private upsert(entity: EntityData) {
    let runtime = this.runtimes.get(entity.id);
    const sig = signature(entity);
    if (!runtime) {
      const root = new THREE.Group();
      root.userData.entityId = entity.id;
      this.scene.add(root);
      runtime = {
        id: entity.id,
        root,
        sig: "",
        proxy: null,
        disposables: [],
        bobBase: entity.position.y,
        orbitAngle: 0,
        orbitRadius: 1,
        scriptFailed: false,
        rig: null,
        gem: null,
        consumed: false,
        opened: false,
        chainNoted: false,
        loadToken: 0,
        mixer: null,
      };
      this.runtimes.set(entity.id, runtime);
    }
    runtime.root.userData.entity = entity;
    if (runtime.sig !== sig) {
      this.clearContent(runtime);
      this.buildContent(runtime, entity);
      runtime.sig = sig;
    }
    if (this.draggingId !== entity.id) {
      runtime.root.position.set(entity.position.x, entity.position.y, entity.position.z);
      runtime.root.rotation.set(entity.rotation.x * DEG, entity.rotation.y * DEG, entity.rotation.z * DEG);
      runtime.root.scale.set(entity.scale.x, entity.scale.y, entity.scale.z);
    }
    runtime.root.visible = entity.visible;
    tuneRepeat(runtime.root);
    this.syncMaterials(runtime, entity);
  }

  private facePortraits(camera: THREE.Camera) {
    for (const runtime of this.runtimes.values()) {
      runtime.root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh) || obj.userData.portrait !== true) return;
        const y = obj.getWorldPosition(this.portraitAt).y;
        obj.lookAt(camera.position.x, y, camera.position.z);
      });
    }
  }

  private mountPortrait(runtime: Runtime, src: string) {
    const geo = new THREE.PlaneGeometry(0.82, 1.86);
    geo.rotateY(Math.PI);
    const material = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.72,
      metalness: 0.04,
      transparent: true,
      alphaTest: 0.06,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    material.userData.portrait = true;
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData.portrait = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    runtime.root.add(mesh);
    runtime.disposables.push(geo, material);
    const loader = new THREE.TextureLoader();
    loader.load(src, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const image = texture.image as { width?: number; height?: number };
      if (image?.width && image?.height) {
        const fitted = new THREE.PlaneGeometry(1.86 * (image.width / image.height), 1.86);
        fitted.rotateY(Math.PI);
        mesh.geometry = fitted;
        const index = runtime.disposables.indexOf(geo);
        if (index >= 0) runtime.disposables[index] = fitted;
        geo.dispose();
      }
      material.map = texture;
      material.needsUpdate = true;
      runtime.disposables.push(texture);
    });
  }

  private buildContent(runtime: Runtime, entity: EntityData) {
    const meshComponent = findComponent(entity, "mesh");
    const character = findComponent(entity, "character");
    const light = findComponent(entity, "light");
    const camera = findComponent(entity, "camera");
    const chain = findComponent(entity, "chain");
    if (character) {
      const built = buildCharacter(character.kit, character.accent);
      tag(built.group, entity.id);
      runtime.root.add(built.group);
      runtime.rig = built.rig;
      runtime.disposables.push(...built.disposables);
    } else if (meshComponent?.src) {
      this.mountModel(runtime, entity, meshComponent.src, meshComponent.fit || 1.2);
    } else if (meshComponent?.portrait) {
      this.mountPortrait(runtime, meshComponent.portrait);
    } else if (meshComponent?.primitive === "rover") {
      const built = buildRover();
      tag(built.group, entity.id);
      runtime.root.add(built.group);
      runtime.disposables.push(...built.disposables);
    } else if (meshComponent) {
      const geo = this.geometry(meshComponent.primitive);
      const finish = finishOf(entity);
      const material = finish ? finishMaterial(finish.name, finish.repeat) : new THREE.MeshStandardMaterial({
        color: meshComponent.color,
        metalness: meshComponent.metalness,
        roughness: meshComponent.roughness,
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = meshComponent.castShadow;
      mesh.receiveShadow = meshComponent.receiveShadow;
      mesh.userData.entityId = entity.id;
      mesh.userData.sharedGeo = true;
      runtime.root.add(mesh);
      runtime.disposables.push(material);
    }
    if (chain && (chain.role === "collectible" || chain.role === "currency")) {
      const geo = new THREE.OctahedronGeometry(0.12);
      const material = new THREE.MeshStandardMaterial({
        color: "#e8a54b",
        metalness: 0.65,
        roughness: 0.28,
      });
      const gem = new THREE.Mesh(geo, material);
      gem.position.y = 0.72;
      gem.userData.entityId = entity.id;
      runtime.root.add(gem);
      runtime.gem = gem;
      runtime.disposables.push(geo, material);
    }
    if (light) runtime.root.add(this.makeLight(light, entity.id, runtime));
    if (camera) {
      const cam = new THREE.PerspectiveCamera(camera.fov, this.width / this.height, camera.near, camera.far);
      cam.userData.main = camera.isMain;
      cam.userData.entityId = entity.id;
      runtime.root.add(cam);
    }
    if (!meshComponent && !character) {
      const proxy = new THREE.Mesh(
        light ? new THREE.OctahedronGeometry(0.18) : new THREE.BoxGeometry(0.22, 0.16, 0.28),
        new THREE.MeshBasicMaterial({ color: light ? light.color : "#e8a54b" }),
      );
      proxy.userData.entityId = entity.id;
      proxy.visible = this.mode === "edit";
      runtime.proxy = proxy;
      runtime.root.add(proxy);
      runtime.disposables.push(proxy.geometry, proxy.material as THREE.Material);
    }
  }

  private makeLight(component: LightComponent, id: string, runtime: Runtime) {
    let light: THREE.Light;
    if (component.light === "ambient") {
      light = new THREE.HemisphereLight(component.color, "#3a342c", component.intensity);
    } else if (component.light === "point") {
      const point = new THREE.PointLight(component.color, component.intensity, 16, 2);
      light = point;
    } else if (component.light === "spot") {
      const spot = new THREE.SpotLight(component.color, component.intensity, 30, Math.PI / 7, 0.4, 1);
      spot.target.position.set(0, 0, -1);
      spot.add(spot.target);
      light = spot;
    } else {
      const sun = new THREE.DirectionalLight(component.color, component.intensity);
      sun.castShadow = component.castShadow;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = 60;
      sun.shadow.camera.left = -18;
      sun.shadow.camera.right = 18;
      sun.shadow.camera.top = 18;
      sun.shadow.camera.bottom = -18;
      sun.shadow.bias = -0.0002;
      sun.shadow.normalBias = 0.03;
      sun.target.position.set(0, 0, 0);
      this.scene.add(sun.target);
      runtime.disposables.push({
        dispose: () => {
          sun.target.removeFromParent();
        },
      });
      light = sun;
    }
    light.userData.entityId = id;
    return light;
  }

  private syncMaterials(runtime: Runtime, entity: EntityData) {
    const meshComponent = findComponent(entity, "mesh");
    if (meshComponent && meshComponent.primitive !== "rover" && !meshComponent.src) {
      runtime.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial && !obj.userData.proxy && obj.material.userData.finish !== true && obj.material.userData.portrait !== true) {
          obj.material.color.set(meshComponent.color);
          obj.material.metalness = meshComponent.metalness;
          obj.material.roughness = meshComponent.roughness;
          obj.castShadow = meshComponent.castShadow;
          obj.receiveShadow = meshComponent.receiveShadow;
        }
      });
    }
    const lightComponent = findComponent(entity, "light");
    if (lightComponent) {
      runtime.root.traverse((obj) => {
        if (obj instanceof THREE.Light) {
          obj.color.set(lightComponent.color);
          obj.intensity = lightComponent.intensity;
          if (obj instanceof THREE.DirectionalLight) obj.castShadow = lightComponent.castShadow;
        }
      });
    }
    const camera = findComponent(entity, "camera");
    if (camera) {
      runtime.root.traverse((obj) => {
        if (obj instanceof THREE.PerspectiveCamera) {
          obj.fov = camera.fov;
          obj.near = camera.near;
          obj.far = camera.far;
          obj.userData.main = camera.isMain;
          obj.updateProjectionMatrix();
        }
      });
    }
  }

  private geometry(primitive: Primitive): THREE.BufferGeometry {
    const cached = this.geos.get(primitive);
    if (cached) return cached;
    const geo = createGeometry(primitive);
    this.geos.set(primitive, geo);
    return geo;
  }

  private loadModel(src: string, fit: number) {
    const key = `${src}|${fit}`;
    const cached = this.modelCache.get(key);
    if (cached) return cached;
    const pending = new Promise<{ template: THREE.Object3D; clips: THREE.AnimationClip[] }>((resolve, reject) => {
      this.gltfLoader.load(
        src,
        (gltf) => {
          const root = gltf.scene;
          root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          root.scale.multiplyScalar(fit / maxDim);
          root.updateMatrixWorld(true);
          const fitted = new THREE.Box3().setFromObject(root);
          root.position.sub(fitted.getCenter(new THREE.Vector3()));
          root.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });
          resolve({ template: root, clips: gltf.animations });
        },
        undefined,
        (error) => {
          this.modelCache.delete(key);
          reject(error instanceof Error ? error : new Error("Could not load model"));
        },
      );
    });
    this.modelCache.set(key, pending);
    return pending;
  }

  private mountModel(runtime: Runtime, entity: EntityData, src: string, fit: number) {
    const token = ++runtime.loadToken;
    const placeholder = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.35),
      new THREE.MeshStandardMaterial({ color: "#3a3632", roughness: 0.8 }),
    );
    placeholder.userData.entityId = entity.id;
    placeholder.userData.proxy = true;
    runtime.root.add(placeholder);
    runtime.disposables.push(placeholder.geometry, placeholder.material);
    void this.loadModel(src, fit)
      .then((loaded) => {
        if (runtime.loadToken !== token) return;
        placeholder.removeFromParent();
        const clone = cloneSkinned(loaded.template);
        tag(clone, entity.id);
        runtime.root.add(clone);
        const clip = loaded.clips.find((item) => /idle|walk|breathe/i.test(item.name)) ?? loaded.clips[0];
        if (clip) {
          const mixer = new THREE.AnimationMixer(clone);
          mixer.clipAction(clip).play();
          runtime.mixer = mixer;
        }
      })
      .catch((error: unknown) => {
        if (runtime.loadToken !== token) return;
        const message = error instanceof Error ? error.message : "Could not load model";
        this.hooks.onLog("error", `${entity.name}: ${message}`);
      });
  }

  private clearContent(runtime: Runtime) {
    runtime.loadToken += 1;
    runtime.mixer?.stopAllAction();
    runtime.mixer = null;
    for (const item of runtime.disposables) item.dispose();
    runtime.disposables = [];
    runtime.proxy = null;
    runtime.rig = null;
    runtime.gem = null;
    for (const child of [...runtime.root.children]) {
      runtime.root.remove(child);
    }
  }

  private destroyRuntime(id: string) {
    const runtime = this.runtimes.get(id);
    if (!runtime) return;
    if (this.transform.object === runtime.root) this.transform.detach();
    this.clearContent(runtime);
    runtime.root.removeFromParent();
    this.runtimes.delete(id);
  }
}

function tag(object: THREE.Object3D, id: string) {
  object.userData.entityId = id;
  object.traverse((child) => {
    child.userData.entityId = id;
  });
}

function readVec(v: THREE.Vector3) {
  return { x: v.x, y: v.y, z: v.z };
}

function vec3(x: number, y: number, z: number) {
  return { x, y, z };
}

function scaledHalf(entity: EntityData, half: { x: number; y: number; z: number }) {
  return {
    x: half.x * Math.abs(entity.scale.x),
    y: half.y * Math.abs(entity.scale.y),
    z: half.z * Math.abs(entity.scale.z),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function isDescendant(object: THREE.Object3D, root: THREE.Object3D) {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (node === root) return true;
    node = node.parent;
  }
  return false;
}

export type { ColliderComponent, MeshComponent };

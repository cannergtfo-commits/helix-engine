import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Box,
  Camera,
  Circle,
  Cone,
  Copy,
  Cylinder,
  Download,
  Eye,
  EyeOff,
  Focus,
  Lightbulb,
  Magnet,
  Move3d,
  Pause,
  Play,
  Plus,
  Redo2,
  Rotate3d,
  Scaling,
  Square,
  SunMedium,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import {
  CUSTOM_SCRIPT_TEMPLATE,
  HELIX_VERSION,
  SCENE_STORAGE_KEY,
  cameraEntity,
  characterEntity,
  colliderFor,
  createStarterScene,
  downloadScene,
  emptyScene,
  lightEntity,
  mesh,
  parseScene,
  primitiveEntity,
  script,
  type Behavior,
  type Component,
  type EntityData,
  type Primitive,
} from "@/engine";
import { installHelix } from "@/agent/bridge";
import { Viewport } from "./Viewport";
import { useEditor } from "./store";
import { ChainDesk, ConceptBoard, ExtraFields, Library, StoryBoard, WorkspaceBar, type Workspace } from "@/studio/StudioPanels";
import { useWallet } from "@/studio/wallet";

type MobileTab = "view" | "scene" | "assets" | "inspect";

export function EditorApp({ autoPlay = false }: { autoPlay?: boolean }) {
  const [tab, setTab] = useState<MobileTab>("view");
  const [workspace, setWorkspace] = useState<Workspace>("design");
  const [rail, setRail] = useState<"assets" | "scene">("assets");
  const [bottom, setBottom] = useState<"console" | "guide">("console");
  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = useEditor((state) => state.hydrated);
  const doc = useEditor((state) => state.doc);
  const mode = useEditor((state) => state.mode);

  useEffect(() => {
    useEditor.getState().hydrate();
    useWallet.getState().hydrate();
    return installHelix();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (autoPlay) useEditor.getState().play();
    return () => {
      if (autoPlay) useEditor.getState().stop();
    };
  }, [autoPlay, hydrated]);

  useEffect(() => {
    if (!hydrated || mode !== "edit") return;
    try {
      localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(doc));
    } catch {
      /* ignore quota */
    }
  }, [doc, hydrated, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const state = useEditor.getState();
      const meta = event.metaKey || event.ctrlKey;
      if (event.code === "Space") {
        event.preventDefault();
        if (state.mode === "edit") state.play();
        else state.setPaused(!state.paused);
        setWorkspace("design");
      }
      if (state.mode === "play") return;
      if (meta && event.code === "KeyZ") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
      } else if (meta && event.code === "KeyY") {
        event.preventDefault();
        state.redo();
      } else if (meta && event.code === "KeyD") {
        event.preventDefault();
        state.duplicateSelected();
      } else if (meta && event.code === "KeyS") {
        event.preventDefault();
        state.log("info", "Scene saved in this browser.");
      } else if (event.code === "KeyF") {
        window.dispatchEvent(new Event("helix:frame"));
      } else if (event.code === "KeyW") state.setTool("translate");
      else if (event.code === "KeyE") state.setTool("rotate");
      else if (event.code === "KeyR") state.setTool("scale");
      else if (event.code === "Delete" || event.code === "Backspace") state.removeSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseScene(await file.text());
    if (!parsed) {
      useEditor.getState().log("error", "That file is not a Helix scene.");
      return;
    }
    useEditor.getState().loadDoc(parsed);
    useEditor.getState().log("info", `Imported ${parsed.name}.`);
  };

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <Toolbar onImport={() => fileRef.current?.click()} onPlay={() => setWorkspace("design")} />
      <WorkspaceBar value={workspace} onChange={setWorkspace} />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void onImport(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className={workspace === "design" ? "flex min-h-0 flex-1 flex-col md:flex-row" : "hidden"}>
        <aside className={`${tab === "scene" ? "flex" : "hidden"} min-h-0 w-full flex-col bg-surface md:hidden`}>
          <Hierarchy />
        </aside>
        <aside className={`${tab === "assets" ? "flex" : "hidden"} min-h-0 w-full flex-col bg-surface md:hidden`}>
          <Library onPlaced={() => setTab("view")} />
        </aside>
        <aside className="hidden min-h-0 w-72 shrink-0 flex-col border-r border-line bg-surface md:flex">
          <div className="flex h-10 shrink-0 items-center gap-1 border-b border-line px-2">
            <button type="button" className={rail === "assets" ? "h-8 rounded-md bg-raised px-3 text-sm text-fg" : "h-8 px-3 text-sm text-muted"} onClick={() => setRail("assets")}>
              Library
            </button>
            <button type="button" className={rail === "scene" ? "h-8 rounded-md bg-raised px-3 text-sm text-fg" : "h-8 px-3 text-sm text-muted"} onClick={() => setRail("scene")}>
              Scene
            </button>
          </div>
          {rail === "scene" ? <Hierarchy /> : <Library />}
        </aside>
        <div className={`${tab === "view" ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col md:flex`}>
          <div className="min-h-0 flex-1">
            <Viewport />
          </div>
          <section className="hidden h-36 shrink-0 flex-col border-t border-line bg-surface md:flex">
            <div className="flex h-8 items-center gap-1 border-b border-line px-2">
              <TabButton active={bottom === "console"} onClick={() => setBottom("console")}>
                Console
              </TabButton>
              <TabButton active={bottom === "guide"} onClick={() => setBottom("guide")}>
                Guide
              </TabButton>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">{bottom === "console" ? <Console /> : <Guide />}</div>
          </section>
        </div>
        <aside className={`${tab === "inspect" ? "flex" : "hidden"} min-h-0 w-full flex-col bg-surface md:flex md:w-72 md:shrink-0 md:border-l md:border-line`}>
          <Inspector />
        </aside>
      </div>
      {workspace === "story" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-bg">
          <StoryBoard />
        </div>
      ) : null}
      {workspace === "concept" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-bg">
          <ConceptBoard />
        </div>
      ) : null}
      {workspace === "chain" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-bg">
          <ChainDesk onPlaced={() => setWorkspace("design")} />
        </div>
      ) : null}
      {workspace === "design" ? (
        <nav className="grid h-12 shrink-0 grid-cols-4 border-t border-line bg-surface md:hidden">
          {(
            [
              ["view", "View"],
              ["scene", "Scene"],
              ["assets", "Assets"],
              ["inspect", "Inspect"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "text-sm text-accent" : "text-sm text-muted"}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

function Toolbar({ onImport, onPlay }: { onImport: () => void; onPlay: () => void }) {
  const mode = useEditor((state) => state.mode);
  const paused = useEditor((state) => state.paused);
  const tool = useEditor((state) => state.tool);
  const snap = useEditor((state) => state.snap);
  const name = useEditor((state) => state.doc.name);
  const canUndo = useEditor((state) => state.past.length > 0 && state.mode === "edit");
  const canRedo = useEditor((state) => state.future.length > 0 && state.mode === "edit");
  const playing = mode === "play" && !paused;

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-surface px-2">
      <div className="flex items-center gap-2 pr-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-xs font-semibold text-accent-ink">H</span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">Helix</div>
          <div className="text-xs whitespace-nowrap text-muted">On-chain</div>
        </div>
      </div>
      <input
        aria-label="Scene name"
        className={`${fieldClass} w-28 shrink-0 sm:w-40`}
        value={name}
        disabled={mode === "play"}
        onChange={(event) => useEditor.getState().renameScene(event.target.value)}
      />
      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Undo" disabled={!canUndo} onClick={() => useEditor.getState().undo()}>
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton label="Redo" disabled={!canRedo} onClick={() => useEditor.getState().redo()}>
          <Redo2 className="size-4" />
        </IconButton>
        <span className="mx-1 h-5 w-px bg-line" />
        <ToolButton label="Move" active={tool === "translate"} onClick={() => useEditor.getState().setTool("translate")}>
          <Move3d className="size-4" />
        </ToolButton>
        <ToolButton label="Rotate" active={tool === "rotate"} onClick={() => useEditor.getState().setTool("rotate")}>
          <Rotate3d className="size-4" />
        </ToolButton>
        <ToolButton label="Scale" active={tool === "scale"} onClick={() => useEditor.getState().setTool("scale")}>
          <Scaling className="size-4" />
        </ToolButton>
        <ToolButton label="Snap" active={snap} onClick={() => useEditor.getState().setSnap(!snap)}>
          <Magnet className="size-4" />
        </ToolButton>
        <IconButton label="Frame selection" onClick={() => window.dispatchEvent(new Event("helix:frame"))}>
          <Focus className="size-4" />
        </IconButton>
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
        <AddMenu />
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md bg-accent px-3 text-sm font-medium text-accent-ink"
          onClick={() => {
            const state = useEditor.getState();
            if (state.mode === "edit") state.play();
            else state.setPaused(!state.paused);
            onPlay();
          }}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2 text-sm text-fg disabled:opacity-40"
          disabled={mode !== "play"}
          onClick={() => useEditor.getState().stop()}
        >
          <Square className="size-3.5" />
          Stop
        </button>
        <IconButton label="Import scene" onClick={onImport}>
          <Upload className="size-4" />
        </IconButton>
        <IconButton label="Export scene" onClick={() => downloadScene(useEditor.getState().doc)}>
          <Download className="size-4" />
        </IconButton>
      </div>
    </header>
  );
}

function AddMenu() {
  const disabled = useEditor((state) => state.mode === "play");
  const add = (entity: EntityData) => {
    if (disabled) return;
    const index = useEditor.getState().doc.entities.length;
    useEditor.getState().addEntity({
      ...entity,
      id: `e_${Math.random().toString(36).slice(2, 8)}`,
      position: { x: (index % 5) * 0.4, y: entity.position.y, z: entity.position.z },
    });
  };
  return (
    <details className="relative">
      <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1 rounded-md border border-line px-2 text-sm text-fg">
        <Plus className="size-4" />
        Add
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-line bg-surface p-1 shadow-lg">
        <AddItem label="Warden" onClick={() => add(characterEntity("warden", { player: true }))} />
        <AddItem label="Relay" onClick={() => add(characterEntity("relay", { player: false, clip: "wave" }))} />
        <AddItem icon={<SunMedium className="size-4" />} label="Sun" onClick={() => add(lightEntity("directional"))} />
        <AddItem icon={<Lightbulb className="size-4" />} label="Point light" onClick={() => add(lightEntity("point"))} />
        <AddItem icon={<Camera className="size-4" />} label="Camera" onClick={() => add(cameraEntity())} />
        <AddItem label="Relic hall" onClick={() => useEditor.getState().loadDoc(createStarterScene())} />
        <AddItem label="Empty scene" onClick={() => useEditor.getState().loadDoc(emptyScene())} />
        <details className="mt-1 border-t border-line pt-1">
          <summary className="cursor-pointer px-2 py-1 text-xs text-muted">Shapes</summary>
          <AddItem icon={<Box className="size-4" />} label="Box" onClick={() => add(primitiveEntity("box"))} />
          <AddItem icon={<Circle className="size-4" />} label="Sphere" onClick={() => add(primitiveEntity("sphere"))} />
          <AddItem icon={<Cylinder className="size-4" />} label="Cylinder" onClick={() => add(primitiveEntity("cylinder"))} />
          <AddItem icon={<Cone className="size-4" />} label="Cone" onClick={() => add(primitiveEntity("cone"))} />
        </details>
      </div>
    </details>
  );
}

function AddItem({ icon, label, onClick }: { icon?: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-fg hover:bg-raised"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function Hierarchy() {
  const entities = useEditor((state) => state.doc.entities);
  const selectedId = useEditor((state) => state.selectedId);
  const editing = useEditor((state) => state.mode === "edit");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-8 items-center justify-between px-3 text-xs tracking-wide text-muted uppercase">
        Hierarchy
        <span>{entities.length}</span>
      </header>
      <ul className="min-h-0 flex-1 overflow-auto px-1 pb-2">
        {entities.map((entity) => {
          const active = entity.id === selectedId;
          return (
            <li key={entity.id}>
              <button
                type="button"
                className={
                  active
                    ? "flex h-8 w-full items-center gap-2 rounded-md border-l-2 border-l-accent bg-raised px-2 text-left text-sm text-fg"
                    : "flex h-8 w-full items-center gap-2 rounded-md border-l-2 border-l-transparent px-2 text-left text-sm text-fg hover:bg-raised"
                }
                onClick={() => useEditor.getState().select(entity.id)}
              >
                <span
                  role="button"
                  aria-label={entity.visible ? "Hide" : "Show"}
                  className="text-muted"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!editing) return;
                    useEditor.getState().updateEntity(entity.id, { visible: !entity.visible });
                  }}
                >
                  {entity.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </span>
                <span className="truncate">{entity.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Inspector() {
  const selected = useEditor((state) => state.doc.entities.find((entity) => entity.id === state.selectedId));
  const editing = useEditor((state) => state.mode === "edit");
  if (!selected) {
    return <p className="p-4 text-sm text-muted">Select an entity in the hierarchy or the viewport.</p>;
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-8 items-center justify-between px-3 text-xs tracking-wide text-muted uppercase">
        Inspector
        <span className="flex gap-1 normal-case">
          <IconButton label="Duplicate" disabled={!editing} onClick={() => useEditor.getState().duplicateSelected()}>
            <Copy className="size-3.5" />
          </IconButton>
          <IconButton label="Delete" disabled={!editing} onClick={() => useEditor.getState().removeSelected()}>
            <Trash2 className="size-3.5" />
          </IconButton>
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto px-3 pb-4">
        {!editing ? <p className="text-xs text-accent">Stop play mode to edit. Stop restores the scene.</p> : null}
        <label className="block text-xs text-muted">
          Name
          <input
            className={`${fieldClass} mt-1 w-full`}
            value={selected.name}
            disabled={!editing}
            onChange={(event) => useEditor.getState().updateEntity(selected.id, { name: event.target.value })}
          />
        </label>
        <VecFields
          label="Position"
          value={selected.position}
          disabled={!editing}
          onChange={(position) => useEditor.getState().updateEntity(selected.id, { position })}
        />
        <VecFields
          label="Rotation"
          value={selected.rotation}
          disabled={!editing}
          onChange={(rotation) => useEditor.getState().updateEntity(selected.id, { rotation })}
        />
        <VecFields
          label="Scale"
          value={selected.scale}
          disabled={!editing}
          onChange={(scale) => useEditor.getState().updateEntity(selected.id, { scale })}
        />
        {selected.components.map((component, index) => (
          <ComponentCard key={`${component.type}-${index}`} entity={selected} index={index} component={component} editing={editing} />
        ))}
        {editing ? <AddComponent entity={selected} /> : null}
      </div>
    </div>
  );
}

function ComponentCard({
  entity,
  index,
  component,
  editing,
}: {
  entity: EntityData;
  index: number;
  component: Component;
  editing: boolean;
}) {
  const patch = (value: Record<string, unknown>) => useEditor.getState().updateComponent(entity.id, index, value);
  return (
    <section className="rounded-md border border-line bg-bg p-2">
      <header className="mb-2 flex items-center justify-between text-xs tracking-wide text-muted uppercase">
        {component.type}
        <button
          type="button"
          className="text-muted hover:text-fg disabled:opacity-40"
          disabled={!editing}
          onClick={() => useEditor.getState().removeComponent(entity.id, index)}
        >
          Remove
        </button>
      </header>
      {component.type === "mesh" && component.src ? (
        <p className="text-xs text-muted">Imported model. Scale it with the gizmo. Color sliders do not tint imported materials.</p>
      ) : null}
      {component.type === "mesh" && !component.src ? (
        <div className="space-y-2">
          <label className="block text-xs text-muted">
            Primitive
            <select
              className={`${fieldClass} mt-1 w-full`}
              disabled={!editing}
              value={component.primitive}
              onChange={(event) => patch({ primitive: event.target.value as Primitive })}
            >
              {["box", "sphere", "cylinder", "cone", "torus", "plane", "capsule", "rover"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between text-xs text-muted">
            Color
            <input type="color" disabled={!editing} value={toColor(component.color)} onChange={(event) => patch({ color: event.target.value })} />
          </label>
          <Slider label="Metal" value={component.metalness} disabled={!editing} onChange={(metalness) => patch({ metalness })} />
          <Slider label="Rough" value={component.roughness} disabled={!editing} onChange={(roughness) => patch({ roughness })} />
        </div>
      ) : null}
      {component.type === "light" ? (
        <div className="space-y-2">
          <label className="flex items-center justify-between text-xs text-muted">
            Color
            <input type="color" disabled={!editing} value={toColor(component.color)} onChange={(event) => patch({ color: event.target.value })} />
          </label>
          <Slider label="Intensity" min={0} max={40} step={0.1} value={component.intensity} disabled={!editing} onChange={(intensity) => patch({ intensity })} />
        </div>
      ) : null}
      {component.type === "camera" ? (
        <Slider label="FOV" min={20} max={100} step={1} value={component.fov} disabled={!editing} onChange={(fov) => patch({ fov })} />
      ) : null}
      {component.type === "rigidbody" ? (
        <div className="space-y-2">
          <Slider label="Bounce" value={component.restitution} disabled={!editing} onChange={(restitution) => patch({ restitution })} />
          <Slider label="Friction" min={0} max={3} step={0.05} value={component.friction} disabled={!editing} onChange={(friction) => patch({ friction })} />
        </div>
      ) : null}
      {component.type === "script" ? (
        <div className="space-y-2">
          <label className="block text-xs text-muted">
            Behavior
            <select
              className={`${fieldClass} mt-1 w-full`}
              disabled={!editing}
              value={component.behavior}
              onChange={(event) => patch({ behavior: event.target.value as Behavior })}
            >
              {["spin", "bob", "orbit", "player", "custom"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <Slider
            label={component.behavior === "player" ? "Speed" : "Rate"}
            min={0}
            max={component.behavior === "player" ? 16 : 180}
            step={0.1}
            value={component.speed}
            disabled={!editing}
            onChange={(speed) => patch({ speed })}
          />
          {component.behavior === "player" ? (
            <Slider label="Turn" min={0.2} max={5} step={0.05} value={component.turnRate} disabled={!editing} onChange={(turnRate) => patch({ turnRate })} />
          ) : null}
          {component.behavior === "bob" ? (
            <Slider label="Amplitude" min={0} max={2} step={0.01} value={component.amplitude} disabled={!editing} onChange={(amplitude) => patch({ amplitude })} />
          ) : null}
          {component.behavior === "custom" ? (
            <textarea
              className="h-28 w-full resize-y rounded-md border border-line bg-surface p-2 font-mono text-xs text-fg"
              disabled={!editing}
              value={component.source}
              spellCheck={false}
              onChange={(event) => patch({ source: event.target.value })}
            />
          ) : null}
        </div>
      ) : null}
      <ExtraFields component={component} editing={editing} patch={patch} />
      {component.type === "collider" ? (
        <p className="text-xs text-muted">{component.isStatic ? "Static" : "Dynamic"} {component.shape} collider</p>
      ) : null}
    </section>
  );
}

function AddComponent({ entity }: { entity: EntityData }) {
  const has = (type: Component["type"]) => entity.components.some((component) => component.type === type);
  const options: Array<{ label: string; component: Component; hide: boolean }> = [
    { label: "Mesh", hide: has("mesh"), component: mesh("box") },
    {
      label: "Rigidbody",
      hide: has("rigidbody"),
      component: { type: "rigidbody", mass: 1, useGravity: true, restitution: 0.25, friction: 1 },
    },
    { label: "Collider", hide: has("collider"), component: colliderFor("box", false) },
    { label: "Script", hide: has("script"), component: script("spin") },
    {
      label: "Point light",
      hide: has("light"),
      component: { type: "light", light: "point", color: "#e8a54b", intensity: 18, castShadow: false },
    },
  ];
  return (
    <label className="block text-xs text-muted">
      Add component
      <select
        className={`${fieldClass} mt-1 w-full`}
        value=""
        onChange={(event) => {
          const choice = options.find((item) => item.label === event.target.value);
          if (choice) useEditor.getState().addComponent(entity.id, choice.component);
          event.target.value = "";
        }}
      >
        <option value="">Choose</option>
        {options
          .filter((item) => !item.hide)
          .map((item) => (
            <option key={item.label} value={item.label}>
              {item.label}
            </option>
          ))}
      </select>
    </label>
  );
}

function VecFields({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: { x: number; y: number; z: number };
  disabled: boolean;
  onChange: (value: { x: number; y: number; z: number }) => void;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-xs text-muted">{label}</legend>
      <div className="grid grid-cols-3 gap-1">
        {(["x", "y", "z"] as const).map((axis) => (
          <input
            key={axis}
            aria-label={`${label} ${axis}`}
            className={fieldClass}
            type="number"
            step="0.1"
            disabled={disabled}
            value={round(value[axis])}
            onChange={(event) => onChange({ ...value, [axis]: Number(event.target.value) })}
          />
        ))}
      </div>
    </fieldset>
  );
}

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block text-xs text-muted">
      <span className="flex justify-between">
        {label}
        <span className="font-mono text-fg">{value.toFixed(2)}</span>
      </span>
      <input
        className="mt-1 w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Console() {
  const logs = useEditor((state) => state.logs);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [logs.length]);
  return (
    <div className="px-3 py-2 font-mono text-xs">
      {logs.length === 0 ? <p className="text-muted">Console is clear. Press Play to simulate.</p> : null}
      {logs.map((line) => (
        <p key={line.id} className={line.level === "error" ? "text-accent" : "text-muted"}>
          {line.text}
        </p>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function Guide() {
  return (
    <div className="space-y-3 px-3 py-3 text-sm text-muted">
      <p className="text-fg">Helix builds chain games. A rule checks the wallet. Nothing in play sends a transaction.</p>
      <ol className="list-decimal space-y-1 pl-4">
        <li>Stamp a gate, loot, purse, vendor, or skin in the library.</li>
        <li>Grant the token, or claim it on Chain. That only fills the studio wallet.</li>
        <li>Press Play. W drives, A turns left, D turns right. Walk into the rule.</li>
        <li>Or press Build the cottage. Agents use helix.build and helix.world for the same plan, without clicking.</li>
      </ol>
      <p>Studio version {HELIX_VERSION}. Samples never leave this browser and never send a transaction.</p>
      <pre className="overflow-auto rounded-md bg-bg p-2 font-mono text-xs text-fg">{`api.rotate(0, 40 * api.dt, 0);
api.translate(0, Math.sin(api.time) * api.dt, 0);`}</pre>
      <p>
        Custom scripts receive <span className="font-mono text-fg">api.dt</span>, <span className="font-mono text-fg">api.time</span>,{" "}
        <span className="font-mono text-fg">api.rotate</span>, <span className="font-mono text-fg">api.translate</span>,{" "}
        <span className="font-mono text-fg">api.setPosition</span>, and <span className="font-mono text-fg">api.setColor</span>. Default
        template: <span className="font-mono text-fg">{CUSTOM_SCRIPT_TEMPLATE.split("\n")[1]}</span>
      </p>
      <p>Heading is rotation Y in degrees. 0 faces world −Z. One player script is driven; the chase camera follows it.</p>
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" className={active ? "h-6 rounded-md bg-raised px-2 text-xs text-fg" : "h-6 px-2 text-xs text-muted"} onClick={onClick}>
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg disabled:opacity-40"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={
        active
          ? "inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-ink"
          : "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg"
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const fieldClass = "h-8 rounded-md border border-line bg-bg px-2 text-sm text-fg outline-none focus:border-accent disabled:opacity-50";

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function toColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#d9d3c7";
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

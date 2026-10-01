import { create } from "zustand";
import {
  cloneDoc,
  createStarterScene,
  parseScene,
  type Component,
  type EntityData,
  type SceneDocument,
  type StoryBeat,
} from "@/engine";
import { SCENE_STORAGE_KEY } from "@/engine/types";
import type { Tool } from "@/engine";

export type LogLine = { id: number; level: "info" | "warn" | "error"; text: string };

type Burst = { key: string; t: number };

type EditorState = {
  doc: SceneDocument;
  past: string[];
  future: string[];
  selectedId: string | null;
  mode: "edit" | "play";
  paused: boolean;
  tool: Tool;
  snap: boolean;
  logs: LogLine[];
  playSnapshot: SceneDocument | null;
  gesture: boolean;
  hydrated: boolean;
  lastBurst: Burst | null;
  logSeq: number;
  beat: number;
  weather: "clear" | "rain";
  hydrate: () => void;
  select: (id: string | null) => void;
  setTool: (tool: Tool) => void;
  setSnap: (snap: boolean) => void;
  renameScene: (name: string) => void;
  patchDoc: (patch: Partial<SceneDocument>) => void;
  editBeat: (id: string, patch: Partial<StoryBeat>) => void;
  addBeat: () => void;
  removeBeat: (id: string) => void;
  moveBeat: (fromId: string, beforeId: string) => void;
  setBeat: (beat: number) => void;
  advanceBeat: () => void;
  updateEntity: (id: string, patch: Partial<EntityData>) => void;
  updateComponent: (id: string, index: number, patch: Record<string, unknown>) => void;
  addComponent: (id: string, component: Component) => void;
  removeComponent: (id: string, index: number) => void;
  addEntity: (entity: EntityData) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  loadDoc: (doc: SceneDocument) => void;
  undo: () => void;
  redo: () => void;
  beginGesture: () => void;
  endGesture: () => void;
  play: () => void;
  stop: () => void;
  setPaused: (paused: boolean) => void;
  setWeather: (weather: "clear" | "rain") => void;
  log: (level: LogLine["level"], text: string) => void;
  clearLogs: () => void;
};

function withPast(state: EditorState, doc: SceneDocument, extra: Partial<EditorState> = {}): Partial<EditorState> {
  return {
    doc,
    past: [...state.past, JSON.stringify(state.doc)].slice(-80),
    future: [],
    gesture: false,
    lastBurst: null,
    ...extra,
  };
}

function burst(state: EditorState, key: string, doc: SceneDocument): Partial<EditorState> {
  if (state.gesture) return { doc };
  const now = Date.now();
  if (state.lastBurst && state.lastBurst.key === key && now - state.lastBurst.t < 450) {
    return { doc, lastBurst: { key, t: now } };
  }
  return { ...withPast(state, doc), lastBurst: { key, t: now } };
}

function replaceEntity(doc: SceneDocument, id: string, map: (entity: EntityData) => EntityData): SceneDocument {
  return { ...doc, entities: doc.entities.map((entity) => (entity.id === id ? map(entity) : entity)) };
}

export const useEditor = create<EditorState>((set, get) => ({
  doc: createStarterScene(),
  past: [],
  future: [],
  selectedId: "rover",
  mode: "edit",
  paused: false,
  tool: "translate",
  snap: false,
  logs: [],
  playSnapshot: null,
  gesture: false,
  hydrated: false,
  lastBurst: null,
  logSeq: 1,
  beat: 0,
  weather: "clear",

  hydrate: () => {
    const starter = createStarterScene();
    let doc = starter;
    try {
      const raw = localStorage.getItem(SCENE_STORAGE_KEY);
      if (raw) {
        const parsed = parseScene(raw);
        if (parsed) doc = parsed;
        else get().log("warn", "Saved scene was unreadable. Loaded the courtyard demo.");
      }
    } catch {
      /* private mode */
    }
    const selected =
      doc.entities.find((entity) => entity.components.some((component) => component.type === "script" && component.behavior === "player"))
        ?.id ??
      doc.entities[0]?.id ??
      null;
    set({ doc, hydrated: true, selectedId: selected, past: [], future: [], beat: 0 });
  },

  select: (id) => set({ selectedId: id }),
  setTool: (tool) => set({ tool }),
  setSnap: (snap) => set({ snap }),

  renameScene: (name) => set((state) => burst(state, "scene-name", { ...state.doc, name })),

  patchDoc: (patch) => set((state) => burst(state, "doc-patch", { ...state.doc, ...patch })),

  editBeat: (id, patch) =>
    set((state) =>
      burst(state, `beat:${id}`, {
        ...state.doc,
        story: state.doc.story.map((beat) => (beat.id === id ? { ...beat, ...patch } : beat)),
      }),
    ),

  addBeat: () =>
    set((state) => {
      const beat: StoryBeat = {
        id: `beat_${Math.random().toString(36).slice(2, 8)}`,
        kind: "dialogue",
        speaker: "",
        title: "New beat",
        body: "What the player learns here.",
      };
      return withPast(state, { ...state.doc, story: [...state.doc.story, beat] });
    }),

  removeBeat: (id) =>
    set((state) => {
      const story = state.doc.story.filter((beat) => beat.id !== id);
      if (story.length === 0) return {};
      return withPast(state, { ...state.doc, story }, { beat: Math.min(state.beat, story.length - 1) });
    }),

  moveBeat: (fromId, beforeId) =>
    set((state) => {
      if (fromId === beforeId) return {};
      const story = [...state.doc.story];
      const from = story.findIndex((beat) => beat.id === fromId);
      const before = story.findIndex((beat) => beat.id === beforeId);
      if (from < 0 || before < 0) return {};
      const [item] = story.splice(from, 1);
      if (!item) return {};
      const insertAt = story.findIndex((beat) => beat.id === beforeId);
      story.splice(insertAt < 0 ? story.length : insertAt, 0, item);
      return withPast(state, { ...state.doc, story });
    }),

  setBeat: (beat) => set({ beat }),

  advanceBeat: () =>
    set((state) => ({ beat: Math.min(state.beat + 1, Math.max(0, state.doc.story.length - 1)) })),

  updateEntity: (id, patch) =>
    set((state) => burst(state, `entity:${id}`, replaceEntity(state.doc, id, (entity) => ({ ...entity, ...patch })))),

  updateComponent: (id, index, patch) =>
    set((state) =>
      burst(
        state,
        `component:${id}:${index}`,
        replaceEntity(state.doc, id, (entity) => ({
          ...entity,
          components: entity.components.map((component, i) =>
            i === index ? ({ ...component, ...patch } as Component) : component,
          ),
        })),
      ),
    ),

  addComponent: (id, component) =>
    set((state) =>
      withPast(
        state,
        replaceEntity(state.doc, id, (entity) => {
          if (entity.components.some((existing) => existing.type === component.type)) return entity;
          return { ...entity, components: [...entity.components, component] };
        }),
      ),
    ),

  removeComponent: (id, index) =>
    set((state) =>
      withPast(
        state,
        replaceEntity(state.doc, id, (entity) => ({
          ...entity,
          components: entity.components.filter((_, i) => i !== index),
        })),
      ),
    ),

  addEntity: (entity) =>
    set((state) => withPast(state, { ...state.doc, entities: [...state.doc.entities, entity] }, { selectedId: entity.id })),

  removeSelected: () =>
    set((state) => {
      if (!state.selectedId || state.mode === "play") return {};
      const entities = state.doc.entities.filter((entity) => entity.id !== state.selectedId);
      return withPast(state, { ...state.doc, entities }, { selectedId: entities[0]?.id ?? null });
    }),

  duplicateSelected: () =>
    set((state) => {
      const current = state.doc.entities.find((entity) => entity.id === state.selectedId);
      if (!current || state.mode === "play") return {};
      const copy: EntityData = {
        ...structuredClone(current),
        id: `e_${Math.random().toString(36).slice(2, 8)}`,
        name: `${current.name} copy`,
        position: { ...current.position, x: current.position.x + 0.8 },
      };
      return withPast(state, { ...state.doc, entities: [...state.doc.entities, copy] }, { selectedId: copy.id });
    }),

  loadDoc: (doc) => set((state) => withPast(state, doc, { selectedId: doc.entities[0]?.id ?? null, mode: "edit", beat: 0 })),

  undo: () =>
    set((state) => {
      const prev = state.past[state.past.length - 1];
      if (!prev || state.mode === "play") return {};
      const doc = JSON.parse(prev) as SceneDocument;
      return {
        past: state.past.slice(0, -1),
        future: [...state.future, JSON.stringify(state.doc)],
        doc,
        gesture: false,
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[state.future.length - 1];
      if (!next || state.mode === "play") return {};
      const doc = JSON.parse(next) as SceneDocument;
      return {
        future: state.future.slice(0, -1),
        past: [...state.past, JSON.stringify(state.doc)],
        doc,
        gesture: false,
      };
    }),

  beginGesture: () =>
    set((state) => {
      if (state.gesture || state.mode === "play") return {};
      return { gesture: true, past: [...state.past, JSON.stringify(state.doc)].slice(-80), future: [] };
    }),

  endGesture: () => set({ gesture: false }),

  play: () =>
    set((state) => {
      if (state.mode === "play") return { paused: false };
      return { mode: "play", paused: false, playSnapshot: cloneDoc(state.doc), beat: 0 };
    }),

  stop: () =>
    set((state) => ({
      mode: "edit",
      paused: false,
      doc: state.playSnapshot ?? state.doc,
      playSnapshot: null,
    })),

  setPaused: (paused) => set({ paused }),
  setWeather: (weather) => set({ weather }),

  log: (level, text) =>
    set((state) => ({
      logSeq: state.logSeq + 1,
      logs: [...state.logs, { id: state.logSeq, level, text }].slice(-80),
    })),

  clearLogs: () => set({ logs: [] }),
}));

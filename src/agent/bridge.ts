import { useEditor } from "@/editor/store";
import { applyAll, canReach, cottagePlan, findPath, queryNear, validate, worldHash, worldView, type BuildOp } from "@/build/ops";
import type { AgentAsset, AgentCommand, AgentResult } from "./types";
import { findAssets, resultOf, runCommands, sceneView } from "./run";

export type HelixAgent = {
  version: "1";
  schema: "/agent/schema.json";
  catalog: () => Promise<AgentAsset[]>;
  find: (query: string) => Promise<AgentAsset[]>;
  scene: () => ReturnType<typeof sceneView>;
  world: () => ReturnType<typeof worldView>;
  validate: () => ReturnType<typeof validate>;
  query: (args: { x: number; z: number; radius: number; kind?: string }) => ReturnType<typeof queryNear>;
  reach: (from: string, to: string) => ReturnType<typeof canReach>;
  path: (from: string, to: string) => ReturnType<typeof findPath>;
  build: (commands: BuildOp[]) => Promise<{ ok: boolean; committed: boolean; results: ReturnType<typeof applyAll>["results"]; issues: ReturnType<typeof validate>; world: ReturnType<typeof worldView>; hash: string }>;
  benchmark: () => Promise<{ ok: boolean; operations: number; failed: number; ms: number; actionsPerSecond: number; cost: number; deterministic: boolean; issues: ReturnType<typeof validate> }>;
  run: (commands: AgentCommand[]) => Promise<AgentResult>;
};

let catalogCache: Promise<AgentAsset[]> | null = null;

function loadCatalog() {
  catalogCache ??= fetch("/library/manifest.json")
    .then((response) => {
      if (!response.ok) throw new Error("catalog");
      return response.json() as Promise<{ assets?: AgentAsset[] }>;
    })
    .then((data) => (Array.isArray(data.assets) ? data.assets : []))
    .catch((error) => {
      catalogCache = null;
      throw error;
    });
  return catalogCache;
}

export function installHelix() {
  const agent: HelixAgent = {
    version: "1",
    schema: "/agent/schema.json",
    catalog: () => loadCatalog(),
    find: async (query) => findAssets(await loadCatalog(), query),
    scene: () => {
      const state = useEditor.getState();
      return sceneView(state.doc, state.mode);
    },
    world: () => worldView(useEditor.getState().doc),
    validate: () => validate(useEditor.getState().doc),
    query: ({ x, z, radius, kind }) => queryNear(useEditor.getState().doc, x, z, radius, kind),
    reach: (from, to) => canReach(useEditor.getState().doc, from, to),
    path: (from, to) => findPath(useEditor.getState().doc, from, to),
    build: async (commands) => {
      const state = useEditor.getState();
      if (state.mode === "play") state.stop();
      const doc = structuredClone(useEditor.getState().doc);
      const outcome = applyAll(doc, Array.isArray(commands) ? commands.slice(0, 64) : []);
      const issues = validate(doc);
      if (outcome.committed) {
        useEditor.getState().loadDoc(doc);
        const room = doc.entities.find((entity) => entity.components.some((component) => component.type === "build" && component.kind === "room"));
        useEditor.getState().select(room?.id ?? null);
        useEditor.getState().log("info", `Built ${outcome.results.length} steps.`);
      } else {
        const failed = outcome.results.find((result) => !result.ok);
        useEditor.getState().log("warn", failed && !failed.ok ? `Build rolled back: ${failed.reason}.` : "Build rolled back.");
      }
      const current = useEditor.getState().doc;
      return { ok: outcome.committed && issues.every((issue) => issue.level !== "error"), committed: outcome.committed, results: outcome.results, issues: outcome.committed ? issues : validate(doc), world: worldView(outcome.committed ? current : doc), hash: worldHash(doc) };
    },
    benchmark: async () => {
      const started = performance.now();
      const base = structuredClone(useEditor.getState().doc);
      const once = structuredClone(base);
      const twice = structuredClone(base);
      const plan = cottagePlan();
      applyAll(once, plan);
      applyAll(twice, plan);
      const deterministic = worldHash(once) === worldHash(twice);
      const live = await agent.build(plan);
      const failed = live.results.filter((result) => !result.ok).length;
      const ms = Math.max(1, Math.round(performance.now() - started));
      return {
        ok: live.ok && deterministic,
        operations: plan.length,
        failed,
        ms,
        actionsPerSecond: Math.round((plan.length / ms) * 1000),
        cost: live.world.cost,
        deterministic,
        issues: live.issues,
      };
    },
    run: async (commands) => {
      const list = Array.isArray(commands) ? commands : [];
      let catalog: AgentAsset[] = [];
      if (list.some((command) => command && command.op === "place")) {
        try {
          catalog = await loadCatalog();
        } catch {
          const state = useEditor.getState();
          return resultOf(state.doc, state.mode, 0, [{ index: 0, error: "The catalog did not load." }]);
        }
      }
      const state = useEditor.getState();
      if (state.mode === "play") state.stop();
      const fresh = useEditor.getState();
      const outcome = runCommands(fresh.doc, catalog, list);
      const changed = JSON.stringify(outcome.doc) !== JSON.stringify(fresh.doc);
      if (changed) useEditor.getState().loadDoc(outcome.doc);
      if (outcome.selectedId !== undefined) useEditor.getState().select(outcome.selectedId);
      const note = outcome.errors.length ? `${outcome.applied} applied, ${outcome.errors.length} failed.` : `Agent applied ${outcome.applied}.`;
      useEditor.getState().log(outcome.errors.length ? "warn" : "info", note);
      const after = useEditor.getState();
      return resultOf(after.doc, after.mode, outcome.applied, outcome.errors);
    },
  };

  window.helix = agent;
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as { type?: string; id?: string; commands?: AgentCommand[] };
    if (!data || data.type !== "helix.run" || !event.source) return;
    void agent.run(data.commands ?? []).then((result) => {
      (event.source as Window).postMessage({ type: "helix.result", id: data.id ?? null, result }, event.origin);
    });
  };
  window.addEventListener("message", onMessage);
  return () => {
    window.removeEventListener("message", onMessage);
    if (window.helix === agent) delete window.helix;
  };
}

declare global {
  interface Window {
    helix?: HelixAgent;
  }
}

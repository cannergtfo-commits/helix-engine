import { useEditor } from "@/editor/store";
import type { AgentAsset, AgentCommand, AgentResult } from "./types";
import { findAssets, resultOf, runCommands, sceneView } from "./run";

export type HelixAgent = {
  version: "1";
  schema: "/agent/schema.json";
  catalog: () => Promise<AgentAsset[]>;
  find: (query: string) => Promise<AgentAsset[]>;
  scene: () => ReturnType<typeof sceneView>;
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

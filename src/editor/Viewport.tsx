import { useEffect, useRef, useState, type RefObject } from "react";
import { HelixEngine, type EngineStats } from "@/engine";
import { useEditor } from "./store";

const EMPTY_STATS: EngineStats = { fps: 0, calls: 0, triangles: 0, entities: 0 };

export function Viewport() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HelixEngine | null>(null);
  const [stats, setStats] = useState<EngineStats>(EMPTY_STATS);
  const mode = useEditor((state) => state.mode);
  const paused = useEditor((state) => state.paused);
  const sceneName = useEditor((state) => state.doc.name);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const engine = new HelixEngine(canvas, {
      onLog: (level, text) => useEditor.getState().log(level, text),
      onTransform: (id, patch) => {
        if (useEditor.getState().mode !== "edit") return;
        useEditor.getState().updateEntity(id, patch);
      },
      onGesture: (phase) => {
        if (phase === "start") useEditor.getState().beginGesture();
        else useEditor.getState().endGesture();
      },
      onSelect: (id) => useEditor.getState().select(id),
      onStats: setStats,
    });
    engineRef.current = engine;
    const initial = useEditor.getState();
    engine.apply(initial.doc);
    engine.setTool(initial.tool);
    engine.setSnap(initial.snap);
    engine.setSelected(initial.selectedId);
    if (initial.mode === "play") {
      engine.setMode("play");
      engine.setPaused(initial.paused);
    }
    engine.start();

    let prev = useEditor.getState();
    const unsub = useEditor.subscribe((state) => {
      if (state.mode !== prev.mode) {
        if (state.mode === "play") {
          engine.apply(state.doc);
          engine.setMode("play");
          engine.setPaused(state.paused);
        } else {
          engine.setMode("edit");
          engine.apply(state.doc);
          engine.setSelected(state.selectedId);
        }
      } else if (state.doc !== prev.doc && state.mode === "edit") {
        engine.apply(state.doc);
      }
      if (state.paused !== prev.paused) engine.setPaused(state.paused);
      if (state.selectedId !== prev.selectedId) engine.setSelected(state.selectedId);
      if (state.tool !== prev.tool) engine.setTool(state.tool);
      if (state.snap !== prev.snap) engine.setSnap(state.snap);
      prev = state;
    });

    const onFrame = () => engine.frame(useEditor.getState().selectedId);
    window.addEventListener("helix:frame", onFrame);

    const resize = () => engine.resize(host.clientWidth, host.clientHeight);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    return () => {
      unsub();
      window.removeEventListener("helix:frame", onFrame);
      observer.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div ref={hostRef} className="relative h-full min-h-0 w-full touch-none bg-bg">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
        <div className="rounded-md bg-bg/80 px-2.5 py-1.5 text-xs text-fg backdrop-blur-sm">
          <span className="font-medium">{sceneName}</span>
          <span className="text-muted"> · {mode === "play" ? (paused ? "Paused" : "Playing") : "Editing"}</span>
        </div>
        <div className="hidden rounded-md bg-bg/80 px-2.5 py-1.5 font-mono text-xs text-muted backdrop-blur-sm md:block">
          {stats.fps} fps · {stats.calls} draws · {stats.entities} entities
        </div>
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-muted">
        {mode === "play"
          ? "W throttle · A turns left · D turns right · S brake"
          : "Left drag orbits · right drag pans · scroll zooms · click selects"}
      </p>
      {mode === "play" ? <Stick engineRef={engineRef} /> : null}
    </div>
  );
}

function Stick({ engineRef }: { engineRef: RefObject<HelixEngine | null> }) {
  const pad = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pad.current;
    if (!el) return;
    const apply = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const radius = rect.width / 2;
      const steer = Math.max(-1, Math.min(1, -dx / radius));
      const throttle = Math.max(-1, Math.min(1, -dy / radius));
      engineRef.current?.setStick(throttle, steer);
    };
    const stop = () => engineRef.current?.setStick(0, 0);
    const down = (event: PointerEvent) => {
      el.setPointerCapture(event.pointerId);
      apply(event.clientX, event.clientY);
    };
    const move = (event: PointerEvent) => {
      if (!el.hasPointerCapture(event.pointerId)) return;
      apply(event.clientX, event.clientY);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
      stop();
    };
  }, [engineRef]);

  return (
    <div className="absolute bottom-14 left-4 md:hidden">
      <div
        ref={pad}
        className="grid h-28 w-28 place-items-center rounded-full border border-line bg-bg/70"
        aria-label="Drive stick"
        role="application"
      >
        <div className="h-10 w-10 rounded-full bg-accent" />
      </div>
    </div>
  );
}

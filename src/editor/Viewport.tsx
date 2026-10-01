import { useEffect, useRef, useState, type RefObject } from "react";
import { HelixEngine, type EngineStats } from "@/engine";
import { readDrag } from "@/studio/catalog";
import { placeDrag } from "@/studio/place";
import { useWallet } from "@/studio/wallet";
import { useEditor } from "./store";

const EMPTY_STATS: EngineStats = { fps: 0, calls: 0, triangles: 0, entities: 0 };

export function Viewport() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HelixEngine | null>(null);
  const [stats, setStats] = useState<EngineStats>(EMPTY_STATS);
  const [over, setOver] = useState(false);
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
      holdsToken: (query) => useWallet.getState().holds(query),
      onChain: (event) => {
        const editor = useEditor.getState();
        if (event.type === "pickup") {
          useWallet.getState().credit({
            chain: event.chain,
            standard: event.standard,
            contract: event.contract,
            tokenId: event.tokenId,
            amount: event.amount,
            label: event.label,
            symbol: event.symbol,
          });
          editor.log("info", `${event.label} is in the studio wallet.`);
          if (event.role === "collectible") editor.advanceBeat();
        } else if (event.type === "unlock") {
          editor.log("info", `${event.label} opened.`);
          editor.advanceBeat();
        } else {
          editor.log("warn", `${event.label} needs ${event.symbol}. Claim it on the Chain tab.`);
        }
      },
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
    <div
      ref={hostRef}
      className="relative h-full min-h-0 w-full touch-none bg-bg"
      onDragOver={(event) => {
        if (mode !== "edit") return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (useEditor.getState().mode !== "edit") return;
        const payload = readDrag(event.dataTransfer.getData("text/plain"));
        if (!payload) return;
        const point = engineRef.current?.groundPoint(event.clientX, event.clientY);
        if (!point) return;
        placeDrag(payload, point.x, point.z);
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {over && mode === "edit" ? (
        <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-md border border-accent bg-bg/70 text-sm text-fg">
          Drop on the floor
        </div>
      ) : null}
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
          ? "W drives · A turns left · D turns right · S brakes"
          : "Drag an asset in · left drag orbits · click selects"}
      </p>
      {mode === "play" ? <PlayCard /> : null}
      {mode === "play" ? <Stick engineRef={engineRef} /> : null}
    </div>
  );
}

function PlayCard() {
  const story = useEditor((state) => state.doc.story);
  const beat = useEditor((state) => state.beat);
  const holdings = useWallet((state) => state.holdings);
  const current = story[beat] ?? story[0];
  if (!current) return null;
  const symbols = holdings.map((holding) => holding.symbol).slice(0, 3).join(" · ");
  return (
    <div className="pointer-events-auto absolute top-14 left-3 max-w-64 rounded-md border border-line bg-bg/90 p-3">
      <div className="text-xs tracking-wide text-muted uppercase">{current.kind}</div>
      <div className="mt-1 text-sm font-medium text-fg">{current.title}</div>
      <p className="mt-1 text-xs text-muted">{current.body}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-muted">{symbols || "Wallet empty"}</span>
        {beat < story.length - 1 ? (
          <button type="button" className="h-8 shrink-0 rounded-md bg-raised px-2 text-xs text-fg" onClick={() => useEditor.getState().advanceBeat()}>
            Next
          </button>
        ) : null}
      </div>
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

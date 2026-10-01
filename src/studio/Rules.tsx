import { useState } from "react";
import { useEditor } from "@/editor/store";
import { grantToken, stampRule, type RuleKind } from "./rules";

const STAMPS: { kind: RuleKind; title: string; detail: string; token: string; x: number; z: number; id: string }[] = [
  { kind: "gate", title: "Gate", detail: "Shut until the wallet holds the Polygon key.", token: "KEY", x: 0, z: -3.2, id: "archive-door" },
  { kind: "loot", title: "Loot", detail: "Walking in claims the Ethereum relic.", token: "RELIC", x: 1.6, z: 0.4, id: "relic-drop" },
  { kind: "currency", title: "Purse", detail: "Adds Aether to the wallet.", token: "AETHER", x: -1.6, z: 0.4, id: "aether-drop" },
  { kind: "vendor", title: "Vendor", detail: "Takes 10 Loom. Nothing is sent on-chain.", token: "LOOM", x: 0, z: -1.2, id: "loom-stall" },
  { kind: "skin", title: "Skin", detail: "Warden trim changes while the sigil is held.", token: "SIGIL", x: 0, z: 0, id: "warden" },
];

export function Rules() {
  const [note, setNote] = useState("");

  const stamp = (kind: RuleKind) => {
    const recipe = STAMPS.find((item) => item.kind === kind);
    if (!recipe) return;
    const current = useEditor.getState().doc;
    const next = structuredClone(current);
    const error = stampRule(next, recipe);
    if (error) {
      setNote(error);
      return;
    }
    useEditor.getState().loadDoc(next);
    useEditor.getState().select(recipe.kind === "skin" ? "warden" : recipe.id);
    useEditor.getState().log("info", `${recipe.title} uses ${recipe.token}.`);
    setNote(`${recipe.title} is in the scene. Claim ${recipe.token} on Chain, then Play.`);
  };

  const grant = (token: string) => {
    const error = grantToken(token);
    setNote(error ?? `${token} is in the studio wallet.`);
  };

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h2 className="text-xs tracking-wide text-muted uppercase">Rules</h2>
        <p className="mt-1 text-xs text-muted">A chain game is a wallet check. Stamp a rule, then walk into it.</p>
      </div>
      {STAMPS.map((recipe) => (
        <article key={recipe.kind} className="rounded-md border border-line bg-surface p-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium text-fg">{recipe.title}</h3>
              <p className="mt-1 text-xs text-muted">{recipe.detail}</p>
            </div>
            <span className="font-mono text-xs text-accent">{recipe.token}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button type="button" className="h-10 rounded-md bg-raised text-xs text-fg" onClick={() => stamp(recipe.kind)}>
              Stamp
            </button>
            <button type="button" className="h-10 rounded-md bg-raised text-xs text-fg" onClick={() => grant(recipe.token)}>
              Grant
            </button>
          </div>
        </article>
      ))}
      {note ? <p className="px-1 text-xs text-muted">{note}</p> : null}
    </section>
  );
}

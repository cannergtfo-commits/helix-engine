import { characterEntity } from "@/engine/document";
import type { ChainRole, EntityData, SceneDocument, TokenStandard } from "@/engine/types";
import { CATALOG, chainFromItem, type CatalogItem } from "./catalog";
import { chainProp } from "./place";
import { useWallet } from "./wallet";

export type RuleKind = "gate" | "loot" | "currency" | "skin" | "vendor";

const ROLE: Record<RuleKind, ChainRole> = {
  gate: "gate",
  loot: "collectible",
  currency: "currency",
  skin: "skin",
  vendor: "vendor",
};

export function stampRule(
  doc: SceneDocument,
  input: {
    id?: string;
    role?: string;
    token?: string;
    chain?: string;
    standard?: string;
    contract?: string;
    tokenId?: string;
    symbol?: string;
    amount?: number;
    x?: number;
    z?: number;
    target?: string;
  },
): string | null {
  const kind = normalizeKind(input.role);
  if (!kind) return "role must be gate, loot, currency, skin, or vendor.";
  const item = resolveToken(input, kind);
  if (typeof item === "string") return item;
  const ruled = { ...item, role: ROLE[kind], label: kind === "vendor" ? `${item.label} stall` : item.label };
  if (kind === "skin") return bindSkin(doc, ruled, input.target);
  const entity = chainProp(ruled, clamp(num(input.x), -20, 20), clamp(num(input.z), -20, 20));
  entity.id = safeId(input.id) ?? kind;
  upsert(doc, entity);
  return null;
}

export function grantToken(token: string): string | null {
  const item = resolveToken({ token }, "loot");
  if (typeof item === "string") return item;
  useWallet.getState().claim(item);
  return null;
}

function bindSkin(doc: SceneDocument, item: CatalogItem, target: string | undefined): string | null {
  const id = target || "warden";
  let entity = doc.entities.find((entry) => entry.id === id);
  if (!entity && id === "warden") {
    entity = characterEntity("warden", { player: true, clip: "idle" });
    entity.id = "warden";
    entity.position = { x: 0, y: 0, z: 3.2 };
    doc.entities.push(entity);
  }
  if (!entity) return `No entity "${id}" to wear the skin.`;
  const component = chainFromItem(item);
  const index = entity.components.findIndex((entry) => entry.type === "chain");
  if (index >= 0) entity.components[index] = component;
  else entity.components.push(component);
  return null;
}

function resolveToken(
  input: {
    token?: string;
    chain?: string;
    standard?: string;
    contract?: string;
    tokenId?: string;
    symbol?: string;
    amount?: number;
  },
  kind: RuleKind,
): CatalogItem | string {
  const contract = (input.contract ?? "").trim();
  if (contract) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(contract)) return "contract must be a 0x address.";
    const standard = normalizeStandard(input.standard);
    if (!standard) return "standard must be erc20, erc721, or erc1155.";
    const symbol = (input.symbol || "TOKEN").toUpperCase().slice(0, 8);
    return {
      id: `link_${contract.slice(2, 8).toLowerCase()}`,
      chain: input.chain === "polygon" ? "polygon" : "ethereum",
      standard,
      role: ROLE[kind],
      contract,
      tokenId: standard === "erc20" ? "" : String(input.tokenId ?? "0").slice(0, 16),
      symbol,
      label: symbol,
      blurb: "Bound from a contract address.",
      amount: clamp(num(input.amount) || 1, 1, 1000000),
      tint: "#e8a54b",
    };
  }
  const needle = (input.token ?? "").trim().toLowerCase();
  if (!needle) return "Name a token, or pass a contract.";
  const pool = [...CATALOG, ...useWallet.getState().links];
  const exact = pool.find((item) => item.id.toLowerCase() === needle || item.symbol.toLowerCase() === needle || item.label.toLowerCase() === needle);
  if (exact) return exact;
  const hits = pool.filter((item) => `${item.id} ${item.symbol} ${item.label}`.toLowerCase().includes(needle));
  if (hits.length === 1) return hits[0];
  if (hits.length === 0) return `No token matches "${input.token}".`;
  return `"${input.token}" matches ${hits.length}. Use one of: ${hits.slice(0, 4).map((item) => item.symbol).join(", ")}.`;
}

function normalizeKind(role: string | undefined): RuleKind | null {
  if (role === "collectible") return "loot";
  if (role === "gate" || role === "loot" || role === "currency" || role === "skin" || role === "vendor") return role;
  return null;
}

function normalizeStandard(value: string | undefined): TokenStandard | null {
  if (value === "erc20" || value === "erc721" || value === "erc1155") return value;
  return null;
}

function upsert(doc: SceneDocument, entity: EntityData) {
  const index = doc.entities.findIndex((item) => item.id === entity.id);
  if (index >= 0) doc.entities[index] = entity;
  else doc.entities.push(entity);
}

function safeId(value: unknown) {
  if (typeof value !== "string") return null;
  return /^[a-zA-Z0-9_-]{1,40}$/.test(value) ? value : null;
}

function num(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

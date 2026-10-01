import type { AnimClip, ChainComponent, ChainId, ChainRole, CharacterKit, TokenStandard } from "@/engine/types";

export type CatalogItem = {
  id: string;
  chain: ChainId;
  standard: TokenStandard;
  role: ChainRole;
  contract: string;
  tokenId: string;
  symbol: string;
  label: string;
  blurb: string;
  amount: number;
  tint: string;
};

export type UserAsset = {
  id: string;
  name: string;
  color: string;
  shape: "box" | "sphere" | "cylinder" | "plaque";
};

export type DragPayload =
  | { kind: "prop"; shape: "box" | "sphere" | "cylinder" | "cone" | "pedestal" | "rover" | "light"; name: string }
  | { kind: "character"; kit: CharacterKit }
  | { kind: "clip"; clip: AnimClip }
  | { kind: "chain"; itemId: string }
  | { kind: "asset"; assetId: string }
  | { kind: "link"; linkId: string }
  | { kind: "model"; title: string; src: string; fit: number };

export const KITS: Array<{ id: CharacterKit; name: string; blurb: string; accent: string }> = [
  {
    id: "warden",
    name: "Warden",
    blurb: "Broad armor and a brass visor. Walks the hall and can be the player.",
    accent: "#c9863a",
  },
  {
    id: "relay",
    name: "Relay",
    blurb: "Hood, satchel, light step. A courier for tokens between rooms.",
    accent: "#9aa58b",
  },
];

export const CLIP_NOTES: Record<AnimClip, { name: string; set: string; blurb: string }> = {
  idle: { name: "Idle", set: "Field", blurb: "Weight on both feet, a slow breath." },
  walk: { name: "Walk", set: "Field", blurb: "Loop. Play uses this while the player is moving." },
  greet: { name: "Greet", set: "Ritual", blurb: "A raised hand. Drawn for the Warden." },
  strike: { name: "Strike", set: "Ritual", blurb: "A forward swing. Drawn for the Warden." },
  wave: { name: "Wave", set: "Ritual", blurb: "A quicker hello. Drawn for the Relay." },
  dash: { name: "Dash", set: "Ritual", blurb: "Lean and a sprint pose. Drawn for the Relay." },
};

export const FIELD_CLIPS: AnimClip[] = ["idle", "walk"];
export const RITUAL_CLIPS: AnimClip[] = ["greet", "strike", "wave", "dash"];

/** Studio samples. These are not live mainnet contracts. */
export const CATALOG: CatalogItem[] = [
  {
    id: "aether",
    chain: "ethereum",
    standard: "erc20",
    role: "currency",
    contract: "0xa37e00000000000000000000000000000000a17e",
    tokenId: "",
    symbol: "AETHER",
    label: "Aether",
    blurb: "Ethereum currency. Players pick it up as a balance, not a unique item.",
    amount: 25,
    tint: "#e8a54b",
  },
  {
    id: "helix-relic",
    chain: "ethereum",
    standard: "erc721",
    role: "collectible",
    contract: "0xb12c00000000000000000000000000000000b12c",
    tokenId: "12",
    symbol: "RELIC",
    label: "Helix Relic #12",
    blurb: "A one-of-one on Ethereum. Walking into it puts the relic in the wallet.",
    amount: 1,
    tint: "#c9863a",
  },
  {
    id: "warden-sigil",
    chain: "ethereum",
    standard: "erc721",
    role: "skin",
    contract: "0x51e10000000000000000000000000000000051e1",
    tokenId: "3",
    symbol: "SIGIL",
    label: "Warden Sigil",
    blurb: "Bind to a character. In play, the trim shifts while the wallet holds it.",
    amount: 1,
    tint: "#d4654a",
  },
  {
    id: "loom",
    chain: "polygon",
    standard: "erc20",
    role: "currency",
    contract: "0x1001000000000000000000000000000000001001",
    tokenId: "",
    symbol: "LOOM",
    label: "Loom",
    blurb: "Polygon currency for small pickups and shop prices.",
    amount: 10,
    tint: "#9aa58b",
  },
  {
    id: "courtyard-key",
    chain: "polygon",
    standard: "erc1155",
    role: "gate",
    contract: "0xc0de00000000000000000000000000000000c0de",
    tokenId: "7",
    symbol: "KEY",
    label: "Courtyard Key",
    blurb: "Polygon key. A door with this binding stays shut until the wallet holds one.",
    amount: 1,
    tint: "#e8a54b",
  },
  {
    id: "relay-cape",
    chain: "polygon",
    standard: "erc1155",
    role: "skin",
    contract: "0xca9e00000000000000000000000000000000ca9e",
    tokenId: "2",
    symbol: "CAPE",
    label: "Relay Cape",
    blurb: "Bind to a character for a lighter trim when the wallet holds the cape.",
    amount: 1,
    tint: "#d9d3c7",
  },
];

export function catalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function chainFromItem(item: CatalogItem): ChainComponent {
  return {
    type: "chain",
    chain: item.chain,
    standard: item.standard,
    role: item.role,
    contract: item.contract,
    tokenId: item.tokenId,
    symbol: item.symbol,
    label: item.label,
    amount: item.amount,
    tint: item.tint,
  };
}

export function holdingKey(item: { chain: ChainId; contract: string; tokenId: string }) {
  return `${item.chain}:${item.contract.toLowerCase()}:${item.tokenId}`;
}

export function readDrag(raw: string): DragPayload | null {
  if (!raw.startsWith("{")) return null;
  try {
    const data = JSON.parse(raw) as DragPayload;
    if (!data || typeof data !== "object" || !("kind" in data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function standardLabel(standard: TokenStandard) {
  if (standard === "erc20") return "ERC-20";
  if (standard === "erc721") return "ERC-721";
  return "ERC-1155";
}

export function chainLabel(chain: ChainId) {
  return chain === "ethereum" ? "Ethereum" : "Polygon";
}

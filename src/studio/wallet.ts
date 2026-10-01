import { create } from "zustand";
import type { ChainId, ChainQuery, TokenStandard } from "@/engine/types";
import { CATALOG, holdingKey, type CatalogItem, type UserAsset } from "./catalog";

export type Holding = {
  chain: ChainId;
  standard: TokenStandard;
  contract: string;
  tokenId: string;
  amount: number;
  label: string;
  symbol: string;
};

export type UserLink = CatalogItem;

type WalletState = {
  hydrated: boolean;
  connected: boolean;
  mode: "studio" | "browser";
  address: string;
  network: ChainId;
  holdings: Holding[];
  assets: UserAsset[];
  links: UserLink[];
  note: string;
  hydrate: () => void;
  setNetwork: (network: ChainId) => void;
  claim: (item: CatalogItem) => void;
  loadSamples: () => void;
  clearHoldings: () => void;
  credit: (item: Holding) => void;
  holds: (query: ChainQuery) => boolean;
  debit: (item: Holding) => void;
  connectBrowser: () => Promise<string | null>;
  addAsset: (asset: UserAsset) => void;
  removeAsset: (id: string) => void;
  addLink: (link: UserLink) => void;
  removeLink: (id: string) => void;
};

const STORAGE_KEY = "helix.studio.v1";
export const STUDIO_ADDRESS = "0x4e11c0ffee00000000000000000000000000b0a1";

type Persisted = {
  network: ChainId;
  holdings: Holding[];
  assets: UserAsset[];
  links: UserLink[];
  mode: "studio" | "browser";
  address: string;
};

function persist(state: WalletState) {
  const data: Persisted = {
    network: state.network,
    holdings: state.holdings,
    assets: state.assets,
    links: state.links,
    mode: state.mode,
    address: state.address,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

function mergeHolding(holdings: Holding[], item: Holding): Holding[] {
  const key = holdingKey(item);
  const cap = item.standard === "erc721" ? 1 : 999999;
  const existing = holdings.find((holding) => holdingKey(holding) === key);
  if (!existing) {
    return [...holdings, { ...item, amount: Math.min(cap, item.amount) }];
  }
  return holdings.map((holding) =>
    holdingKey(holding) === key ? { ...holding, amount: Math.min(cap, holding.amount + item.amount) } : holding,
  );
}

export const useWallet = create<WalletState>((set, get) => ({
  hydrated: false,
  connected: true,
  mode: "studio",
  address: STUDIO_ADDRESS,
  network: "ethereum",
  holdings: [],
  assets: [],
  links: [],
  note: "",

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const data = JSON.parse(raw) as Partial<Persisted>;
      set({
        hydrated: true,
        network: data.network === "polygon" ? "polygon" : "ethereum",
        holdings: Array.isArray(data.holdings) ? data.holdings : [],
        assets: Array.isArray(data.assets) ? data.assets : [],
        links: Array.isArray(data.links) ? data.links : [],
        mode: data.mode === "browser" ? "browser" : "studio",
        address: typeof data.address === "string" && data.address ? data.address : STUDIO_ADDRESS,
        connected: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setNetwork: (network) => {
    set({ network });
    persist(get());
  },

  claim: (item) => {
    const holdings = mergeHolding(get().holdings, item);
    set({ holdings, note: `${item.label} is in the studio wallet.` });
    persist(get());
  },

  loadSamples: () => {
    let holdings = get().holdings;
    for (const item of CATALOG) holdings = mergeHolding(holdings, item);
    set({ holdings, note: "Sample wallet loaded. Doors and skins can see these tokens." });
    persist(get());
  },

  clearHoldings: () => {
    set({ holdings: [], note: "Studio wallet cleared." });
    persist(get());
  },

  credit: (item) => {
    const holdings = mergeHolding(get().holdings, item);
    set({ holdings });
    persist(get());
  },

  holds: (query) => {
    const key = holdingKey(query);
    const found = get().holdings.find((holding) => holdingKey(holding) === key);
    if (!found) return false;
    const need = query.amount > 0 ? query.amount : 1;
    return found.amount >= need;
  },

  debit: (item) => {
    const key = holdingKey(item);
    const need = item.amount > 0 ? item.amount : 1;
    const holdings = get().holdings.flatMap((holding) => {
      if (holdingKey(holding) !== key) return [holding];
      const left = holding.amount - need;
      return left > 0 ? [{ ...holding, amount: left }] : [];
    });
    set({ holdings, note: `Spent ${need} ${item.symbol}.` });
    persist(get());
  },

  connectBrowser: async () => {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum;
    if (!eth) {
      set({ note: "No browser wallet here. The studio wallet still works for testing." });
      return "No browser wallet here. The studio wallet still works for testing.";
    }
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const chainId = (await eth.request({ method: "eth_chainId" })) as string;
      const network: ChainId = chainId === "0x89" ? "polygon" : "ethereum";
      const address = accounts[0] ?? STUDIO_ADDRESS;
      set({
        connected: true,
        mode: "browser",
        address,
        network,
        note: "Browser wallet connected. Sample tokens stay local so nothing is spent.",
      });
      persist(get());
      return null;
    } catch {
      set({ note: "The wallet request was dismissed." });
      return "The wallet request was dismissed.";
    }
  },

  addAsset: (asset) => {
    set({ assets: [...get().assets, asset], note: `${asset.name} is in your library.` });
    persist(get());
  },

  removeAsset: (id) => {
    set({ assets: get().assets.filter((asset) => asset.id !== id) });
    persist(get());
  },

  addLink: (link) => {
    set({ links: [...get().links, link], note: `${link.label} can be placed like any sample.` });
    persist(get());
  },

  removeLink: (id) => {
    set({ links: get().links.filter((link) => link.id !== id) });
    persist(get());
  },
}));

export function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

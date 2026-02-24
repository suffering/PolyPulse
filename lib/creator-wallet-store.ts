import { promises as fs } from "fs";
import path from "path";

type WalletStore = {
  byCreatorId: Record<string, string>;
  byHandle: Record<string, string>;
  updatedAt: string;
};

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "creator-wallets.json");

let loaded = false;
let store: WalletStore = {
  byCreatorId: {},
  byHandle: {},
  updatedAt: new Date(0).toISOString(),
};
let loadPromise: Promise<void> | null = null;
let savePromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const raw = await fs.readFile(CACHE_FILE, "utf8");
      const parsed = JSON.parse(raw) as Partial<WalletStore>;
      store = {
        byCreatorId: parsed.byCreatorId ?? {},
        byHandle: parsed.byHandle ?? {},
        updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
      };
    } catch {
      // File doesn't exist (or is invalid) on first run; we'll create it on first save.
    } finally {
      loaded = true;
    }
  })();
  return loadPromise;
}

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

export async function getStoredWalletByCreatorId(creatorId: string): Promise<string | null> {
  await ensureLoaded();
  return store.byCreatorId[creatorId] ?? null;
}

export async function getStoredWalletByHandle(handle: string): Promise<string | null> {
  await ensureLoaded();
  const key = normalizeHandle(handle);
  return store.byHandle[key] ?? null;
}

export async function setStoredWallet(args: {
  creatorId?: string | null;
  handle?: string | null;
  wallet: string;
}): Promise<void> {
  await ensureLoaded();
  const wallet = args.wallet;
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) return;

  if (args.creatorId) {
    store.byCreatorId[String(args.creatorId)] = wallet;
  }
  if (args.handle) {
    store.byHandle[normalizeHandle(String(args.handle))] = wallet;
  }
  store.updatedAt = new Date().toISOString();

  if (!savePromise) {
    savePromise = (async () => {
      try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.writeFile(CACHE_FILE, JSON.stringify(store, null, 2), "utf8");
      } finally {
        savePromise = null;
      }
    })();
  }
  await savePromise;
}


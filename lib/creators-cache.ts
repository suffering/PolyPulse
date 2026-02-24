import { aggregateCreatorStats, type CreatorStats } from "./polymarket";
import { enrichCreatorWallets } from "./creator-wallet-resolver";

type CachedCreators = {
  creators: CreatorStats[];
  lastUpdated: string;
  walletCoverage: { resolved: number; total: number };
};

let cachedCreators: CachedCreators | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;
let inflightWalletEnrichment: Promise<void> | null = null;

function computeWalletCoverage(creators: CreatorStats[]) {
  const total = creators.length;
  const resolved = creators.filter((c) => Boolean(c.walletAddress)).length;
  return { resolved, total };
}

async function enrichWalletsBestEffort(creators: CreatorStats[]) {
  if (inflightWalletEnrichment) return inflightWalletEnrichment;
  inflightWalletEnrichment = (async () => {
    try {
      await enrichCreatorWallets(creators, { concurrency: 8 });
    } finally {
      inflightWalletEnrichment = null;
    }
  })();
  return inflightWalletEnrichment;
}

export async function getCachedCreators(): Promise<CachedCreators> {
  const now = Date.now();
  if (cachedCreators && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCreators;
  }

  const creators = await aggregateCreatorStats();

  const payload: CachedCreators = {
    creators,
    lastUpdated: new Date().toISOString(),
    walletCoverage: computeWalletCoverage(creators),
  };

  cachedCreators = payload;
  cacheTimestamp = now;

  // Kick off wallet enrichment in background
  const enrichPromise = enrichWalletsBestEffort(creators).then(() => {
    if (cachedCreators) {
      cachedCreators.walletCoverage = computeWalletCoverage(cachedCreators.creators);
      cachedCreators.lastUpdated = new Date().toISOString();
    }
  });

  await Promise.race([
    enrichPromise,
    new Promise<void>((resolve) => setTimeout(resolve, 1200)),
  ]);

  if (cachedCreators) {
    cachedCreators.walletCoverage = computeWalletCoverage(cachedCreators.creators);
  }
  return cachedCreators;
}

export function findCreatorById(creators: CreatorStats[], slug: string): CreatorStats | null {
  const decoded = tryDecode(slug);
  const isWallet = /^0x[a-fA-F0-9]{40}$/.test(slug);
  
  for (const c of creators) {
    if (isWallet && c.walletAddress === slug) return c;
    if (c.id === slug || c.id === decoded) return c;
    if (c.walletAddress === decoded) return c;
    if (c.handle && (c.handle === decoded || c.handle === slug.replace(/^@/, ""))) return c;
  }
  
  return null;
}

export function getCreatorId(creators: CreatorStats[], slug: string): string | null {
  const creator = findCreatorById(creators, slug);
  return creator?.id ?? null;
}

function tryDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

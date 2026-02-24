import type { CreatorStats, PublicProfile } from "./polymarket";
import { setStoredWallet, getStoredWalletByCreatorId, getStoredWalletByHandle } from "./creator-wallet-store";

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

type SearchProfile = {
  id: string;
  name: string | null;
  pseudonym: string | null;
  proxyWallet: string | null;
};

type PublicSearchResponse = {
  profiles?: SearchProfile[] | null;
};

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractXHandleFromUrl(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:https?:\/\/)?(?:www\.)?x\.com\/([A-Za-z0-9_]{1,30})/i);
  return m ? m[1] : null;
}

function extractWalletFromUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  const delays = [250, 750, 1500];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (res.status !== 429 && res.status < 500) return res;
      if (attempt === delays.length) return res;
      await sleep(delays[attempt]);
    } catch (e) {
      lastErr = e;
      if (attempt === delays.length) break;
      await sleep(delays[attempt]);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Network error");
}

async function publicSearchProfiles(query: string, limit = 50): Promise<SearchProfile[]> {
  const params = new URLSearchParams({
    q: query,
    search_profiles: "true",
    limit_per_type: String(limit),
    optimized: "true",
  });
  const res = await fetchWithRetry(`${GAMMA_API_BASE}/public-search?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as PublicSearchResponse;
  return Array.isArray(data.profiles) ? data.profiles : [];
}

async function fetchPublicProfileByWallet(wallet: string): Promise<PublicProfile | null> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) return null;
  const res = await fetchWithRetry(
    `${GAMMA_API_BASE}/public-profile?address=${encodeURIComponent(wallet)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return {
    name: data.name ?? null,
    pseudonym: data.pseudonym ?? null,
    profileImage: data.profileImage ?? null,
    xUsername: data.xUsername ?? null,
    proxyWallet: data.proxyWallet ?? null,
  };
}

async function verifyCandidateWallet(args: {
  wallet: string;
  handle?: string | null; // X username (from Gamma xUsername)
  name?: string | null;
}): Promise<boolean> {
  const profile = await fetchPublicProfileByWallet(args.wallet);
  if (!profile) return false;

  const handle = args.handle ? normalizeHandle(args.handle) : "";
  if (handle) {
    const x = (profile.xUsername ?? "").toLowerCase().replace(/^@/, "");
    // If xUsername is present, it must match the creator handle.
    if (x && x !== handle) return false;
  }

  if (args.name) {
    const n = normalizeName(args.name);
    const profileName = profile.name ? normalizeName(profile.name) : "";
    if (profileName && profileName !== n && args.handle == null) {
      // Only enforce strict name match when we don't have a handle to anchor identity.
      return false;
    }
  }

  return true;
}

export async function resolveCreatorWallet(creator: Pick<CreatorStats, "id" | "name" | "handle" | "url" | "walletAddress">): Promise<string | null> {
  if (creator.walletAddress && /^0x[a-fA-F0-9]{40}$/.test(creator.walletAddress)) return creator.walletAddress;

  const urlWallet = extractWalletFromUrl(creator.url ?? null);
  if (urlWallet) {
    const ok = await verifyCandidateWallet({ wallet: urlWallet, handle: creator.handle, name: creator.name });
    if (ok) {
      await setStoredWallet({ creatorId: creator.id, handle: creator.handle, wallet: urlWallet });
      return urlWallet;
    }
  }

  const storedById = await getStoredWalletByCreatorId(creator.id);
  if (storedById) return storedById;
  if (creator.handle) {
    const storedByHandle = await getStoredWalletByHandle(creator.handle);
    if (storedByHandle) return storedByHandle;
  }

  const xHandle = creator.handle
    ? normalizeHandle(creator.handle)
    : normalizeHandle(extractXHandleFromUrl(creator.url ?? null) ?? "");

  if (xHandle) {
    const profiles = await publicSearchProfiles(`@${xHandle}`, 50);
    const candidates = profiles
      .filter((p) => p.proxyWallet && /^0x[a-fA-F0-9]{40}$/.test(p.proxyWallet))
      .map((p) => {
        const scoreNameExact = p.name ? (normalizeName(p.name) === normalizeName(creator.name) ? 100 : 0) : 0;
        const scoreNamePartial =
          p.name && scoreNameExact === 0
            ? (normalizeName(p.name).includes(normalizeName(creator.name)) ||
              normalizeName(creator.name).includes(normalizeName(p.name)))
              ? 25
              : 0
            : 0;
        return { p, score: scoreNameExact + scoreNamePartial };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p)
      .slice(0, 6);

    for (const candidate of candidates) {
      if (!candidate.proxyWallet) continue;
      const ok = await verifyCandidateWallet({
        wallet: candidate.proxyWallet,
        handle: xHandle,
        name: creator.name,
      });
      if (ok) {
        await setStoredWallet({ creatorId: creator.id, handle: xHandle, wallet: candidate.proxyWallet });
        return candidate.proxyWallet;
      }
    }
  }

  // Fallback: exact name match only when it's unambiguous.
  const profilesByName = await publicSearchProfiles(creator.name, 50);
  const nameNorm = normalizeName(creator.name);
  const exactName = profilesByName.filter((p) => p.proxyWallet && p.name && normalizeName(p.name) === nameNorm);
  if (exactName.length === 1 && exactName[0].proxyWallet) {
    const wallet = exactName[0].proxyWallet;
    const ok = await verifyCandidateWallet({ wallet, name: creator.name });
    if (ok) {
      await setStoredWallet({ creatorId: creator.id, handle: creator.handle, wallet });
      return wallet;
    }
  }

  return null;
}

export async function enrichCreatorWallets(creators: CreatorStats[], options?: { concurrency?: number }): Promise<void> {
  const concurrency = Math.max(1, Math.min(options?.concurrency ?? 8, 12));
  const queue = creators.filter((c) => !c.walletAddress);
  let idx = 0;

  async function worker() {
    while (true) {
      const i = idx;
      idx += 1;
      if (i >= queue.length) return;
      const c = queue[i];
      const wallet = await resolveCreatorWallet(c);
      if (wallet) c.walletAddress = wallet;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()));
}


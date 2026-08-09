import type { WalletState } from "./types";
import { DEFAULT_WALLET_STATE } from "./types";
import { loadWalletFromStorage, clearWalletStorage } from "./storage";
import { getWalletService } from "./wallet-service";
import { verifyAuthSignature } from "./auth";

export const walletKeys = {
  all: ["wallet"] as const,
  connection: () => ["wallet", "connection"] as const,
  balance: (address: string) => ["wallet", "balance", address] as const,
  approvals: (address: string) => ["wallet", "approvals", address] as const,
};

const service = getWalletService();

/** Read-only: no MetaMask popup. Returns null if no injected provider. */
async function getConnectedAccountsFromWallet(): Promise<string[] | null> {
  if (typeof window === "undefined") return null;
  const ethereum = (
    window as unknown as {
      ethereum?: { request?: (args: { method: string }) => Promise<unknown> };
    }
  ).ethereum;
  if (!ethereum?.request) return null;
  try {
    const accounts = (await ethereum.request({ method: "eth_accounts" })) as
      | string[]
      | undefined;
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function storedAddressIsAuthorized(storedAddress: string, accounts: string[]): boolean {
  const want = storedAddress.toLowerCase();
  return accounts.some((a) => typeof a === "string" && a.toLowerCase() === want);
}

export async function fetchConnectionState(): Promise<WalletState> {
  const stored = await loadWalletFromStorage();
  if (!stored?.address || !stored.signature || !stored.message) {
    return DEFAULT_WALLET_STATE;
  }

  if (!verifyAuthSignature(stored.message, stored.signature, stored.address)) {
    clearWalletStorage();
    return DEFAULT_WALLET_STATE;
  }

  const accounts = await getConnectedAccountsFromWallet();
  if (
    accounts === null ||
    accounts.length === 0 ||
    !storedAddressIsAuthorized(stored.address, accounts)
  ) {
    clearWalletStorage();
    return DEFAULT_WALLET_STATE;
  }

  const [balance, approvals] = await Promise.all([
    service.getUSDCBalance(stored.address).catch(() => 0),
    service.getApprovals(stored.address).catch(() => ({ usdc: false, ctf: false })),
  ]);
  return {
    address: stored.address,
    balance,
    isConnected: true,
    chainId: stored.chainId,
    lastSync: new Date(),
    approvals,
    connectionType: "browser_extension",
    auth: {
      nonce: stored.nonce,
      issuedAt: stored.issuedAt,
      message: stored.message,
      signature: stored.signature,
    },
  };
}

export async function fetchBalance(address: string): Promise<number> {
  return service.getUSDCBalance(address);
}

export async function fetchApprovals(address: string): Promise<WalletState["approvals"]> {
  return service.getApprovals(address);
}

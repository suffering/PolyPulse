import type { WalletState } from "./types";
import { DEFAULT_WALLET_STATE } from "./types";
import { loadWalletFromStorage } from "./storage";
import { getWalletService } from "./wallet-service";

export const walletKeys = {
  all: ["wallet"] as const,
  connection: () => ["wallet", "connection"] as const,
  balance: (address: string) => ["wallet", "balance", address] as const,
  approvals: (address: string) => ["wallet", "approvals", address] as const,
};

const service = getWalletService();

export async function fetchConnectionState(): Promise<WalletState> {
  const stored = await loadWalletFromStorage();
  if (stored?.address) {
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
    };
  }
  return DEFAULT_WALLET_STATE;
}

export async function fetchBalance(address: string): Promise<number> {
  return service.getUSDCBalance(address);
}

export async function fetchApprovals(address: string): Promise<WalletState["approvals"]> {
  return service.getApprovals(address);
}

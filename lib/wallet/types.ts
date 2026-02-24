/**
 * Wallet integration types.
 */

export type ConnectionType = "browser_extension" | null;

export interface WalletApprovals {
  usdc: boolean;
  ctf: boolean;
}

export interface WalletState {
  address: string | null;
  balance: number;
  isConnected: boolean;
  chainId: number | null;
  lastSync: Date | null;
  approvals: WalletApprovals;
  connectionType: ConnectionType;
}

export interface StoredWalletData {
  address: string;
  chainId: number;
  lastConnected: number;
  connectionType: "browser_extension";
}

export type WalletErrorCode =
  | "NO_WALLET"
  | "WRONG_NETWORK"
  | "USER_REJECTED"
  | "RPC_FAILED"
  | "SESSION_EXPIRED"
  | "UNKNOWN";

export interface WalletError {
  code: WalletErrorCode;
  message: string;
  cause?: unknown;
}

export function createWalletError(
  code: WalletErrorCode,
  message: string,
  cause?: unknown
): WalletError {
  return { code, message, cause };
}

export const DEFAULT_WALLET_STATE: WalletState = {
  address: null,
  balance: 0,
  isConnected: false,
  chainId: null,
  lastSync: null,
  approvals: { usdc: false, ctf: false },
  connectionType: null,
};

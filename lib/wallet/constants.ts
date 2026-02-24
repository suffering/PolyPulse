/**
 * Polymarket wallet integration constants.
 * Polygon mainnet (chainId: 137).
 */

export const POLYGON_CHAIN_ID = 137;

export const CONTRACT_ADDRESSES = {
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  CTF: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
  CLOB_EXCHANGE: "0x4bFB41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
} as const;

export const RPC_ENDPOINTS = [
  "https://polygon-rpc.com",
  "https://rpc-mainnet.matic.network",
  "https://polygon-mainnet.public.blastapi.io",
] as const;

export const USDC_DECIMALS = 6;

/** ERC20: balanceOf, allowance */
export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
] as const;

/** ERC1155: isApprovedForAll */
export const ERC1155_APPROVAL_ABI = [
  "function isApprovedForAll(address account, address operator) view returns (bool)",
] as const;

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  retryableErrorPatterns: [
    "insufficient funds",
    "nonce too low",
    "replacement transaction underpriced",
    "network",
    "timeout",
    "ECONNRESET",
    "ETIMEDOUT",
  ] as const,
} as const;

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

export const STORAGE_KEY = "wallet_state";
export const PBKDF2_ITERATIONS = 100_000;

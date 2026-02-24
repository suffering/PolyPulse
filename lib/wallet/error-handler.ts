import { RETRY_CONFIG } from "./constants";
import type { WalletErrorCode } from "./types";

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return RETRY_CONFIG.retryableErrorPatterns.some((p) => lower.includes(p));
}

/**
 * Execute an async operation with exponential backoff retry.
 * Delays: initialDelayMs, initialDelayMs * multiplier, initialDelayMs * multiplier^2
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    isRetryable?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    initialDelayMs = RETRY_CONFIG.initialDelayMs,
    backoffMultiplier = RETRY_CONFIG.backoffMultiplier,
    isRetryable = isRetryableError,
  } = config;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || !isRetryable(err)) throw err;
      const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export function normalizeWalletError(error: unknown): { code: WalletErrorCode; message: string } {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return { code: "USER_REJECTED", message: "Connection cancelled" };
  }
  if (lower.includes("wrong network") || lower.includes("chain") || lower.includes("network")) {
    return { code: "WRONG_NETWORK", message: "Please switch to Polygon network" };
  }
  if (lower.includes("no provider") || lower.includes("metamask") || lower.includes("injected")) {
    return { code: "NO_WALLET", message: "Please install a Web3 wallet to connect" };
  }
  if (lower.includes("rpc") || lower.includes("all rpc")) {
    return { code: "RPC_FAILED", message: "Couldn't reach the network. Check your connection and try again." };
  }
  if (lower.includes("session") || lower.includes("expired")) {
    return { code: "SESSION_EXPIRED", message: "Session expired due to inactivity" };
  }

  return { code: "UNKNOWN", message: msg || "Something went wrong" };
}

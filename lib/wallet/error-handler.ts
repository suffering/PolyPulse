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

function getProviderErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as { code?: unknown; data?: { originalError?: { code?: unknown } } };
  if (typeof record.code === "number") return record.code;
  if (typeof record.code === "string" && /^-?\d+$/.test(record.code)) {
    return Number(record.code);
  }
  const nested = record.data?.originalError?.code;
  if (typeof nested === "number") return nested;
  return undefined;
}

export function normalizeWalletError(error: unknown): { code: WalletErrorCode; message: string } {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  const code = getProviderErrorCode(error);

  if (
    code === 4001 ||
    lower.includes("signature_rejected") ||
    lower.includes("signature rejected") ||
    lower.includes("user rejected the signature") ||
    lower.includes("signature request rejected")
  ) {
    if (
      lower.includes("sign") ||
      (error instanceof Error && error.name === "SIGNATURE_REJECTED")
    ) {
      return {
        code: "SIGNATURE_REJECTED",
        message: "Signature rejected — connection cancelled",
      };
    }
  }

  if (
    code === 4001 ||
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("connection cancelled")
  ) {
    return { code: "USER_REJECTED", message: "Connection cancelled" };
  }
  if (
    lower.includes("please switch to polygon") ||
    lower.includes("wrong network") ||
    lower.includes("switch to polygon")
  ) {
    return { code: "WRONG_NETWORK", message: "Please switch to Polygon network" };
  }
  if (
    lower.includes("no web3 wallet") ||
    lower.includes("no wallet") ||
    lower.includes("no provider") ||
    lower.includes("install metamask") ||
    lower.includes("install a web3")
  ) {
    return {
      code: "NO_WALLET",
      message: "No wallet detected — install MetaMask",
    };
  }
  if (lower.includes("rpc") || lower.includes("all rpc") || lower.includes("network error")) {
    return {
      code: "RPC_FAILED",
      message: "Couldn't reach the network. Check your connection and try again.",
    };
  }
  if (lower.includes("session") || lower.includes("expired")) {
    return { code: "SESSION_EXPIRED", message: "Session expired due to inactivity" };
  }
  if (lower.includes("signature") && (lower.includes("invalid") || lower.includes("verify"))) {
    return { code: "SIGNATURE_REJECTED", message: "Could not verify wallet signature" };
  }

  return { code: "UNKNOWN", message: msg || "Something went wrong" };
}

export { getProviderErrorCode };

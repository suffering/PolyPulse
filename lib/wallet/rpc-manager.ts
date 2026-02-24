import { JsonRpcProvider } from "ethers";
import { RPC_ENDPOINTS } from "./constants";

let currentIndex = 0;

export function getNextRpcUrl(): string {
  const url = RPC_ENDPOINTS[currentIndex];
  currentIndex = (currentIndex + 1) % RPC_ENDPOINTS.length;
  return url;
}

export function getPrimaryRpcUrl(): string {
  return RPC_ENDPOINTS[0];
}

export function createProvider(url?: string): JsonRpcProvider {
  return new JsonRpcProvider(url ?? getPrimaryRpcUrl());
}

/**
 * Execute an operation with RPC failover. Tries each endpoint in order until one succeeds.
 */
export async function executeWithFailover<T>(
  operation: (provider: JsonRpcProvider) => Promise<T>
): Promise<T> {
  const errors: Error[] = [];
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const provider = new JsonRpcProvider(endpoint);
      return await operation(provider);
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error(String(err)));
      continue;
    }
  }
  const combined = new Error(
    `All RPC endpoints failed. Last error: ${errors[errors.length - 1]?.message ?? "unknown"}`
  );
  (combined as Error & { causes?: Error[] }).causes = errors;
  throw combined;
}

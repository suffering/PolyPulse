import { verifyMessage } from "ethers";

export interface AuthMessageFields {
  address: string;
  nonce: string;
  issuedAt: string;
}

export interface VerifiedAuthSession {
  address: string;
  nonce: string;
  issuedAt: string;
  message: string;
  signature: string;
}

/** Client-generated nonce when no backend auth endpoint exists. */
export function generateAuthNonce(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildAuthMessage(fields: AuthMessageFields): string {
  return [
    "PolyPulse login",
    `Address: ${fields.address}`,
    `Nonce: ${fields.nonce}`,
    `Issued: ${fields.issuedAt}`,
  ].join("\n");
}

export function verifyAuthSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recovered = verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

export function createAuthMessageForAddress(address: string): {
  nonce: string;
  issuedAt: string;
  message: string;
} {
  const nonce = generateAuthNonce();
  const issuedAt = new Date().toISOString();
  return {
    nonce,
    issuedAt,
    message: buildAuthMessage({ address, nonce, issuedAt }),
  };
}

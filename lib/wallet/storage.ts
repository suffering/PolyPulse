import { STORAGE_KEY, PBKDF2_ITERATIONS } from "./constants";
import type { StoredWalletData } from "./types";

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const TAG_LENGTH = 128;

function getStoragePassword(): string {
  if (typeof window === "undefined") return "default";
  const ua = navigator.userAgent;
  const lang = navigator.language;
  return `${ua}-${lang}`;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    enc.encode(data)
  );
  const combined = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(cipher), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encrypted: string, password: string): Promise<string> {
  const raw = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const salt = raw.slice(0, SALT_LENGTH);
  const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const cipher = raw.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(password, salt);
  const dec = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    cipher
  );
  return new TextDecoder().decode(dec);
}

export async function saveWalletToStorage(data: StoredWalletData): Promise<void> {
  if (typeof window === "undefined") return;
  const password = getStoragePassword();
  const json = JSON.stringify(data);
  const encoded = await encrypt(json, password);
  localStorage.setItem(STORAGE_KEY, encoded);
}

export async function loadWalletFromStorage(): Promise<StoredWalletData | null> {
  if (typeof window === "undefined") return null;
  const encoded = localStorage.getItem(STORAGE_KEY);
  if (!encoded) return null;
  try {
    const password = getStoragePassword();
    const json = await decrypt(encoded, password);
    const data = JSON.parse(json) as StoredWalletData;
    if (!data.address || !data.chainId || data.connectionType !== "browser_extension") {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearWalletStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

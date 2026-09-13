import { appConfig } from "@/config/app";

export interface SharedSecretPayload {
  secret: string;
  title?: string;
}

export interface CreateSecretOptions {
  expiresInSeconds?: number; // 3600 (1h), 86400 (24h), 604800 (7d)
  viewsRemaining?: number; // 1 (burn on read), 3, 5, 10
}

export interface CreatedSecretLink {
  secretId: string;
  shareUrl: string;
  expiresAt: string;
  viewsRemaining: number;
}

export interface DecryptedSecretResult {
  secret: string;
  title?: string;
  burned: boolean;
  viewsRemaining: number;
  expiresAt: string;
}

/**
 * Encrypts a secret client-side with an ephemeral AES-GCM-256 key.
 * The encryption key NEVER touches the server and is embedded solely in the URL hash fragment.
 */
export async function createEncryptedSecretLink(
  payload: SharedSecretPayload,
  options: CreateSecretOptions = {}
): Promise<CreatedSecretLink> {
  const expiresInSeconds = options.expiresInSeconds || 86400;
  const viewsRemaining = options.viewsRemaining || 1;

  // 1. Generate ephemeral 256-bit AES-GCM key
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // 2. Encrypt the secret payload client-side
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(JSON.stringify(payload));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    plaintextBytes
  );

  // 3. Convert ciphertext and IV to Base64
  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  const encryptedBlob = btoa(String.fromCharCode(...ciphertextBytes));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  // 4. Send ONLY ciphertext and IV to server (Zero-Knowledge: server never sees the key)
  const res = await fetch(`${appConfig.apiUrl}/api/secrets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      encryptedBlob,
      iv: ivBase64,
      viewsRemaining,
      expiresInSeconds,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create secure secret link on server");
  }

  const { secretId, expiresAt } = await res.json();

  // 5. Convert raw key to URL-safe Base64 for the hash fragment
  const keyBase64Url = btoa(String.fromCharCode(...rawKey))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/share/${secretId}#key=${keyBase64Url}`;

  return {
    secretId,
    shareUrl,
    expiresAt,
    viewsRemaining,
  };
}

/**
 * Fetches the ciphertext from the server and decrypts it using the key from the URL hash.
 */
export async function fetchAndDecryptSecret(
  secretId: string,
  keyBase64Url: string
): Promise<DecryptedSecretResult> {
  if (!keyBase64Url) {
    throw new Error("Missing decryption key in URL hash fragment");
  }

  // 1. Fetch ciphertext from server first
  const res = await fetch(`${appConfig.apiUrl}/api/secrets/${secretId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "This secret link does not exist, has expired, or has already been burned.");
  }

  const data = await res.json();
  const { encryptedBlob, iv: ivBase64, burned, viewsRemaining, expiresAt } = data;

  // 2. Reconstruct raw key from URL-safe Base64
  let base64 = keyBase64Url.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  let binaryKey: string;
  try {
    binaryKey = atob(base64);
  } catch {
    throw new Error("Invalid decryption key format in URL hash fragment.");
  }

  const rawKey = new Uint8Array(binaryKey.length);
  for (let i = 0; i < binaryKey.length; i++) {
    rawKey[i] = binaryKey.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // 3. Decode ciphertext and IV
  const binaryCipher = atob(encryptedBlob);
  const ciphertext = new Uint8Array(binaryCipher.length);
  for (let i = 0; i < binaryCipher.length; i++) {
    ciphertext[i] = binaryCipher.charCodeAt(i);
  }

  const binaryIv = atob(ivBase64);
  const iv = new Uint8Array(binaryIv.length);
  for (let i = 0; i < binaryIv.length; i++) {
    iv[i] = binaryIv.charCodeAt(i);
  }

  // 4. Decrypt client-side
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);
  const payload: SharedSecretPayload = JSON.parse(decryptedText);

  return {
    secret: payload.secret,
    title: payload.title,
    burned,
    viewsRemaining,
    expiresAt,
  };
}

/**
 * Lokker FIDO2 & WebAuthn Passkey Cryptography Engine
 * Native Web Crypto API implementation of ECDSA P-256 (ES256) passkey keypairs,
 * SPKI public key serialization, credential IDs, and challenge assertions.
 */

import { PasskeyEntry } from "@/types";
import { generateId, randomHex } from "./id";
import { bufferToBase64, base64ToBuffer } from "./crypto";

/**
 * Encodes an ArrayBuffer or Uint8Array to a Base64URL string (RFC 4648).
 */
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodes a Base64URL string to an ArrayBuffer.
 */
export function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64ToBuffer(base64);
}

/**
 * Generates a new FIDO2 Passkey credential (ES256 / ECDSA P-256) entirely on-device.
 */
export async function createPasskeyCredential(params: {
  websiteName: string;
  rpId: string;
  userName: string;
  userDisplayName?: string;
}): Promise<PasskeyEntry> {
  if (!params.rpId) throw new Error("Relying Party ID (domain) is required to create a Passkey.");
  if (!params.userName) throw new Error("Username is required to create a Passkey.");

  const cleanRpId = params.rpId.toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");

  // Generate ECDSA P-256 (ES256, algorithm -7) keypair via Web Crypto
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  // Export public key to SPKI (SubjectPublicKeyInfo) base64
  const spkiBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeySpkiBase64 = bufferToBase64(new Uint8Array(spkiBuffer));

  // Export private key to JWK
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const privateKeyJson = JSON.stringify(privateKeyJwk);

  // Generate random 16-byte credential ID encoded in base64url
  const credIdBytes = new Uint8Array(16);
  window.crypto.getRandomValues(credIdBytes);
  const credentialId = bufferToBase64Url(credIdBytes);

  const now = Date.now();

  return {
    id: generateId("passkey"),
    websiteName: params.websiteName.trim() || cleanRpId,
    rpId: cleanRpId,
    userName: params.userName.trim(),
    userDisplayName: params.userDisplayName?.trim(),
    credentialId,
    publicKey: publicKeySpkiBase64,
    privateKeyJwk: privateKeyJson,
    algorithm: -7, // ES256
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Signs a challenge with the passkey's private key for WebAuthn authentication assertion.
 */
export async function signPasskeyAssertion(
  privateKeyJwkJson: string,
  challengeBuffer: BufferSource
): Promise<ArrayBuffer> {
  const jwk = JSON.parse(privateKeyJwkJson);
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"]
  );

  return window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    challengeBuffer
  );
}

/**
 * Formats a raw SPKI base64 string into standard PEM format for human inspection.
 */
export function formatSpkiToPem(spkiBase64: string): string {
  const lines = spkiBase64.match(/.{1,64}/g) || [spkiBase64];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
}

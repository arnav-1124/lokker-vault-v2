/**
 * WebCrypto implementation for Lokker Browser Extension.
 * Supports:
 * - V2 3-tier VEK Envelope Decryption (Password KEK -> unwraps VEK -> decrypts vault payload)
 * - V1 Legacy direct KEK fallback
 */

const PBKDF2_ITERATIONS = 100000;

export function base64ToArrayBuffer(base64) {
  if (!base64) return new Uint8Array(0);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function deriveKeyGcm(masterPassword, saltUint8) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltUint8,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
}

/**
 * Decrypts a Lokker vault payload using Master Password.
 * Supports both full VaultMetadata (V2 VEK envelope) and direct ciphertext payloads.
 */
export async function decryptVaultEnvelope(vaultMeta, masterPassword) {
  if (!vaultMeta || !masterPassword) {
    throw new Error('Vault metadata and master password are required.');
  }

  const encryptedVault = vaultMeta.encryptedVault || vaultMeta;
  if (!encryptedVault || !encryptedVault.cipherText) {
    throw new Error('Incomplete vault payload. Please open your Lokker Web Vault tab to sync.');
  }

  const decoder = new TextDecoder();

  // Case 1: V2 Envelope Encryption with wrapped VEK
  if (vaultMeta.wrappedVekByPassword && vaultMeta.salt) {
    try {
      const kekSalt = new Uint8Array(base64ToArrayBuffer(vaultMeta.salt));
      const kek = await deriveKeyGcm(masterPassword, kekSalt);

      const wrappedVekIv = new Uint8Array(base64ToArrayBuffer(vaultMeta.wrappedVekByPassword.iv));
      const wrappedVekCipher = new Uint8Array(base64ToArrayBuffer(vaultMeta.wrappedVekByPassword.cipherText));

      // Unwrap VEK
      const vek = await crypto.subtle.unwrapKey(
        'raw',
        wrappedVekCipher,
        kek,
        { name: 'AES-GCM', iv: wrappedVekIv },
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt', 'encrypt']
      );

      // Decrypt vault payload with VEK
      const vaultIv = new Uint8Array(base64ToArrayBuffer(encryptedVault.iv));
      const vaultCipher = new Uint8Array(base64ToArrayBuffer(encryptedVault.cipherText));

      const decryptedVaultBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: vaultIv },
        vek,
        vaultCipher
      );

      const jsonStr = decoder.decode(decryptedVaultBuffer);
      return JSON.parse(jsonStr);
    } catch (e) {
      // If verification fails on envelope, do not hide error unless trying legacy fallback
    }
  }

  // Case 2: V1 Legacy direct KEK fallback
  const saltToUse = encryptedVault.salt || vaultMeta.salt;
  if (saltToUse && encryptedVault.iv && encryptedVault.cipherText) {
    try {
      const salt = new Uint8Array(base64ToArrayBuffer(saltToUse));
      const iv = new Uint8Array(base64ToArrayBuffer(encryptedVault.iv));
      const rawCipher = encryptedVault.cipherText.startsWith('cjs:')
        ? encryptedVault.cipherText.slice(4)
        : encryptedVault.cipherText;
      const cipherBuffer = new Uint8Array(base64ToArrayBuffer(rawCipher));

      const keyGcm = await deriveKeyGcm(masterPassword, salt);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyGcm,
        cipherBuffer
      );
      return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (e2) {
      // Failed legacy direct decryption
    }
  }

  throw new Error('Incorrect master password or corrupted vault.');
}

/**
 * Backward-compatible helper for service-worker.js
 */
export async function decryptVault(cipherText, ivBase64, saltBase64, masterPassword) {
  return decryptVaultEnvelope(
    {
      salt: saltBase64,
      encryptedVault: { cipherText, iv: ivBase64, salt: saltBase64 },
    },
    masterPassword
  );
}

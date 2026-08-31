/**
 * WebAuthn PRF (Pseudo-Random Function) integration for Lokker Vault.
 *
 * Flow:
 *   Register (Settings, vault unlocked):
 *     1. navigator.credentials.create() with prf.eval.first = salt
 *     2. Authenticator derives PRF(salt) -> 32 bytes
 *     3. Import those 32 bytes as an AES-GCM KEK
 *     4. Wrap the active VEK with this KEK
 *     5. Store credential ID + wrapped slot + salt in VaultMetadata
 *
 *   Authenticate (Unlock modal, vault locked):
 *     1. navigator.credentials.get() with same salt
 *     2. Authenticator re-derives PRF(salt) -> same 32 bytes
 *     3. Import as KEK, unwrap VEK, decrypt vault
 *
 * Requirements:
 *   - Secure context (HTTPS or localhost)
 *   - Platform authenticator with PRF support (Touch ID, Windows Hello, Android biometrics)
 *   - Chrome 120+, Safari 17+, Edge 120+
 */

import { bufferToBase64, base64ToBuffer, wrapVek, unwrapVek, createVerifierToken, verifyToken, generateRandomSalt } from "./crypto";
import type { VaultMetadata, WrappedKeySlot, PasswordEntry } from "@/types";
import { decryptPayloadWithVek } from "./crypto";

const RP_NAME = "Lokker Vault";
const USER_NAME = "lokker-user";

/**
 * Check if WebAuthn PRF is available in this browser/environment.
 */
export async function isWebAuthnPRFAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") return false;

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Derive an AES-GCM KEK from WebAuthn PRF output bytes.
 * PRF output is always 32 bytes (256-bit), suitable for AES-256.
 */
async function prfBytesToKek(prfBytes: ArrayBuffer): Promise<CryptoKey> {
  // Ensure exactly 32 bytes — if shorter, SHA-256 hash it
  let keyBytes: Uint8Array;
  if (prfBytes.byteLength >= 32) {
    keyBytes = new Uint8Array(prfBytes.slice(0, 32));
  } else {
    const hashed = await crypto.subtle.digest("SHA-256", prfBytes);
    keyBytes = new Uint8Array(hashed);
  }

  return crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

/** Helper to get PRF output from a credential response (works for both create & get) */
function getPrfOutput(response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse): ArrayBuffer | undefined {
  const extResults = response.clientExtensionResults;
  const prfData = (extResults as { prf?: { results?: { first?: ArrayBuffer } } }).prf;
  return prfData?.results?.first;
}

/**
 * Register a new WebAuthn credential with PRF, wrapping the given VEK.
 * Called from Settings when the user enables biometric unlock.
 */
export async function registerWebAuthnCredential(vek: CryptoKey): Promise<{
  credentialIdBase64: string;
  userHandleBase64: string;
  saltBase64: string;
  wrappedSlot: WrappedKeySlot;
  verifier: string;
}> {
  // 1. Generate a random salt for PRF derivation
  const prfSalt = generateRandomSalt();
  const saltBase64 = bufferToBase64(prfSalt);

  // 2. Generate a random user handle
  const userHandle = crypto.getRandomValues(new Uint8Array(16));
  const userHandleBase64 = bufferToBase64(userHandle);

  // 3. Challenge (random, unused for encryption but required by WebAuthn)
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  // 4. Create the credential with PRF extension
  // We use `any` here because the WebAuthn PRF extension types are not
  // fully represented in the DOM lib types.
  const createOptions = {
    publicKey: {
      challenge,
      rp: {
        name: RP_NAME,
        id: window.location.hostname,
      },
      user: {
        id: userHandle,
        name: USER_NAME,
        displayName: USER_NAME,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" as const },
        { alg: -257, type: "public-key" as const },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform" as const,
        userVerification: "required" as const,
        residentKey: "preferred" as const,
      },
      extensions: {
        prf: {
          eval: { first: prfSalt.buffer as ArrayBuffer },
        },
      },
      timeout: 60000,
      attestation: "none" as const,
    },
  };

  let credential: PublicKeyCredential;
  try {
    credential = (await navigator.credentials.create(
      createOptions as CredentialCreationOptions
    )) as PublicKeyCredential;
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError") {
        throw new Error("Biometric authentication was cancelled or timed out.");
      }
      if (err.name === "SecurityError") {
        throw new Error("WebAuthn is not available in this context. Ensure you are on HTTPS or localhost.");
      }
    }
    throw new Error(`WebAuthn registration failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!credential) {
    throw new Error("WebAuthn credential creation returned empty result.");
  }

  // 5. Extract PRF output from attestation extensions
  const prfOutput = getPrfOutput(credential.response as AuthenticatorAttestationResponse);

  if (!prfOutput || prfOutput.byteLength === 0) {
    throw new Error(
      "Authenticator did not return PRF output. Your hardware may not support the PRF extension."
    );
  }

  // 6. Derive KEK from PRF bytes
  const kek = await prfBytesToKek(prfOutput);

  // 7. Wrap the VEK with this KEK
  const wrappedSlot = await wrapVek(vek, kek);

  // 8. Create a verifier for quick validation
  const verifier = await createVerifierToken(kek, "LOKKER_WEBAUTHN_TOKEN_2026");

  // 9. Encode credential ID
  const credentialIdBase64 = bufferToBase64(credential.rawId);

  return {
    credentialIdBase64,
    userHandleBase64,
    saltBase64,
    wrappedSlot,
    verifier,
  };
}

/**
 * Authenticate with an existing WebAuthn credential and unwrap the VEK.
 * Called from the Unlock modal's Passkey tab.
 */
export async function authenticateWithWebAuthn(meta: VaultMetadata): Promise<{
  vek: CryptoKey;
  passwords: PasswordEntry[];
}> {
  if (!meta.webauthnCredentialId || !meta.webauthnSalt || !meta.wrappedVekByWebAuthn) {
    throw new Error("No WebAuthn credential registered for this vault.");
  }

  // 1. Decode stored values
  const credentialId = new Uint8Array(base64ToBuffer(meta.webauthnCredentialId));
  const prfSalt = new Uint8Array(base64ToBuffer(meta.webauthnSalt));
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  // 2. Get credential with PRF extension
  const getOptions = {
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [
        {
          id: credentialId,
          type: "public-key" as const,
          transports: ["internal" as const],
        },
      ],
      userVerification: "required" as const,
      extensions: {
        prf: {
          eval: { first: prfSalt.buffer as ArrayBuffer },
        },
      },
      timeout: 60000,
    },
  };

  let assertion: PublicKeyCredential;
  try {
    assertion = (await navigator.credentials.get(
      getOptions as CredentialRequestOptions
    )) as PublicKeyCredential;
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError") {
        throw new Error("Biometric authentication was cancelled or timed out.");
      }
      if (err.name === "SecurityError") {
        throw new Error("WebAuthn security error. Ensure you are on HTTPS or localhost.");
      }
      if (err.name === "InvalidStateError") {
        throw new Error(
          "Passkey not found on this device. The credential may have been removed. Please re-register in Settings."
        );
      }
    }
    throw new Error(`WebAuthn authentication failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!assertion) {
    throw new Error("WebAuthn assertion returned empty result.");
  }

  // 3. Extract PRF output from assertion extensions
  const prfOutput = getPrfOutput(assertion.response as AuthenticatorAssertionResponse);

  if (!prfOutput || prfOutput.byteLength === 0) {
    throw new Error("Authenticator did not return PRF output during authentication.");
  }

  // 4. Derive KEK from PRF bytes
  const kek = await prfBytesToKek(prfOutput);

  // 5. Optionally verify the KEK before unwrapping
  if (meta.webauthnVerifier) {
    const isValid = await verifyToken(kek, meta.webauthnVerifier, "LOKKER_WEBAUTHN_TOKEN_2026");
    if (!isValid) {
      throw new Error("Biometric authentication succeeded but derived key does not match. Vault may be corrupted.");
    }
  }

  // 6. Unwrap the VEK
  const vek = await unwrapVek(meta.wrappedVekByWebAuthn, kek);

  // 7. Decrypt the vault payload
  if (!meta.encryptedVault) {
    return { vek, passwords: [] };
  }

  const passwords = await decryptPayloadWithVek<PasswordEntry[]>(
    meta.encryptedVault.cipherText,
    meta.encryptedVault.iv,
    vek
  );

  return { vek, passwords };
}

/**
 * Remove WebAuthn credential data from VaultMetadata.
 */
export function clearWebAuthnSlot(meta: VaultMetadata): VaultMetadata {
  const cleaned: VaultMetadata = {
    ...meta,
  };
  delete cleaned.webauthnCredentialId;
  delete cleaned.webauthnUserHandle;
  delete cleaned.webauthnSalt;
  delete cleaned.wrappedVekByWebAuthn;
  delete cleaned.webauthnVerifier;
  return cleaned;
}

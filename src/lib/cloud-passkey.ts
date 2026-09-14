"use client";

import {
  bufferToBase64,
  base64ToBuffer,
  generateRandomSalt,
} from "./crypto";
import {
  type CloudSessionUser,
  setCloudSession,
  getCloudSession,
  refreshCloudSession,
} from "./auth-session";
import { AppError } from "./errors";

export const CLOUD_PASSKEYS_STORAGE_KEY = "lokker_cloud_passkeys";

export interface CloudPasskeyDescriptor {
  credentialId: string; // Base64URL string
  userId: string;
  userEmail: string;
  userName?: string | null;
  userRole: "ADMIN" | "USER";
  deviceName: string;
  createdAt: string;
  transports?: string[];
  // Encrypted or saved session backup for offline/biometric restoration
  sessionBackup?: {
    accessToken: string;
    refreshToken?: string | null;
  };
}

/**
 * Detects friendly device nickname (e.g. Windows Hello, Touch ID / Face ID, Security Key)
 */
export function getPasskeyDeviceName(): string {
  if (typeof window === "undefined") return "Security Key";
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return "Apple Touch ID / Face ID";
  }
  if (/Windows/i.test(ua)) {
    return "Windows Hello";
  }
  if (/Android/i.test(ua)) {
    return "Android Biometrics";
  }
  if (/iPhone|iPad/i.test(ua)) {
    return "iCloud Keychain Passkey";
  }
  return "FIDO2 Security Key";
}

/**
 * Checks if the current browser environment supports WebAuthn and Platform Authenticators.
 */
export async function isPlatformPasskeyAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;

  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return isAvailable;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to retrieve all locally registered cloud passkeys.
 */
export function getRegisteredCloudPasskeys(userId?: string): CloudPasskeyDescriptor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLOUD_PASSKEYS_STORAGE_KEY);
    if (!raw) return [];
    const list: CloudPasskeyDescriptor[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (userId) {
      return list.filter((p) => p.userId === userId);
    }
    return list;
  } catch {
    return [];
  }
}

/**
 * Persists the list of cloud passkeys in localStorage.
 */
function saveRegisteredCloudPasskeys(list: CloudPasskeyDescriptor[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLOUD_PASSKEYS_STORAGE_KEY, JSON.stringify(list));
}

/**
 * Removes a registered passkey by credential ID.
 */
export function removeCloudPasskey(credentialId: string): boolean {
  const current = getRegisteredCloudPasskeys();
  const filtered = current.filter((p) => p.credentialId !== credentialId);
  if (filtered.length !== current.length) {
    saveRegisteredCloudPasskeys(filtered);
    return true;
  }
  return false;
}

/**
 * Registers a new WebAuthn passkey on this device bound to the active cloud user.
 */
export async function registerCloudPasskey(
  user: CloudSessionUser,
  customDeviceName?: string
): Promise<CloudPasskeyDescriptor> {
  if (typeof window === "undefined" || !navigator.credentials) {
    throw new AppError("WebAuthn is not supported in this environment.", {
      code: "WEBAUTHN_UNSUPPORTED",
      userMessage: "Passkeys are not supported in this browser. Please use Chrome, Edge, Safari, or Brave.",
    });
  }

  // 1. Generate challenge
  const challengeBytes = new Uint8Array(32);
  crypto.getRandomValues(challengeBytes);

  // 2. Prepare user ID buffer
  const encoder = new TextEncoder();
  const userIdBuffer = encoder.encode(user.id);

  // 3. Prepare creation options
  const rpId = window.location.hostname || "localhost";
  const deviceName = customDeviceName || getPasskeyDeviceName();

  const createOptions: CredentialCreationOptions = {
    publicKey: {
      challenge: challengeBytes.buffer as ArrayBuffer,
      rp: {
        name: "Lokker Vault",
        id: rpId,
      },
      user: {
        id: userIdBuffer.buffer as ArrayBuffer,
        name: user.email,
        displayName: user.name || user.email,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256 (ECDSA P-256)
        { alg: -257, type: "public-key" }, // RS256 (RSA)
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  };

  let credential: Credential | null = null;
  try {
    credential = await navigator.credentials.create(createOptions);
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      throw new AppError("Passkey registration was cancelled or timed out.", {
        code: "WEBAUTHN_CANCELLED",
        userMessage: "Passkey setup was cancelled. No changes were made.",
      });
    }
    if (err.name === "SecurityError") {
      throw new AppError("WebAuthn security error.", {
        code: "WEBAUTHN_SECURITY_ERROR",
        userMessage: "Passkeys require a secure context (HTTPS or localhost).",
      });
    }
    throw new AppError(`Passkey registration failed: ${err.message}`, {
      code: "WEBAUTHN_REGISTRATION_FAILED",
      userMessage: err.message || "Failed to register passkey.",
    });
  }

  const isPublicKeyCred =
    typeof window !== "undefined" && typeof window.PublicKeyCredential === "function"
      ? credential instanceof window.PublicKeyCredential
      : !!(credential && "rawId" in (credential as any));

  if (!credential || !isPublicKeyCred) {
    throw new AppError("Passkey credential creation returned an empty response.", {
      code: "WEBAUTHN_EMPTY_CREDENTIAL",
      userMessage: "Could not create passkey on this device.",
    });
  }

  // Extract transports if provided by authenticator
  let transports: string[] = [];
  if ("response" in credential && typeof (credential.response as any).getTransports === "function") {
    try {
      transports = (credential.response as any).getTransports() || [];
    } catch {}
  }

  const credentialId = bufferToBase64((credential as PublicKeyCredential).rawId);

  const descriptor: CloudPasskeyDescriptor = {
    credentialId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    userRole: user.role,
    deviceName,
    createdAt: new Date().toISOString(),
    transports,
    sessionBackup: {
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    },
  };

  // Save to local registry
  const existing = getRegisteredCloudPasskeys();
  // Overwrite if same credentialId already exists
  const updated = existing.filter((p) => p.credentialId !== credentialId);
  updated.push(descriptor);
  saveRegisteredCloudPasskeys(updated);

  return descriptor;
}

/**
 * Authenticates the user with their biometric passkey, restores their cloud session,
 * and refreshes their token.
 */
export async function authenticateCloudPasskey(
  targetEmail?: string
): Promise<CloudSessionUser> {
  if (typeof window === "undefined" || !navigator.credentials) {
    throw new AppError("WebAuthn is not supported in this environment.", {
      code: "WEBAUTHN_UNSUPPORTED",
      userMessage: "Passkeys are not supported in this browser.",
    });
  }

  const allPasskeys = getRegisteredCloudPasskeys();
  if (allPasskeys.length === 0) {
    throw new AppError("No passkeys registered on this device.", {
      code: "NO_PASSKEYS_REGISTERED",
      userMessage:
        "No passkey was found on this device. Please sign in with your email & password first to register Windows Hello or Touch ID.",
    });
  }

  let matchingPasskeys = allPasskeys;
  if (targetEmail && targetEmail.trim()) {
    const norm = targetEmail.trim().toLowerCase();
    matchingPasskeys = allPasskeys.filter((p) => p.userEmail.toLowerCase() === norm);
    if (matchingPasskeys.length === 0) {
      throw new AppError(`No passkey registered for ${targetEmail}.`, {
        code: "NO_MATCHING_PASSKEY",
        userMessage: `No passkey registered on this device for ${targetEmail}. Please sign in with your password.`,
      });
    }
  }

  // 1. Build allowCredentials from matching registered passkeys
  const allowCredentials = matchingPasskeys.map((p) => ({
    id: new Uint8Array(base64ToBuffer(p.credentialId)),
    type: "public-key" as const,
    transports: p.transports as AuthenticatorTransport[] | undefined,
  }));

  // 2. Generate challenge
  const challengeBytes = new Uint8Array(32);
  crypto.getRandomValues(challengeBytes);

  const rpId = window.location.hostname || "localhost";

  const getOptions: CredentialRequestOptions = {
    publicKey: {
      challenge: challengeBytes.buffer as ArrayBuffer,
      rpId,
      allowCredentials,
      userVerification: "preferred",
      timeout: 60000,
    },
  };

  let assertion: Credential | null = null;
  try {
    assertion = await navigator.credentials.get(getOptions);
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      throw new AppError("Biometric verification was cancelled.", {
        code: "WEBAUTHN_CANCELLED",
        userMessage: "Biometric sign-in was cancelled.",
      });
    }
    throw new AppError(`Biometric verification failed: ${err.message}`, {
      code: "WEBAUTHN_GET_FAILED",
      userMessage: err.message || "Passkey authentication failed.",
    });
  }

  const isPublicKeyCred =
    typeof window !== "undefined" && typeof window.PublicKeyCredential === "function"
      ? assertion instanceof window.PublicKeyCredential
      : !!(assertion && "rawId" in (assertion as any));

  if (!assertion || !isPublicKeyCred) {
    throw new AppError("Passkey assertion returned empty response.", {
      code: "WEBAUTHN_EMPTY_ASSERTION",
      userMessage: "Passkey authentication could not be completed.",
    });
  }

  // 3. Match the credential that was used
  const usedCredentialId = bufferToBase64((assertion as PublicKeyCredential).rawId);
  const matchedDescriptor = allPasskeys.find((p) => p.credentialId === usedCredentialId);

  if (!matchedDescriptor) {
    throw new AppError("Unrecognized passkey credential.", {
      code: "PASSKEY_NOT_RECOGNIZED",
      userMessage: "The passkey used does not match any known Lokker account on this device.",
    });
  }

  // 4. Construct restored user session
  const restoredSession: CloudSessionUser = {
    id: matchedDescriptor.userId,
    email: matchedDescriptor.userEmail,
    role: matchedDescriptor.userRole,
    name: matchedDescriptor.userName,
    accessToken: matchedDescriptor.sessionBackup?.accessToken || "temp_passkey_token",
    refreshToken: matchedDescriptor.sessionBackup?.refreshToken,
  };

  // Set active session in client
  setCloudSession(restoredSession);

  // 5. Attempt silent background token refresh if refresh token exists
  try {
    const refreshed = await refreshCloudSession();
    if (refreshed) {
      // Update the session backup on disk
      matchedDescriptor.sessionBackup = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
      };
      const updatedList = allPasskeys.map((p) =>
        p.credentialId === matchedDescriptor.credentialId ? matchedDescriptor : p
      );
      saveRegisteredCloudPasskeys(updatedList);
      return refreshed;
    }
  } catch (refreshErr) {
    console.warn("Silent passkey token refresh deferred:", refreshErr);
  }

  return restoredSession;
}

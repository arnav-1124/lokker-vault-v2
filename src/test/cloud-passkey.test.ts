import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isPlatformPasskeyAvailable,
  getPasskeyDeviceName,
  registerCloudPasskey,
  authenticateCloudPasskey,
  getRegisteredCloudPasskeys,
  removeCloudPasskey,
  CLOUD_PASSKEYS_STORAGE_KEY,
  type CloudPasskeyDescriptor,
} from "@/lib/cloud-passkey";
import { getCloudSession, setCloudSession, type CloudSessionUser } from "@/lib/auth-session";
import { bufferToBase64 } from "@/lib/crypto";

describe("Cloud Passkey & Biometric Authentication Engine", () => {
  const mockUser: CloudSessionUser = {
    id: "user-uuid-1234",
    email: "sarah.connor@cyberdyne.test",
    name: "Sarah Connor",
    role: "ADMIN",
    accessToken: "jwt.access.token.abc",
    refreshToken: "refresh.token.xyz",
  };

  const rawCredentialId = new Uint8Array([10, 20, 30, 40, 50, 60]);
  const base64CredentialId = bufferToBase64(rawCredentialId.buffer);

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Device Detection & Capabilities", () => {
    it("identifies platform device name from user agent", () => {
      const originalUserAgent = navigator.userAgent;

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        configurable: true,
      });
      expect(getPasskeyDeviceName()).toBe("Windows Hello");

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        configurable: true,
      });
      expect(getPasskeyDeviceName()).toBe("Apple Touch ID / Face ID");

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 14)",
        configurable: true,
      });
      expect(getPasskeyDeviceName()).toBe("Android Biometrics");

      Object.defineProperty(navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it("checks isPlatformPasskeyAvailable with PublicKeyCredential API", async () => {
      // Mock window.PublicKeyCredential
      (window as any).PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      };

      const available = await isPlatformPasskeyAvailable();
      expect(available).toBe(true);

      (window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = vi
        .fn()
        .mockResolvedValue(false);
      const unavailable = await isPlatformPasskeyAvailable();
      expect(unavailable).toBe(false);
    });
  });

  describe("registerCloudPasskey()", () => {
    it("successfully creates and stores passkey descriptor in local registry", async () => {
      const mockCredential = {
        id: "cred-id-string",
        rawId: rawCredentialId.buffer,
        response: {
          clientDataJSON: new ArrayBuffer(16),
          attestationObject: new ArrayBuffer(32),
          getTransports: () => ["internal", "hybrid"],
        },
      };

      // Mock navigator.credentials.create
      const createMock = vi.fn().mockResolvedValue(mockCredential);
      Object.defineProperty(navigator, "credentials", {
        value: { create: createMock, get: vi.fn() },
        configurable: true,
      });

      const descriptor = await registerCloudPasskey(mockUser, "My Windows Hello Workstation");

      expect(createMock).toHaveBeenCalledTimes(1);
      expect(descriptor.userId).toBe(mockUser.id);
      expect(descriptor.userEmail).toBe(mockUser.email);
      expect(descriptor.credentialId).toBe(base64CredentialId);
      expect(descriptor.deviceName).toBe("My Windows Hello Workstation");
      expect(descriptor.sessionBackup?.accessToken).toBe(mockUser.accessToken);

      // Verify stored in localStorage
      const registered = getRegisteredCloudPasskeys();
      expect(registered).toHaveLength(1);
      expect(registered[0].credentialId).toBe(base64CredentialId);
    });

    it("throws WEBAUTHN_CANCELLED when user dismisses OS biometric prompt", async () => {
      const cancelError = new Error("User cancelled");
      cancelError.name = "NotAllowedError";

      Object.defineProperty(navigator, "credentials", {
        value: {
          create: vi.fn().mockRejectedValue(cancelError),
          get: vi.fn(),
        },
        configurable: true,
      });

      await expect(registerCloudPasskey(mockUser)).rejects.toMatchObject({
        code: "WEBAUTHN_CANCELLED",
      });
    });
  });

  describe("authenticateCloudPasskey()", () => {
    it("throws NO_PASSKEYS_REGISTERED if no passkeys are stored on device", async () => {
      await expect(authenticateCloudPasskey()).rejects.toMatchObject({
        code: "NO_PASSKEYS_REGISTERED",
      });
    });

    it("successfully authenticates with biometric assertion and restores session", async () => {
      // Seed a registered passkey descriptor
      const existingPasskey: CloudPasskeyDescriptor = {
        credentialId: base64CredentialId,
        userId: mockUser.id,
        userEmail: mockUser.email,
        userName: mockUser.name,
        userRole: mockUser.role,
        deviceName: "Windows Hello",
        createdAt: new Date().toISOString(),
        transports: ["internal"],
        sessionBackup: {
          accessToken: "restored.jwt.token",
          refreshToken: "restored.refresh.token",
        },
      };
      localStorage.setItem(CLOUD_PASSKEYS_STORAGE_KEY, JSON.stringify([existingPasskey]));

      const mockAssertion = {
        id: "cred-id-string",
        rawId: rawCredentialId.buffer,
        response: {
          clientDataJSON: new ArrayBuffer(16),
          authenticatorData: new ArrayBuffer(32),
          signature: new ArrayBuffer(64),
          userHandle: new TextEncoder().encode(mockUser.id).buffer,
        },
      };

      const getMock = vi.fn().mockResolvedValue(mockAssertion);
      Object.defineProperty(navigator, "credentials", {
        value: { create: vi.fn(), get: getMock },
        configurable: true,
      });

      const session = await authenticateCloudPasskey(mockUser.email);

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(session.id).toBe(mockUser.id);
      expect(session.email).toBe(mockUser.email);
      expect(session.accessToken).toBe("restored.jwt.token");

      // Verify session is now active in getCloudSession()
      const activeSession = getCloudSession();
      expect(activeSession?.email).toBe(mockUser.email);
    });

    it("throws NO_MATCHING_PASSKEY if target email has no registered passkey", async () => {
      const existingPasskey: CloudPasskeyDescriptor = {
        credentialId: base64CredentialId,
        userId: "other-user",
        userEmail: "other@example.com",
        userRole: "USER",
        deviceName: "Touch ID",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(CLOUD_PASSKEYS_STORAGE_KEY, JSON.stringify([existingPasskey]));

      await expect(authenticateCloudPasskey("different@example.com")).rejects.toMatchObject({
        code: "NO_MATCHING_PASSKEY",
      });
    });

    it("throws WEBAUTHN_CANCELLED when user cancels biometric sign-in", async () => {
      const existingPasskey: CloudPasskeyDescriptor = {
        credentialId: base64CredentialId,
        userId: mockUser.id,
        userEmail: mockUser.email,
        userRole: "USER",
        deviceName: "Touch ID",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(CLOUD_PASSKEYS_STORAGE_KEY, JSON.stringify([existingPasskey]));

      const cancelError = new Error("User cancelled biometric");
      cancelError.name = "NotAllowedError";

      Object.defineProperty(navigator, "credentials", {
        value: { create: vi.fn(), get: vi.fn().mockRejectedValue(cancelError) },
        configurable: true,
      });

      await expect(authenticateCloudPasskey()).rejects.toMatchObject({
        code: "WEBAUTHN_CANCELLED",
      });
    });
  });

  describe("removeCloudPasskey() and Filtering", () => {
    it("filters passkeys by userId", () => {
      const p1: CloudPasskeyDescriptor = {
        credentialId: "cred-1",
        userId: "user-1",
        userEmail: "u1@test.com",
        userRole: "USER",
        deviceName: "Device 1",
        createdAt: new Date().toISOString(),
      };
      const p2: CloudPasskeyDescriptor = {
        credentialId: "cred-2",
        userId: "user-2",
        userEmail: "u2@test.com",
        userRole: "USER",
        deviceName: "Device 2",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(CLOUD_PASSKEYS_STORAGE_KEY, JSON.stringify([p1, p2]));

      expect(getRegisteredCloudPasskeys("user-1")).toHaveLength(1);
      expect(getRegisteredCloudPasskeys("user-1")[0].credentialId).toBe("cred-1");
      expect(getRegisteredCloudPasskeys("user-2")).toHaveLength(1);
      expect(getRegisteredCloudPasskeys()).toHaveLength(2);
    });

    it("removes passkey by credentialId", () => {
      const p1: CloudPasskeyDescriptor = {
        credentialId: "cred-to-delete",
        userId: "user-1",
        userEmail: "u1@test.com",
        userRole: "USER",
        deviceName: "Device 1",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(CLOUD_PASSKEYS_STORAGE_KEY, JSON.stringify([p1]));
      expect(getRegisteredCloudPasskeys()).toHaveLength(1);

      const removed = removeCloudPasskey("cred-to-delete");
      expect(removed).toBe(true);
      expect(getRegisteredCloudPasskeys()).toHaveLength(0);

      const removedAgain = removeCloudPasskey("non-existent");
      expect(removedAgain).toBe(false);
    });
  });
});

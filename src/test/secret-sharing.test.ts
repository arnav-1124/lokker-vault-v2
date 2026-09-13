import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEncryptedSecretLink,
  fetchAndDecryptSecret,
  SharedSecretPayload,
} from "../lib/secret-sharing";

describe("Zero-Knowledge Expiring Secret Links", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("encrypts secret client-side and generates URL with key in hash fragment only", async () => {
    let sentBody: any = null;

    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (url.endsWith("/api/secrets") && options?.method === "POST") {
        sentBody = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            secretId: "test-secret-id-12345",
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const payload: SharedSecretPayload = {
      secret: "SuperSecretPassword123!@",
      title: "Prod DB Credential",
    };

    const link = await createEncryptedSecretLink(payload, {
      expiresInSeconds: 86400,
      viewsRemaining: 1,
    });

    expect(link.secretId).toBe("test-secret-id-12345");
    expect(link.shareUrl).toContain("/share/test-secret-id-12345#key=");

    // Server must NOT receive plaintext secret or title
    expect(sentBody).toBeDefined();
    expect(sentBody.encryptedBlob).toBeDefined();
    expect(sentBody.iv).toBeDefined();
    expect(sentBody.viewsRemaining).toBe(1);
    expect(sentBody.expiresInSeconds).toBe(86400);
    expect(sentBody.secret).toBeUndefined();
    expect(sentBody.title).toBeUndefined();

    // Key in hash fragment must be URL-safe Base64 (no +, /, or =)
    const keyMatch = link.shareUrl.match(/#key=([^&]+)/);
    expect(keyMatch).not.toBeNull();
    const key = keyMatch![1];
    expect(key).not.toContain("+");
    expect(key).not.toContain("/");
    expect(key).not.toContain("=");
  });

  it("fetches ciphertext and successfully decrypts payload with the correct key", async () => {
    let storedCiphertext = "";
    let storedIv = "";

    // 1. Intercept creation
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (options?.method === "POST") {
        const body = JSON.parse(options.body);
        storedCiphertext = body.encryptedBlob;
        storedIv = body.iv;
        return {
          ok: true,
          json: async () => ({
            secretId: "mock-secret-456",
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        };
      }
      if (url.endsWith("/api/secrets/mock-secret-456")) {
        return {
          ok: true,
          json: async () => ({
            encryptedBlob: storedCiphertext,
            iv: storedIv,
            burned: true,
            viewsRemaining: 0,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const originalPayload: SharedSecretPayload = {
      secret: "Stripe_Secret_Key_sk_live_99887766",
      title: "Payment Gateway Token",
    };

    const created = await createEncryptedSecretLink(originalPayload, {
      expiresInSeconds: 3600,
      viewsRemaining: 1,
    });

    const key = created.shareUrl.split("#key=")[1];

    // 2. Recipient decrypts with hash key
    const decrypted = await fetchAndDecryptSecret(created.secretId, key);

    expect(decrypted.secret).toBe(originalPayload.secret);
    expect(decrypted.title).toBe(originalPayload.title);
    expect(decrypted.burned).toBe(true);
    expect(decrypted.viewsRemaining).toBe(0);
  });

  it("fails decryption if an invalid or corrupted key is supplied", async () => {
    // Generate valid link
    let storedCiphertext = "";
    let storedIv = "";

    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (options?.method === "POST") {
        const body = JSON.parse(options.body);
        storedCiphertext = body.encryptedBlob;
        storedIv = body.iv;
        return {
          ok: true,
          json: async () => ({
            secretId: "mock-secret-corrupt",
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        };
      }
      if (url.endsWith("/api/secrets/mock-secret-corrupt")) {
        return {
          ok: true,
          json: async () => ({
            encryptedBlob: storedCiphertext,
            iv: storedIv,
            burned: true,
            viewsRemaining: 0,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const created = await createEncryptedSecretLink({ secret: "ClassifiedData" });

    // Tamper with key by flipping characters
    const wrongKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    await expect(fetchAndDecryptSecret(created.secretId, wrongKey)).rejects.toThrow();
  });

  it("throws descriptive error when secret has already been burned on server (404/410)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        message: "This secret link does not exist, has expired, or has already been burned.",
      }),
    });

    await expect(
      fetchAndDecryptSecret("burned-id", "someValidLookingBase64KeyString1234567890==")
    ).rejects.toThrow(/already been burned/i);
  });

  it("throws error when decryption key is missing", async () => {
    await expect(fetchAndDecryptSecret("secret-id", "")).rejects.toThrow(
      /Missing decryption key/i
    );
  });
});

import { describe, it, expect } from "vitest";
import {
  createPasskeyCredential,
  signPasskeyAssertion,
  formatSpkiToPem,
  bufferToBase64Url,
  base64UrlToBuffer,
} from "../lib/passkey";

describe("Passkey (FIDO2 / WebAuthn) Engine", () => {
  it("encodes and decodes Base64URL without padding loss", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01, 0x02, 0x03]);
    const b64url = bufferToBase64Url(bytes);
    expect(b64url).not.toContain("+");
    expect(b64url).not.toContain("/");
    expect(b64url).not.toContain("=");

    const decoded = new Uint8Array(base64UrlToBuffer(b64url));
    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });

  it("creates a valid ECDSA P-256 passkey credential with SPKI public key and credential ID", async () => {
    const passkey = await createPasskeyCredential({
      websiteName: "GitHub",
      rpId: "https://github.com/login",
      userName: "developer@octocat.com",
      userDisplayName: "Octo Developer",
    });

    expect(passkey.id).toMatch(/^passkey-/);
    expect(passkey.rpId).toBe("github.com");
    expect(passkey.websiteName).toBe("GitHub");
    expect(passkey.userName).toBe("developer@octocat.com");
    expect(passkey.algorithm).toBe(-7); // ES256
    expect(passkey.credentialId).toBeDefined();
    expect(passkey.credentialId.length).toBeGreaterThan(10);
    expect(passkey.publicKey).toBeDefined();
    expect(passkey.privateKeyJwk).toBeDefined();

    // Verify PEM formatting
    const pem = formatSpkiToPem(passkey.publicKey);
    expect(pem).toContain("-----BEGIN PUBLIC KEY-----");
    expect(pem).toContain("-----END PUBLIC KEY-----");
  });

  it("successfully signs an authentication challenge using the passkey private key", async () => {
    const passkey = await createPasskeyCredential({
      websiteName: "Google",
      rpId: "accounts.google.com",
      userName: "user@gmail.com",
    });

    const challenge = new TextEncoder().encode("random-webauthn-server-challenge-98765");
    const signature = await signPasskeyAssertion(passkey.privateKeyJwk!, challenge);

    expect(signature.byteLength).toBeGreaterThan(0);
    // ECDSA P-256 signatures are typically 64 bytes (IEEE P1363)
    expect(signature.byteLength).toBe(64);
  });
});

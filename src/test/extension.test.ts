import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractDomain, isSafeDomainMatch, filterMatchingCredentials } from "../../public/extension/vault/credential-matcher.js";
import { decryptVaultEnvelope } from "../../public/extension/vault/secure-storage.js";
import "../../public/extension/content/trusted-origins.js";
import { initializeEnvelopeVault } from "../lib/crypto";
import { PasswordEntry } from "../types";

describe("Lokker Browser Extension Suite", () => {
  describe("Trusted Origin Policy (vault sync gate)", () => {
    type ExtConfig = { appOrigin: string; trustedHosts: string[]; trustedHostSuffixes: string[] };
    const globalScope = globalThis as unknown as { LokkerOriginPolicy?: { isTrustedLokkerOrigin: (loc: URL) => boolean }; LOKKER_EXT_CONFIG?: ExtConfig };
    const policy = () => globalScope.LokkerOriginPolicy!;

    beforeEach(() => {
      globalScope.LOKKER_EXT_CONFIG = {
        appOrigin: "https://lokker-vault.vercel.app",
        trustedHosts: ["localhost", "127.0.0.1", "0.0.0.0", "lokker-vault.vercel.app"],
        trustedHostSuffixes: [".local", ".e2b.app"],
      };
    });

    afterEach(() => {
      delete globalScope.LOKKER_EXT_CONFIG;
    });

    it("accepts local development origins over http and https (any port)", () => {
      expect(policy().isTrustedLokkerOrigin(new URL("http://localhost:3000/app"))).toBe(true);
      expect(policy().isTrustedLokkerOrigin(new URL("http://127.0.0.1:3000"))).toBe(true);
      expect(policy().isTrustedLokkerOrigin(new URL("https://localhost"))).toBe(true);
    });

    it("accepts the configured production origin over https only", () => {
      expect(policy().isTrustedLokkerOrigin(new URL("https://lokker-vault.vercel.app/app"))).toBe(true);
      // plain http must never be trusted for the production origin
      expect(policy().isTrustedLokkerOrigin(new URL("http://lokker-vault.vercel.app"))).toBe(false);
    });

    it("accepts trusted preview subdomains only", () => {
      expect(policy().isTrustedLokkerOrigin(new URL("https://lokker-vault.e2b.app/app"))).toBe(true);
      expect(policy().isTrustedLokkerOrigin(new URL("https://dev.local"))).toBe(true);
    });

    it("REJECTS arbitrary pages, spoofed hostnames and insecure protocols", () => {
      expect(policy().isTrustedLokkerOrigin(new URL("https://github.com/login"))).toBe(false);
      // substring spoofing must fail
      expect(policy().isTrustedLokkerOrigin(new URL("https://lokker.phishing.example"))).toBe(false);
      expect(policy().isTrustedLokkerOrigin(new URL("https://evil-lokker.com"))).toBe(false);
      expect(policy().isTrustedLokkerOrigin(new URL("https://vercel.app"))).toBe(false);
      expect(policy().isTrustedLokkerOrigin(new URL("https://lokker-vault.vercel.app.evil.com"))).toBe(false);
      expect(policy().isTrustedLokkerOrigin(new URL("https://evil-e2b.app"))).toBe(false);
      expect(policy().isTrustedLokkerOrigin(new URL("https://notlocal"))).toBe(false);
      // plain http on a non-local page must never sync vault data
      expect(policy().isTrustedLokkerOrigin(new URL("http://evil.com"))).toBe(false);
    });
  });

  describe("Domain & Credential Matcher", () => {
    it("extracts clean domains from URLs and hostnames", () => {
      expect(extractDomain("https://github.com/login")).toBe("github.com");
      expect(extractDomain("http://www.google.com:8080/search?q=test")).toBe("google.com");
      expect(extractDomain("sub.domain.co.uk/path#hash")).toBe("sub.domain.co.uk");
      expect(extractDomain("localhost:3000")).toBe("localhost");
      expect(extractDomain("")).toBe("");
    });

    it("matches exact domains correctly", () => {
      expect(isSafeDomainMatch("https://github.com/login", "https://github.com")).toBe(true);
      expect(isSafeDomainMatch("http://localhost:3000/app", "http://localhost:3000")).toBe(true);
      expect(isSafeDomainMatch("https://sub.slack.com", "sub.slack.com")).toBe(true);
    });

    it("matches legitimate subdomains safely", () => {
      // login.github.com is a subdomain of github.com
      expect(isSafeDomainMatch("https://login.github.com", "https://github.com")).toBe(true);
      // auth.service.corp.com is a subdomain of corp.com
      expect(isSafeDomainMatch("https://auth.service.corp.com/v1", "corp.com")).toBe(true);
    });

    it("REJECTS malicious domain squatting and prefix attacks", () => {
      // evil-github.com MUST NOT match github.com
      expect(isSafeDomainMatch("https://evil-github.com", "https://github.com")).toBe(false);
      expect(isSafeDomainMatch("https://github.com.attacker.com", "https://github.com")).toBe(false);
      expect(isSafeDomainMatch("https://notgithub.com", "https://github.com")).toBe(false);
      expect(isSafeDomainMatch("https://fake-google.com/login", "google.com")).toBe(false);
      expect(isSafeDomainMatch("https://google.com.phishing.org", "google.com")).toBe(false);
    });

    it("filters matching credentials for active tab URL", () => {
      const credentials = [
        { id: "1", websiteName: "GitHub", websiteUrl: "https://github.com", username: "user1" },
        { id: "2", websiteName: "GitHub Enterprise", websiteUrl: "https://github.com", username: "user2" },
        { id: "3", websiteName: "Google", websiteUrl: "https://google.com", username: "gmail_user" },
      ];

      const matches = filterMatchingCredentials("https://github.com/settings", credentials);
      expect(matches.length).toBe(2);
      expect(matches.map((m: any) => m.username)).toEqual(["user1", "user2"]);

      const noMatches = filterMatchingCredentials("https://twitter.com", credentials);
      expect(noMatches.length).toBe(0);
    });
  });

  describe("Extension V2 VEK Decryption Bridge", () => {
    it("successfully decrypts V2 envelope vault metadata using master password", async () => {
      const masterPassword = "ExtensionMasterPassword!123";
      const recoveryKey = "fedcba9876543210fedcba9876543210";
      const testItems: PasswordEntry[] = [
        {
          id: "pwd-ext-1",
          websiteName: "Amazon",
          websiteUrl: "https://amazon.com",
          username: "shopper@amazon.com",
          password: "PrimePassword!456",
          totpSecret: "JBSWY3DPEHPK3PXP",
          category: "Shopping",
          isFavorite: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const { meta } = await initializeEnvelopeVault(masterPassword, recoveryKey, testItems);

      const decrypted = await decryptVaultEnvelope(meta, masterPassword);
      expect(decrypted.length).toBe(1);
      expect(decrypted[0].websiteName).toBe("Amazon");
      expect(decrypted[0].password).toBe("PrimePassword!456");
      expect(decrypted[0].totpSecret).toBe("JBSWY3DPEHPK3PXP");
    });

    it("rejects decryption when wrong master password is provided in extension", async () => {
      const masterPassword = "CorrectPassword123";
      const recoveryKey = "fedcba9876543210fedcba9876543210";
      const { meta } = await initializeEnvelopeVault(masterPassword, recoveryKey, []);

      await expect(
        decryptVaultEnvelope(meta, "WrongPassword999")
      ).rejects.toThrow(/Incorrect master password/);
    });
  });
});

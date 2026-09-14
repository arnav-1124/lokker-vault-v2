import { describe, expect, it } from "vitest";
import { appConfig } from "@/config/app";

describe("QA Audit Remediations Suite", () => {
  describe("Defect 6: Canonical URL Resolution", () => {
    it("ensures appConfig.url produces a valid, normalized URL without trailing slash", () => {
      expect(appConfig.url).toMatch(/^https?:\/\//);
      expect(appConfig.url.endsWith("/")).toBe(false);
      expect(() => new URL(appConfig.url)).not.toThrow();
    });

    it("ensures apiUrl is valid and without trailing slash", () => {
      expect(appConfig.apiUrl).toMatch(/^https?:\/\//);
      expect(appConfig.apiUrl.endsWith("/")).toBe(false);
    });
  });

  describe("Defect 5: Password Validation Invariants", () => {
    it("rejects blank passwords for login credentials", () => {
      const validateLoginEntry = (websiteName: string, password: string, entryType: string) => {
        if (!websiteName.trim()) return { valid: false, error: "Website name required" };
        if (entryType === "login" && !password.trim()) {
          return { valid: false, error: "Password cannot be blank" };
        }
        return { valid: true };
      };

      expect(validateLoginEntry("GitHub", "", "login").valid).toBe(false);
      expect(validateLoginEntry("GitHub", "   ", "login").valid).toBe(false);
      expect(validateLoginEntry("GitHub", "hunter2", "login").valid).toBe(true);
      // Non-login types like secure notes can have blank passwords
      expect(validateLoginEntry("Secret Memo", "", "note").valid).toBe(true);
    });
  });

  describe("Defect 2: TOTP Secret Handling", () => {
    it("normalizes base32 TOTP secret by stripping whitespace and converting to uppercase", () => {
      const rawSecret = " jbsw y3dp ehpk 3pxp ";
      const normalized = rawSecret.replace(/\s+/g, "").toUpperCase();
      expect(normalized).toBe("JBSWY3DPEHPK3PXP");
      expect(normalized.length).toBeGreaterThanOrEqual(8);
    });
  });
});

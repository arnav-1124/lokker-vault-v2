import { describe, it, expect } from "vitest";
import { base32ToBytes, generateTOTPCode } from "../lib/totp";
import { AppError } from "../lib/errors";

// RFC 6238 test secret: ASCII "12345678901234567890" in base32.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("TOTP generation", () => {
  describe("base32 decoding", () => {
    it("decodes base32, tolerating padding, spaces and lowercase", () => {
      const expected = base32ToBytes("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
      expect(base32ToBytes("gezd gnbv gy3t qojq gezd gnbv gy3t qojq====")).toEqual(expected);
    });

    it("produces an empty buffer for garbage input (caller must fail closed)", () => {
      expect(base32ToBytes("!!!").length).toBe(0);
    });
  });

  describe("RFC 6238 test vectors (SHA-1)", () => {
    it("matches the known code for T=59s (8 digits: 94287082)", async () => {
      const { code } = await generateTOTPCode(RFC_SECRET, 30, 8, 59_000);
      expect(code).toBe("94287082");
    });

    it("matches the known code for T=59s (6 digits: 287082)", async () => {
      const { code } = await generateTOTPCode(RFC_SECRET, 30, 6, 59_000);
      expect(code).toBe("287082");
    });

    it("matches the known code for T=1111111109s (6 digits: 081804)", async () => {
      const { code } = await generateTOTPCode(RFC_SECRET, 30, 6, 1_111_111_109_000);
      expect(code).toBe("081804");
    });

    it("reports remaining seconds within the time step", async () => {
      const { secondsRemaining } = await generateTOTPCode(RFC_SECRET, 30, 6, 45_000);
      expect(secondsRemaining).toBe(15);
    });
  });

  describe("fail-closed behavior", () => {
    it("rejects an empty secret with an AppError", async () => {
      await expect(generateTOTPCode("")).rejects.toBeInstanceOf(AppError);
    });

    it("rejects a secret with no valid base32 characters", async () => {
      await expect(generateTOTPCode("!!!!")).rejects.toBeInstanceOf(AppError);
    });

    it("never returns a plausible-looking fallback code on failure", async () => {
      for (const bad of ["", "!!!!", "0000"]) {
        await expect(generateTOTPCode(bad)).rejects.toThrow();
      }
    });

    it("exposes a user-safe message that leaks no secret material", async () => {
      try {
        await generateTOTPCode("!!!!");
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).userMessage).not.toContain("!!!!");
      }
    });
  });
});

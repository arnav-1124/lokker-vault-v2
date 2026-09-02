import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { appConfig } from "@/config/app";
import { generateId, randomHex } from "@/lib/id";

describe("AppError", () => {
  it("exposes a generic userMessage when none is provided", () => {
    const error = new AppError("Internal: key derivation failed", {
      code: "CRYPTO_KDF_FAILED",
    });

    expect(error.code).toBe("CRYPTO_KDF_FAILED");
    expect(error.userMessage).not.toContain("key derivation");
  });

  it("keeps the original error as cause for logs", () => {
    const cause = new Error("boom");
    const error = new AppError("handled", { cause });

    expect(error.cause).toBe(cause);
    expect(error.name).toBe("AppError");
  });
});

describe("generateId / randomHex", () => {
  it("prefixes a cryptographically random UUID", () => {
    const id = generateId("pwd");
    expect(id).toMatch(/^pwd-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("never generates the same id twice", () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateId("x")));
    expect(ids.size).toBe(500);
  });

  it("produces exactly-length lowercase hex strings", () => {
    expect(randomHex(6)).toMatch(/^[0-9a-f]{6}$/);
    expect(randomHex(32)).toMatch(/^[0-9a-f]{32}$/);
  });

  it("produces different values across calls", () => {
    expect(randomHex(12)).not.toBe(randomHex(12));
  });
});

describe("appConfig", () => {
  it("identifies the product", () => {
    expect(appConfig.name).toBe("Lokker");
  });

  it("resolves a valid public URL from the environment", () => {
    expect(() => new URL(appConfig.url)).not.toThrow();
    expect(appConfig.url).toMatch(/^https?:\/\//);
    expect(appConfig.url.endsWith("/")).toBe(false);
  });
});

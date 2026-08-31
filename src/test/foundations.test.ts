import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { appConfig } from "@/config/app";

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

describe("appConfig", () => {
  it("identifies the product", () => {
    expect(appConfig.name).toBe("Lokker");
  });
});

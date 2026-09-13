import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkPasswordBreached } from "../lib/crypto";
import { breachCache } from "../hooks/use-breach-check";

describe("Live Zero-Knowledge Breach Detection (HaveIBeenPwned k-Anonymity)", () => {
  beforeEach(() => {
    breachCache.clear();
    vi.restoreAllMocks();
  });

  it("derives valid 5-char SHA-1 prefix and preserves zero-knowledge privacy", async () => {
    const enc = new TextEncoder();
    const testPassword = "super-secret-password-xyz-99";
    const data = enc.encode(testPassword);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    expect(hashHex).toHaveLength(40);
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    expect(prefix).toHaveLength(5);
    expect(suffix).toHaveLength(35);
    // The prefix must be hexadecimal
    expect(/^[0-9A-F]{5}$/.test(prefix)).toBe(true);
    // The prefix alone cannot reveal the password
    expect(prefix).not.toContain(testPassword);
  });

  it("correctly identifies a breached password from HIBP range response", async () => {
    const password = "password123";
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-1", enc.encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const suffix = hashHex.substring(5);

    // Mock global fetch to return a simulated HIBP response containing the suffix
    const mockResponseText = [
      "0018A45C4D1DEF81644B54AB7F969B88D65:1",
      `${suffix}:14203`,
      "00D4F6E8FA6EEC340B4A0E82300E350E8B5:345",
    ].join("\n");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(mockResponseText, { status: 200 })
    );

    const result = await checkPasswordBreached(password);

    expect(result.breached).toBe(true);
    expect(result.count).toBe(14203);
    expect(result.error).toBeUndefined();

    // Verify Zero-Knowledge guarantee: fetch was called with range/PREFIX only
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`https://api.pwnedpasswords.com/range/${hashHex.substring(0, 5)}`);
    expect(calledUrl).not.toContain(password);
    expect(calledUrl).not.toContain(suffix);
  });

  it("correctly identifies a clean (unbreached) password when suffix is not in response", async () => {
    const cleanPassword = "unique-never-used-passphrase-8842!#%";

    const mockResponseText = [
      "0018A45C4D1DEF81644B54AB7F969B88D65:1",
      "00D4F6E8FA6EEC340B4A0E82300E350E8B5:345",
    ].join("\n");

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(mockResponseText, { status: 200 })
    );

    const result = await checkPasswordBreached(cleanPassword);

    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
    expect(result.error).toBeUndefined();
  });

  it("handles network failure gracefully without throwing exceptions", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await checkPasswordBreached("some-password");

    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
    expect(result.error).toBe("Network error");
  });

  it("caches breach check results in memory to avoid redundant network requests", async () => {
    const pwd = "cached-test-password";
    const cachedEntry = { breached: true, count: 550 };
    breachCache.set(pwd, cachedEntry);

    expect(breachCache.has(pwd)).toBe(true);
    expect(breachCache.get(pwd)?.count).toBe(550);
  });

  it("returns immediate empty clean state for empty password", async () => {
    const result = await checkPasswordBreached("");
    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
  });
});

import { describe, it, expect, vi } from "vitest";
import { createRelayAlias, toggleRelayAlias, testRelayConnection } from "../lib/masked-email";
import { MaskedEmail, RelayConfig } from "../types";

describe("Masked Email Relay Engine (BYOK Model)", () => {
  it("generates offline duck.com alias with random hex when no API key is provided", async () => {
    const alias = await createRelayAlias("duck", {}, { prefix: "shopping", note: "Online purchases" });
    expect(alias.provider).toBe("duck");
    expect(alias.alias).toMatch(/^shopping\.[a-f0-9]{6}@duck\.com$/);
    expect(alias.note).toBe("Online purchases");
    expect(alias.isEnabled).toBe(true);
  });

  it("generates custom catch-all domain alias accurately", async () => {
    const alias = await createRelayAlias("custom", {}, { prefix: "test", customDomain: "myvault.org" });
    expect(alias.provider).toBe("custom");
    expect(alias.alias).toMatch(/^test\.[a-f0-9]{6}@myvault\.org$/);
  });

  it("throws clear error when SimpleLogin API key is missing", async () => {
    await expect(createRelayAlias("simplelogin", {})).rejects.toThrow(/SimpleLogin API key is missing/);
  });

  it("throws clear error when Addy.io API key is missing", async () => {
    await expect(createRelayAlias("addy", {})).rejects.toThrow(/Addy\.io API key is missing/);
  });

  it("calls SimpleLogin endpoint with correct Authentication header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ alias: "random_sl@slmail.me", id: 101, enabled: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const config: RelayConfig = {
      simpleloginApiKey: "test_sl_key_123",
    };

    const alias = await createRelayAlias("simplelogin", config, { note: "Test alias" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://app.simplelogin.io/api/alias/random/new",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authentication: "ApiKey test_sl_key_123",
        }),
      })
    );
    expect(alias.alias).toBe("random_sl@slmail.me");
    expect(alias.providerAliasId).toBe("101");
    expect(alias.provider).toBe("simplelogin");

    vi.unstubAllGlobals();
  });

  it("calls Addy.io endpoint with Bearer token header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { email: "alias_addy@anonaddy.me", id: "addy_uuid_99", active: true } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const config: RelayConfig = {
      addyApiKey: "test_addy_token_456",
    };

    const alias = await createRelayAlias("addy", config, { prefix: "stream" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://app.addy.io/api/v1/aliases",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test_addy_token_456",
        }),
      })
    );
    expect(alias.alias).toBe("alias_addy@anonaddy.me");
    expect(alias.providerAliasId).toBe("addy_uuid_99");
    expect(alias.provider).toBe("addy");

    vi.unstubAllGlobals();
  });
});

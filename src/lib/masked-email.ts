/**
 * Lokker Masked Email & Privacy Relay Client (Zero-Backend / BYOK Model)
 * Directly interacts with SimpleLogin, Addy.io, and local generation engines
 * from the user's browser using client-managed API credentials.
 */

import { MaskedEmail, RelayConfig } from "@/types";
import { generateId, randomHex } from "./id";

export interface CreateAliasOptions {
  prefix?: string;
  note?: string;
  customDomain?: string;
}

/**
 * Creates a new email alias using the configured relay provider.
 */
export async function createRelayAlias(
  provider: "simplelogin" | "addy" | "duck" | "custom",
  config: RelayConfig = {},
  options: CreateAliasOptions = {}
): Promise<MaskedEmail> {
  const now = Date.now();

  // 1. SimpleLogin API (BYOK)
  if (provider === "simplelogin") {
    const apiKey = config.simpleloginApiKey?.trim();
    if (!apiKey) {
      throw new Error("SimpleLogin API key is missing. Please enter your API key in settings.");
    }
    const baseUrl = (config.simpleloginBaseUrl?.trim() || "https://app.simplelogin.io").replace(/\/+$/, "");

    const response = await fetch(`${baseUrl}/api/alias/random/new`, {
      method: "POST",
      headers: {
        "Authentication": `ApiKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        note: options.note || "Created with Lokker Vault",
      }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Invalid SimpleLogin API key. Please verify your credentials.");
      if (response.status === 429) throw new Error("SimpleLogin rate limit reached. Please wait a moment.");
      throw new Error(`SimpleLogin error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: generateId("alias"),
      alias: data.alias,
      provider: "simplelogin",
      providerAliasId: String(data.id),
      note: options.note,
      isEnabled: data.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
  }

  // 2. Addy.io API (BYOK)
  if (provider === "addy") {
    const apiKey = config.addyApiKey?.trim();
    if (!apiKey) {
      throw new Error("Addy.io API key is missing. Please enter your API key in settings.");
    }
    const baseUrl = (config.addyBaseUrl?.trim() || "https://app.addy.io/api/v1").replace(/\/+$/, "");

    const response = await fetch(`${baseUrl}/aliases`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        description: options.note || "Created with Lokker Vault",
        format: options.prefix ? "custom" : "uuid",
        ...(options.prefix ? { local_part: options.prefix.toLowerCase().replace(/[^a-z0-9]/g, "") } : {}),
      }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Invalid Addy.io API key. Please check your token.");
      if (response.status === 429) throw new Error("Addy.io rate limit reached.");
      throw new Error(`Addy.io error (${response.status}): ${response.statusText}`);
    }

    const resJson = await response.json();
    const item = resJson.data || resJson;
    return {
      id: generateId("alias"),
      alias: item.email,
      provider: "addy",
      providerAliasId: String(item.id),
      note: options.note,
      isEnabled: item.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
  }

  // 3. Local DuckDuckGo / Custom Domain Generator (No API required)
  const hex = randomHex(6);
  const cleanPrefix = options.prefix?.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  let domain = "duck.com";
  if (provider === "custom" && options.customDomain?.trim()) {
    domain = options.customDomain.trim().replace(/^@/, "");
  }

  const alias = cleanPrefix ? `${cleanPrefix}.${hex}@${domain}` : `lokker.${hex}@${domain}`;

  return {
    id: generateId("alias"),
    alias,
    provider,
    note: options.note,
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Toggles an alias enabled/disabled status in the remote provider if supported.
 */
export async function toggleRelayAlias(
  alias: MaskedEmail,
  config: RelayConfig = {}
): Promise<MaskedEmail> {
  const newStatus = !alias.isEnabled;
  let remoteStatus = newStatus;

  if (alias.provider === "simplelogin" && alias.providerAliasId) {
    const apiKey = config.simpleloginApiKey?.trim();
    if (!apiKey) throw new Error("SimpleLogin API key missing.");
    const baseUrl = (config.simpleloginBaseUrl?.trim() || "https://app.simplelogin.io").replace(/\/+$/, "");

    const res = await fetch(`${baseUrl}/api/aliases/${alias.providerAliasId}/toggle`, {
      method: "POST",
      headers: { "Authentication": `ApiKey ${apiKey}` },
    });
    if (!res.ok) throw new Error("Failed to toggle SimpleLogin alias.");
    const data = await res.json();
    remoteStatus = data.enabled ?? newStatus;
  } else if (alias.provider === "addy" && alias.providerAliasId) {
    const apiKey = config.addyApiKey?.trim();
    if (!apiKey) throw new Error("Addy.io API key missing.");
    const baseUrl = (config.addyBaseUrl?.trim() || "https://app.addy.io/api/v1").replace(/\/+$/, "");

    const endpoint = newStatus
      ? `${baseUrl}/aliases/${alias.providerAliasId}/active`
      : `${baseUrl}/aliases/${alias.providerAliasId}/deactivate`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    if (!res.ok) throw new Error("Failed to toggle Addy.io alias.");
    remoteStatus = newStatus;
  }

  return {
    ...alias,
    isEnabled: remoteStatus,
    updatedAt: Date.now(),
  };
}

/**
 * Validates the API key for a specified provider.
 */
export async function testRelayConnection(
  provider: "simplelogin" | "addy",
  config: RelayConfig = {}
): Promise<{ success: boolean; message: string }> {
  try {
    if (provider === "simplelogin") {
      const apiKey = config.simpleloginApiKey?.trim();
      if (!apiKey) return { success: false, message: "API key is empty." };
      const baseUrl = (config.simpleloginBaseUrl?.trim() || "https://app.simplelogin.io").replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/api/user_info`, {
        headers: { "Authentication": `ApiKey ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: `Connected as ${data.name || data.email || "SimpleLogin User"}` };
      }
      return { success: false, message: `Authentication failed (${res.status})` };
    }

    if (provider === "addy") {
      const apiKey = config.addyApiKey?.trim();
      if (!apiKey) return { success: false, message: "API key is empty." };
      const baseUrl = (config.addyBaseUrl?.trim() || "https://app.addy.io/api/v1").replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/account-details`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: `Connected as ${data.data?.username || "Addy.io User"}` };
      }
      return { success: false, message: `Authentication failed (${res.status})` };
    }

    return { success: true, message: "Offline provider ready." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { success: false, message: msg };
  }
}

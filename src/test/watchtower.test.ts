import { describe, it, expect } from "vitest";
import {
  normalizeServiceDomain,
  lookup2FASupport,
  analyzeWatchtowerSecurity,
  TWO_FACTOR_DIRECTORY,
} from "../lib/watchtower";
import { PasswordEntry } from "../types";

describe("Watchtower & 2FA Directory Intelligence", () => {
  it("normalizes domains and URLs accurately", () => {
    expect(normalizeServiceDomain("https://github.com/login")).toBe("github.com");
    expect(normalizeServiceDomain("http://www.sub.google.com:8080/path")).toBe("sub.google.com");
    expect(normalizeServiceDomain("DISCORD.COM")).toBe("discord.com");
    expect(normalizeServiceDomain("")).toBe("");
  });

  it("matches services supporting 2FA correctly from directory", () => {
    const github = lookup2FASupport("https://github.com/settings");
    expect(github).not.toBeNull();
    expect(github?.name).toBe("GitHub");
    expect(github?.supportsTotp).toBe(true);
    expect(github?.docUrl).toBeDefined();

    const aws = lookup2FASupport("https://aws.amazon.com/console");
    expect(aws?.name).toBe("AWS");

    const unknown = lookup2FASupport("https://randomunknownservice12345.org");
    expect(unknown).toBeNull();
  });

  it("detects missing 2FA, weak passwords, reused passwords, and stale entries in watchtower audit", () => {
    const now = Date.now();
    const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;

    const testEntries: PasswordEntry[] = [
      {
        id: "p1",
        websiteName: "GitHub",
        websiteUrl: "https://github.com",
        username: "dev@octo.com",
        password: "SuperSecretPassword!456",
        category: "Work",
        isFavorite: false,
        // No totpSecret -> should flag missing 2FA
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "p2",
        websiteName: "Discord",
        websiteUrl: "https://discord.com",
        username: "gamer",
        password: "123", // Weak password
        category: "Social",
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "p3",
        websiteName: "Random Forum",
        websiteUrl: "https://myforum.xyz",
        username: "forumuser",
        password: "SuperSecretPassword!456", // Reused password from GitHub
        category: "General",
        isFavorite: false,
        createdAt: twoYearsAgo,
        updatedAt: twoYearsAgo, // Stale password
      },
    ];

    const report = analyzeWatchtowerSecurity(testEntries, {
      "123": { breached: true, count: 5000 },
    });

    expect(report.totalLogins).toBe(3);
    // Missing 2FA (both GitHub and Discord support 2FA)
    expect(report.missingTwoFactorItems.length).toBe(2);
    expect(report.missingTwoFactorItems.map((m) => m.service.name)).toContain("GitHub");
    expect(report.missingTwoFactorItems.map((m) => m.service.name)).toContain("Discord");

    // Weak
    expect(report.weakItems.length).toBe(1);
    expect(report.weakItems[0].entry.id).toBe("p2");

    // Breached
    expect(report.breachedItems.length).toBe(1);
    expect(report.breachedItems[0].breachCount).toBe(5000);

    // Reused
    expect(report.reusedItems.length).toBe(2);

    // Stale
    expect(report.staleItems.length).toBe(1);
    expect(report.staleItems[0].entry.id).toBe("p3");

    // Score deduction
    expect(report.overallScore).toBeLessThan(70);
  });
});

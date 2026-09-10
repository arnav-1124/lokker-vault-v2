/**
 * Lokker Automated Security Watchtower & 2FA Directory Intelligence
 * Continuous zero-knowledge security evaluation, 2FA directory matching,
 * compromised password tracking, and actionable remediation matrix.
 */

import { PasswordEntry } from "@/types";
import { calculatePasswordStrength } from "./crypto";

export interface TwoFactorServiceInfo {
  name: string;
  domains: string[];
  docUrl?: string;
  supportsTotp: boolean;
  supportsSecurityKey?: boolean;
}

/**
 * Curated high-fidelity dataset of major online services known to support 2FA.
 * Derived from open standards and 2fa.directory.
 */
export const TWO_FACTOR_DIRECTORY: TwoFactorServiceInfo[] = [
  // Developer & Infrastructure
  { name: "GitHub", domains: ["github.com"], docUrl: "https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa", supportsTotp: true, supportsSecurityKey: true },
  { name: "GitLab", domains: ["gitlab.com"], docUrl: "https://docs.gitlab.com/ee/user/profile/account/two_factor_authentication.html", supportsTotp: true, supportsSecurityKey: true },
  { name: "Bitbucket", domains: ["bitbucket.org"], docUrl: "https://support.atlassian.com/bitbucket-cloud/docs/enable-two-step-verification/", supportsTotp: true },
  { name: "npm", domains: ["npmjs.com"], docUrl: "https://docs.npmjs.com/configuring-two-factor-authentication", supportsTotp: true, supportsSecurityKey: true },
  { name: "Docker", domains: ["docker.com", "hub.docker.com"], docUrl: "https://docs.docker.com/security/for-admins/two-factor-authentication/", supportsTotp: true },
  { name: "Cloudflare", domains: ["cloudflare.com"], docUrl: "https://developers.cloudflare.com/fundamentals/setup/account/2fa/", supportsTotp: true, supportsSecurityKey: true },
  { name: "AWS", domains: ["aws.amazon.com", "amazon.com/aws"], docUrl: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html", supportsTotp: true, supportsSecurityKey: true },
  { name: "DigitalOcean", domains: ["digitalocean.com"], docUrl: "https://docs.digitalocean.com/products/accounts/security/2fa/", supportsTotp: true },
  { name: "Vercel", domains: ["vercel.com"], docUrl: "https://vercel.com/docs/accounts/account-security#two-factor-authentication", supportsTotp: true, supportsSecurityKey: true },
  { name: "Heroku", domains: ["heroku.com"], docUrl: "https://devcenter.heroku.com/articles/two-factor-authentication", supportsTotp: true },
  { name: "Atlassian", domains: ["atlassian.com", "jira.com", "trello.com"], docUrl: "https://support.atlassian.com/atlassian-account/docs/manage-two-step-verification/", supportsTotp: true },

  // Communication, Social & Workspace
  { name: "Google", domains: ["google.com", "gmail.com", "accounts.google.com"], docUrl: "https://support.google.com/accounts/answer/185839", supportsTotp: true, supportsSecurityKey: true },
  { name: "Microsoft", domains: ["microsoft.com", "live.com", "outlook.com", "office.com"], docUrl: "https://support.microsoft.com/en-us/account-billing/how-to-use-two-step-verification-with-your-microsoft-account-c7910146-672f-01e9-50a0-93b4585e7eb4", supportsTotp: true, supportsSecurityKey: true },
  { name: "Apple", domains: ["apple.com", "icloud.com"], docUrl: "https://support.apple.com/en-us/HT204915", supportsTotp: true },
  { name: "X / Twitter", domains: ["twitter.com", "x.com"], docUrl: "https://help.twitter.com/en/managing-your-account/two-factor-authentication", supportsTotp: true, supportsSecurityKey: true },
  { name: "Discord", domains: ["discord.com", "discordapp.com"], docUrl: "https://support.discord.com/hc/en-us/articles/219576828-Setting-up-Two-Factor-Authentication", supportsTotp: true, supportsSecurityKey: true },
  { name: "Slack", domains: ["slack.com"], docUrl: "https://slack.com/help/articles/204509068-Set-up-two-factor-authentication", supportsTotp: true },
  { name: "Reddit", domains: ["reddit.com"], docUrl: "https://support.reddithelp.com/hc/en-us/articles/360043470031-How-do-I-set-up-two-factor-authentication", supportsTotp: true },
  { name: "LinkedIn", domains: ["linkedin.com"], docUrl: "https://www.linkedin.com/help/linkedin/answer/a1340632", supportsTotp: true },
  { name: "Facebook", domains: ["facebook.com", "meta.com"], docUrl: "https://www.facebook.com/help/148233965247823", supportsTotp: true, supportsSecurityKey: true },
  { name: "Instagram", domains: ["instagram.com"], docUrl: "https://help.instagram.com/566810106808145", supportsTotp: true },
  { name: "Notion", domains: ["notion.so"], docUrl: "https://www.notion.so/help/2-factor-authentication", supportsTotp: true },
  { name: "Dropbox", domains: ["dropbox.com"], docUrl: "https://help.dropbox.com/account-access/turn-on-two-step-verification", supportsTotp: true, supportsSecurityKey: true },
  { name: "Box", domains: ["box.com"], docUrl: "https://support.box.com/hc/en-us/articles/360043697154-Multi-Factor-Authentication-MFA-Set-Up-for-Your-Account", supportsTotp: true },
  { name: "Zoom", domains: ["zoom.us"], docUrl: "https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065099", supportsTotp: true },

  // Financial & Crypto
  { name: "PayPal", domains: ["paypal.com"], docUrl: "https://www.paypal.com/us/smarthelp/article/how-do-i-turn-on-2-step-verification-faq4057", supportsTotp: true },
  { name: "Coinbase", domains: ["coinbase.com"], docUrl: "https://help.coinbase.com/en/coinbase/getting-started/verify-my-account/2-step-verification-faq", supportsTotp: true, supportsSecurityKey: true },
  { name: "Binance", domains: ["binance.com"], docUrl: "https://www.binance.com/en/support/faq/how-to-enable-google-authenticator-on-binance-app-115001765651", supportsTotp: true, supportsSecurityKey: true },
  { name: "Kraken", domains: ["kraken.com"], docUrl: "https://support.kraken.com/hc/en-us/articles/360000426923-Securing-your-account-with-Two-Factor-Authentication-2FA-", supportsTotp: true, supportsSecurityKey: true },
  { name: "Stripe", domains: ["stripe.com"], docUrl: "https://stripe.com/docs/security/two-factor-authentication", supportsTotp: true, supportsSecurityKey: true },

  // Gaming & Entertainment
  { name: "Steam", domains: ["steampowered.com", "steamcommunity.com"], docUrl: "https://help.steampowered.com/en/faqs/view/2E30-D13A-066F-2337", supportsTotp: true },
  { name: "Epic Games", domains: ["epicgames.com"], docUrl: "https://www.epicgames.com/help/en-US/epic-accounts-c74/account-security-c111/twofactor-authentication-and-how-to-enable-it-a3218", supportsTotp: true },
  { name: "Twitch", domains: ["twitch.tv"], docUrl: "https://help.twitch.tv/s/article/two-factor-authentication", supportsTotp: true },
  { name: "PlayStation", domains: ["playstation.com", "sony.com"], docUrl: "https://www.playstation.com/en-us/support/account/2sv-psn-login/", supportsTotp: true },
  { name: "Nintendo", domains: ["nintendo.com"], docUrl: "https://en-americas-support.nintendo.com/app/answers/detail/a_id/27496", supportsTotp: true },
  { name: "Battle.net", domains: ["battle.net", "blizzard.com"], docUrl: "https://support.blizzard.com/article/00024520", supportsTotp: true },

  // Commerce & Retail
  { name: "Amazon", domains: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.ca", "amazon.in"], docUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=G3PWZPU52FKN7PW4", supportsTotp: true, supportsSecurityKey: true },
  { name: "eBay", domains: ["ebay.com"], docUrl: "https://www.ebay.com/help/account/protecting-account/2step-verification?id=4508", supportsTotp: true },
];

/**
 * Normalizes any website URL, name, or domain into a clean lowercase domain for matching.
 */
export function normalizeServiceDomain(urlOrName: string): string {
  if (!urlOrName) return "";
  let clean = urlOrName.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "");
  clean = clean.split("/")[0];
  clean = clean.split(":")[0];
  clean = clean.replace(/^www\./, "");
  return clean;
}

/**
 * Checks if a given domain or service name matches our 2FA Directory dataset.
 */
export function lookup2FASupport(domainOrUrl: string): TwoFactorServiceInfo | null {
  const clean = normalizeServiceDomain(domainOrUrl);
  if (!clean) return null;

  for (const service of TWO_FACTOR_DIRECTORY) {
    if (service.name.toLowerCase() === clean) {
      return service;
    }
    for (const domain of service.domains) {
      if (clean === domain || clean.endsWith(`.${domain}`)) {
        return service;
      }
    }
  }
  return null;
}

export interface WatchtowerReport {
  overallScore: number;
  totalLogins: number;
  breachedItems: { entry: PasswordEntry; breachCount: number }[];
  missingTwoFactorItems: { entry: PasswordEntry; service: TwoFactorServiceInfo }[];
  weakItems: { entry: PasswordEntry; score: number }[];
  reusedItems: { entry: PasswordEntry; count: number }[];
  staleItems: { entry: PasswordEntry; daysOld: number }[];
  emptyItems: PasswordEntry[];
  healthyCount: number;
}

const STALE_THRESHOLD_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Audits passwords and returns a comprehensive Watchtower security report.
 */
export function analyzeWatchtowerSecurity(
  passwords: PasswordEntry[],
  breachResults: Record<string, { breached: boolean; count: number }> = {}
): WatchtowerReport {
  const logins = passwords.filter((p) => !p.entryType || p.entryType === "login");
  const now = Date.now();

  const breachedItems: { entry: PasswordEntry; breachCount: number }[] = [];
  const missingTwoFactorItems: { entry: PasswordEntry; service: TwoFactorServiceInfo }[] = [];
  const weakItems: { entry: PasswordEntry; score: number }[] = [];
  const reusedItems: { entry: PasswordEntry; count: number }[] = [];
  const staleItems: { entry: PasswordEntry; daysOld: number }[] = [];
  const emptyItems: PasswordEntry[] = [];

  // Count password frequencies to detect reuse
  const passwordCounts: Record<string, number> = {};
  logins.forEach((p) => {
    if (p.password && p.password.trim().length > 0) {
      passwordCounts[p.password] = (passwordCounts[p.password] || 0) + 1;
    }
  });

  logins.forEach((entry) => {
    // 1. Empty password
    if (!entry.password || entry.password.trim().length === 0) {
      emptyItems.push(entry);
      return;
    }

    // 2. Dark Web Breach Check
    const breach = breachResults[entry.password];
    if (breach && breach.breached) {
      breachedItems.push({ entry, breachCount: breach.count });
    }

    // 3. Password Strength (Score <= 40 = Weak)
    const strength = calculatePasswordStrength(entry.password);
    if (strength.score <= 40) {
      weakItems.push({ entry, score: strength.score });
    }

    // 4. Reused Passwords
    if (passwordCounts[entry.password] > 1) {
      reusedItems.push({ entry, count: passwordCounts[entry.password] });
    }

    // 5. 2FA Directory Intelligence
    const matchedService = lookup2FASupport(entry.websiteUrl || entry.websiteName);
    const hasTotp = !!entry.totpSecret && entry.totpSecret.trim().length > 0;
    if (matchedService && !hasTotp) {
      missingTwoFactorItems.push({ entry, service: matchedService });
    }

    // 6. Stale Credentials (> 365 days since update)
    const lastUpdate = entry.updatedAt || entry.createdAt || now;
    const daysOld = Math.floor((now - lastUpdate) / MS_PER_DAY);
    if (daysOld >= STALE_THRESHOLD_DAYS) {
      staleItems.push({ entry, daysOld });
    }
  });

  // Calculate composite score (0-100)
  let score = 100;
  score -= breachedItems.length * 25; // Breached passwords are catastrophic
  score -= weakItems.length * 15;
  score -= reusedItems.length * 10;
  score -= emptyItems.length * 10;
  score -= missingTwoFactorItems.length * 5;
  score -= staleItems.length * 2;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  // Healthy logins are those with no critical issues
  const troubledIds = new Set([
    ...breachedItems.map((b) => b.entry.id),
    ...weakItems.map((w) => w.entry.id),
    ...reusedItems.map((r) => r.entry.id),
    ...emptyItems.map((e) => e.id),
  ]);
  const healthyCount = logins.filter((p) => !troubledIds.has(p.id)).length;

  return {
    overallScore: finalScore,
    totalLogins: logins.length,
    breachedItems,
    missingTwoFactorItems,
    weakItems,
    reusedItems,
    staleItems,
    emptyItems,
    healthyCount,
  };
}

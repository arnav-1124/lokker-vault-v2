"use client";

import * as React from "react";
import Link from "next/link";
import {
  Terminal,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Search,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Lock,
  Database,
  ArrowUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

interface DocTopic {
  id: string;
  category: string;
  title: string;
  badge?: string;
  badgeColor?: "sky" | "emerald" | "purple" | "amber" | "rose";
  description: string;
  headings: { id: string; title: string }[];
  renderContent: (pm: "pnpm" | "npm" | "yarn" | "bun", setPm: (p: "pnpm" | "npm" | "yarn" | "bun") => void) => React.ReactNode;
}

/**
 * Colorful syntax-highlighted code block with copy button
 */
function CodeBlock({
  filename,
  language = "TypeScript",
  children,
  packageTabs,
  activeTab,
  onTabChange,
}: {
  filename?: string;
  language?: string;
  children: React.ReactNode;
  packageTabs?: ("pnpm" | "npm" | "yarn" | "bun")[];
  activeTab?: "pnpm" | "npm" | "yarn" | "bun";
  onTabChange?: (tab: "pnpm" | "npm" | "yarn" | "bun") => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const codeRef = React.useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      const text = codeRef.current?.innerText || "";
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-5 rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 bg-[#121212] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          {packageTabs && onTabChange ? (
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-neutral-800">
              {packageTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "bg-neutral-800 text-white font-semibold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Terminal className="size-3.5 text-sky-400" />
              <span className="font-mono text-[12px] text-neutral-300 font-medium">
                {filename || language}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline-block">
            {language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code snippet"
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer bg-neutral-900/80 hover:bg-neutral-800 px-2 py-1 rounded border border-neutral-800"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area with High-Contrast Colorful Tokens */}
      <div
        ref={codeRef}
        className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-[#0a0a0a]"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Visual Diagram Card (Inspired by Next.js directory and architecture flowcards)
 */
function DiagramCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-950/80 to-black p-6 relative overflow-hidden shadow-xl">
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      {title && (
        <div className="relative z-10 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-sky-400" />
          <span>{title}</span>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Pill({
  children,
  color = "sky",
}: {
  children: React.ReactNode;
  color?: "sky" | "emerald" | "purple" | "amber" | "rose";
}) {
  const styles = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/25",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/25",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  }[color];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] border font-medium mx-0.5 ${styles}`}
    >
      {children}
    </span>
  );
}

function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "tip" | "warning" | "security";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      border: "border-sky-500/30",
      bg: "bg-sky-500/5",
      icon: <Info className="size-4 text-sky-400 shrink-0 mt-0.5" />,
      defaultTitle: "Note",
    },
    tip: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      icon: <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />,
      defaultTitle: "Pro Tip",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      icon: <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />,
      defaultTitle: "Warning",
    },
    security: {
      border: "border-primary/40",
      bg: "bg-primary/10",
      icon: <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />,
      defaultTitle: "Zero-Knowledge Invariant",
    },
  }[type];

  return (
    <div className={`my-5 p-4 rounded-xl border ${styles.border} ${styles.bg} flex items-start gap-3`}>
      {styles.icon}
      <div className="space-y-1 text-xs sm:text-sm text-neutral-300 leading-relaxed">
        {title && <h4 className="font-semibold text-white text-xs">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// DOC TOPICS DATA: 100% FOCUSED ON LOKKER VAULT APP
// ---------------------------------------------------------
const DOC_TOPICS: DocTopic[] = [
  {
    id: "vault-overview",
    category: "Architecture & Foundations",
    title: "Architecture & Zero-Knowledge Invariants",
    badge: "Local-First Core",
    badgeColor: "emerald",
    description:
      "Lokker Vault is a 100% local-first personal security workspace operating entirely on client hardware via native Web Crypto and IndexedDB.",
    headings: [
      { id: "local-first-guarantee", title: "Local-First Guarantee" },
      { id: "data-flow-diagram", title: "Client Data Flow" },
      { id: "crypto-spec", title: "Cryptographic Primitives" },
    ],
    renderContent: () => (
      <>
        <p className="text-neutral-300 text-sm leading-relaxed">
          The password vault is the security core. Unlike legacy cloud managers that hold ciphertext on multi-tenant servers, Lokker guarantees: <span className="text-white font-semibold">Your device is the sole data authority</span>. No plaintext ever leaves your browser memory.
        </p>

        <h3 id="data-flow-diagram" className="text-base font-semibold text-white mt-6 mb-2">
          Client Cryptographic Flow
        </h3>

        <DiagramCard title="Client Hardware Isolation">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="w-full md:w-auto flex-1 p-3 rounded-xl border border-neutral-800 bg-[#121212] text-center space-y-1">
              <span className="text-pink-400 font-semibold">1. User Master Secret</span>
              <p className="text-[11px] text-neutral-400">Master Password or Hardware Passkey</p>
            </div>
            <span className="text-sky-400 font-bold hidden md:inline">──►</span>
            <span className="text-sky-400 font-bold md:hidden">▼</span>
            <div className="w-full md:w-auto flex-1 p-3 rounded-xl border border-sky-500/40 bg-sky-500/10 text-center space-y-1">
              <span className="text-sky-300 font-semibold">2. Key Derivation</span>
              <p className="text-[11px] text-neutral-300">PBKDF2-SHA256 (100k) or PRF Output</p>
            </div>
            <span className="text-sky-400 font-bold hidden md:inline">──►</span>
            <span className="text-sky-400 font-bold md:hidden">▼</span>
            <div className="w-full md:w-auto flex-1 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center space-y-1">
              <span className="text-emerald-300 font-semibold">3. 256-bit VEK</span>
              <p className="text-[11px] text-neutral-300">Unwraps AES-GCM Vault Payload</p>
            </div>
          </div>
        </DiagramCard>

        <h3 id="crypto-spec" className="text-base font-semibold text-white mt-6 mb-2">
          Verified Cryptographic Primitives
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed">
          Every sensitive object utilizes standard <Pill color="emerald">AES-GCM 256-bit</Pill> with cryptographically random <Pill color="sky">12-byte IVs</Pill> generated via <Pill color="purple">crypto.getRandomValues()</Pill>.
        </p>

        <Callout type="security" title="Zero Telemetry & Zero Escrow">
          There are no analytics SDKs, error trackers, or telemetry beacons. Your master password cannot be recovered by any third party; only your physical Emergency Recovery Key or biometric hardware slot can restore access.
        </Callout>
      </>
    ),
  },
  {
    id: "envelope-encryption",
    category: "Architecture & Foundations",
    title: "3-Tier Envelope Encryption & Key Derivation",
    badge: "VEK / KEK Hierarchy",
    badgeColor: "sky",
    description:
      "Deep dive into Lokker's 3-Tier Envelope Architecture separating vault payload encryption from credential key wrapping.",
    headings: [
      { id: "three-tiers", title: "The 3 Envelope Tiers" },
      { id: "code-example", title: "Key Derivation Code" },
      { id: "zero-reencryption", title: "Zero-Re-encryption Rotation" },
    ],
    renderContent: () => (
      <>
        <p className="text-neutral-300 text-sm leading-relaxed">
          To eliminate re-encryption bottlenecks across large vaults, Lokker decouples the payload encryption key from user authentication secrets:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-[#121212] space-y-1">
            <span className="text-xs font-semibold text-emerald-400">Tier 1: VEK</span>
            <p className="text-[11px] text-neutral-400">
              Random 256-bit AES-GCM key that encrypts stored records and file attachments.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-[#121212] space-y-1">
            <span className="text-xs font-semibold text-sky-400">Tier 2: Password KEK</span>
            <p className="text-[11px] text-neutral-400">
              Derived from Master Password + 16-byte random salt via 100,000 PBKDF2 iterations.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-[#121212] space-y-1">
            <span className="text-xs font-semibold text-purple-400">Tier 3: Recovery KEK</span>
            <p className="text-[11px] text-neutral-400">
              Derived from 32-character Emergency Recovery Key. Wraps the same underlying VEK.
            </p>
          </div>
        </div>

        <h3 id="code-example" className="text-base font-semibold text-white mt-6 mb-2">
          Envelope Key Derivation Implementation
        </h3>

        <CodeBlock filename="src/lib/crypto.ts" language="TypeScript">
          <pre>
            <span className="text-neutral-500 italic">{"// 1. Derive Password KEK via PBKDF2 (100,000 iterations)"}</span>{"\n"}
            <span className="text-pink-400 font-semibold">const</span> <span className="text-amber-300">kek</span> = <span className="text-pink-400 font-semibold">await</span> window.crypto.subtle.<span className="text-amber-300">deriveKey</span>({"{"}{"\n"}
            {"  "}name: <span className="text-emerald-300">&quot;PBKDF2&quot;</span>,{"\n"}
            {"  "}salt: saltBuffer,{"\n"}
            {"  "}iterations: <span className="text-orange-400 font-mono">100_000</span>,{"\n"}
            {"  "}hash: <span className="text-emerald-300">&quot;SHA-256&quot;</span>,{"\n"}
            {"}"}, masterKeyMaterial, {"{"} name: <span className="text-emerald-300">&quot;AES-GCM&quot;</span>, length: <span className="text-orange-400 font-mono">256</span> {"}"}, <span className="text-orange-400">false</span>, [<span className="text-emerald-300">&quot;wrapKey&quot;</span>, <span className="text-emerald-300">&quot;unwrapKey&quot;</span>]);{"\n\n"}
            <span className="text-neutral-500 italic">{"// 2. Wrap 256-bit VEK under Password KEK with random 12-byte IV"}</span>{"\n"}
            <span className="text-pink-400 font-semibold">const</span> <span className="text-amber-300">wrappedVek</span> = <span className="text-pink-400 font-semibold">await</span> window.crypto.subtle.<span className="text-amber-300">wrapKey</span>({"{"}{"\n"}
            {"  "}format: <span className="text-emerald-300">&quot;raw&quot;</span>,{"\n"}
            {"  "}key: vek,{"\n"}
            {"  "}wrappingKey: kek,{"\n"}
            {"  "}wrapAlgorithm: {"{"} name: <span className="text-emerald-300">&quot;AES-GCM&quot;</span>, iv: randomIv12Bytes {"}"}{"\n"}
            {"}"});
          </pre>
        </CodeBlock>
      </>
    ),
  },
  {
    id: "webauthn-passkeys",
    category: "Authentication & Hardware Keys",
    title: "WebAuthn PRF Biometrics & Passkey Vault",
    badge: "FIDO2 / WebAuthn",
    badgeColor: "purple",
    description:
      "Hardware-backed biometric unlock via WebAuthn PRF and native ECDSA P-256 (ES256) passkey generation and assertion signing.",
    headings: [
      { id: "prf-hardware", title: "WebAuthn PRF Hardware Unlock" },
      { id: "passkey-engine", title: "ES256 Passkey Vault Engine" },
    ],
    renderContent: () => (
      <>
        <p className="text-neutral-300 text-sm leading-relaxed">
          Lokker implements two groundbreaking WebAuthn capabilities: hardware-backed PRF unlock for the vault, and a full FIDO2 passkey credentials manager.
        </p>

        <h3 id="prf-hardware" className="text-base font-semibold text-white mt-6 mb-2">
          1. WebAuthn PRF Biometric Key Derivation
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed">
          The <Pill color="purple">WebAuthn PRF extension</Pill> derives symmetric keys directly from security chips (YubiKey 5, Google Password Manager, Touch ID). The hardware evaluates an HMAC-SHA-256 over a constant salt, giving Lokker a symmetric key to unwrap the VEK without caching master passwords.
        </p>

        <h3 id="passkey-engine" className="text-base font-semibold text-white mt-6 mb-2">
          2. FIDO2 / ES256 Passkey Generation & Challenge Signing
        </h3>

        <CodeBlock filename="src/lib/passkey.ts" language="TypeScript">
          <pre>
            <span className="text-neutral-500 italic">{"// Generate WebAuthn ES256 (ECDSA P-256) Keypair client-side"}</span>{"\n"}
            <span className="text-pink-400 font-semibold">const</span> <span className="text-amber-300">keyPair</span> = <span className="text-pink-400 font-semibold">await</span> window.crypto.subtle.<span className="text-amber-300">generateKey</span>({"{"}{"\n"}
            {"  "}name: <span className="text-emerald-300">&quot;ECDSA&quot;</span>,{"\n"}
            {"  "}namedCurve: <span className="text-emerald-300">&quot;P-256&quot;</span>,{"\n"}
            {"}"}, <span className="text-orange-400">true</span>, [<span className="text-emerald-300">&quot;sign&quot;</span>, <span className="text-emerald-300">&quot;verify&quot;</span>]);{"\n\n"}
            <span className="text-neutral-500 italic">{"// Sign challenge buffer for WebAuthn authentication assertion"}</span>{"\n"}
            <span className="text-pink-400 font-semibold">export async function</span> <span className="text-amber-300">signPasskeyAssertion</span>(privateKeyJwk: <span className="text-sky-300">string</span>, challenge: <span className="text-sky-300">BufferSource</span>) {"{"}{"\n"}
            {"  "}<span className="text-pink-400 font-semibold">return</span> window.crypto.subtle.<span className="text-amber-300">sign</span>({"{"} name: <span className="text-emerald-300">&quot;ECDSA&quot;</span>, hash: <span className="text-emerald-300">&quot;SHA-256&quot;</span> {"}"}, importedKey, challenge);{"\n"}
            {"}"}
          </pre>
        </CodeBlock>
      </>
    ),
  },
  {
    id: "privacy-relays",
    category: "Privacy & Intelligence",
    title: "Privacy Relays & Masked Emails (BYOK)",
    badge: "Zero-Backend BYOK",
    badgeColor: "amber",
    description:
      "Direct client-to-API masked email integration (SimpleLogin, Addy.io, DuckDuckGo) with zero cloud intermediaries.",
    headings: [
      { id: "byok-relays", title: "BYOK Masked Email Relay" },
      { id: "offline-duck", title: "DuckDuckGo Zero-Config Generation" },
    ],
    renderContent: () => (
      <>
        <h3 id="byok-relays" className="text-base font-semibold text-white mb-2">
          Direct BYOK Masked Email Relays
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed mb-4">
          Lokker runs zero intermediate relay servers. Your API tokens are stored strictly in your encrypted vault. Browser calls communicate directly with <Pill color="sky">SimpleLogin</Pill> (<code className="text-sky-300">app.simplelogin.io</code>) and <Pill color="emerald">Addy.io</Pill> (<code className="text-emerald-300">app.addy.io/api/v1</code>), or generate offline aliases via <Pill color="purple">DuckDuckGo (@duck.com)</Pill>.
        </p>

        <h3 id="offline-duck" className="text-base font-semibold text-white mt-6 mb-2">
          DuckDuckGo Zero-Config Generation
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed mb-4">
          When DuckDuckGo mode is selected, Lokker generates a cryptographically random 6-character hex token and formats an alias with optional service prefixes without calling any network API:
        </p>

        <CodeBlock filename="src/lib/masked-email.ts" language="TypeScript">
          <pre>
            <span className="text-pink-400 font-semibold">const</span> <span className="text-amber-300">hex</span> = <span className="text-amber-300">randomHex</span>(<span className="text-orange-400 font-mono">6</span>);{"\n"}
            <span className="text-pink-400 font-semibold">const</span> <span className="text-amber-300">cleanPrefix</span> = options.prefix?.<span className="text-amber-300">trim</span>().<span className="text-amber-300">toLowerCase</span>().<span className="text-amber-300">replace</span>(/[^a-z0-9]/g, <span className="text-emerald-300">&quot;&quot;</span>);{"\n"}
            <span className="text-pink-400 font-semibold">const</span> <span className="text-amber-300">alias</span> = cleanPrefix ? <span className="text-emerald-300">{"`" + "${cleanPrefix}.${hex}@duck.com" + "`"}</span> : <span className="text-emerald-300">{"`" + "lokker.${hex}@duck.com" + "`"}</span>;
          </pre>
        </CodeBlock>
      </>
    ),
  },
  {
    id: "security-watchtower",
    category: "Privacy & Intelligence",
    title: "Security Watchtower & 2FA Directory",
    badge: "Threat Intelligence",
    badgeColor: "rose",
    description:
      "Automated evaluation of stored accounts against curated 2FA directories, stale credentials, and Have I Been Pwned breach records.",
    headings: [
      { id: "two-factor-directory", title: "2FA Directory Catalog" },
      { id: "k-anonymity", title: "Privacy-Preserving Breach Checks" },
    ],
    renderContent: () => (
      <>
        <h3 id="two-factor-directory" className="text-base font-semibold text-white mb-2">
          Curated 2FA Capability Catalog
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed mb-4">
          Lokker bundles a database of major internet services (Google, GitHub, AWS, Microsoft, Discord, Twitter, Cloudflare, Proton, etc.) specifying supported 2FA methods (TOTP, Hardware Keys, SMS) and direct documentation setup URLs. When a stored credential lacks TOTP, Watchtower flags it and links directly to the service&apos;s 2FA setup page.
        </p>

        <h3 id="k-anonymity" className="text-base font-semibold text-white mt-6 mb-2">
          k-Anonymity Dark Web Checks
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed">
          Passwords are never sent across the network. Lokker computes the SHA-1 hash of the password, takes the first 5 characters (e.g. <Pill color="rose">21BD1</Pill>), and queries the Have I Been Pwned API with the header <code className="text-sky-300">Add-Padding: true</code>. Matching is completed entirely client-side.
        </p>
      </>
    ),
  },
  {
    id: "storage-backup",
    category: "Storage & Portability",
    title: "IndexedDB V3 & Encrypted Backup Spec (.lokker v2)",
    badge: "Portability Spec",
    badgeColor: "sky",
    description:
      "IndexedDB Schema V3 storage engine and formal specification for the .lokker encrypted backup container format.",
    headings: [
      { id: "backup-format", title: "Container Format (.lokker)" },
      { id: "restore-strategies", title: "Restore Strategies (Merge vs Replace)" },
    ],
    renderContent: () => (
      <>
        <h3 id="backup-format" className="text-base font-semibold text-white mb-2">
          Full-Vault Encrypted Backup Envelope
        </h3>
        <p className="text-neutral-300 text-sm leading-relaxed mb-4">
          Lokker exports 100% of all vault collections (credentials, bookmarks, categories, files, settings, masked emails, and passkeys) in an encrypted container:
        </p>

        <CodeBlock filename="backup.lokker (Encrypted Envelope)" language="JSON">
          <pre>
            {"{\n"}
            {"  "}&quot;format&quot;: <span className="text-emerald-300">&quot;lokker-encrypted-backup&quot;</span>,{"\n"}
            {"  "}&quot;version&quot;: <span className="text-orange-400 font-mono">2</span>,{"\n"}
            {"  "}&quot;kdf&quot;: {"{"} &quot;algorithm&quot;: <span className="text-emerald-300">&quot;PBKDF2&quot;</span>, &quot;iterations&quot;: <span className="text-orange-400 font-mono">100000</span> {"}"},{"\n"}
            {"  "}&quot;encryption&quot;: {"{"} &quot;algorithm&quot;: <span className="text-emerald-300">&quot;AES-GCM&quot;</span>, &quot;length&quot;: <span className="text-orange-400 font-mono">256</span> {"}"},{"\n"}
            {"  "}&quot;summary&quot;: {"{"} &quot;itemCount&quot;: <span className="text-orange-400 font-mono">42</span>, &quot;maskedEmailCount&quot;: <span className="text-orange-400 font-mono">7</span>, &quot;passkeyCount&quot;: <span className="text-orange-400 font-mono">4</span> {"}"},{"\n"}
            {"  "}&quot;ciphertext&quot;: <span className="text-emerald-300">&quot;&lt;base64-aes-gcm-encrypted-payload&gt;&quot;</span>{"\n"}
            {"}"}
          </pre>
        </CodeBlock>

        <h3 id="restore-strategies" className="text-base font-semibold text-white mt-6 mb-2">
          Restore Strategies
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-[#121212] space-y-1">
            <span className="text-xs font-semibold text-white">Safe Merge & Synchronize</span>
            <p className="text-[11px] text-neutral-400">
              Adds non-duplicate credentials, bookmarks, masked emails, and passkeys while keeping your existing local items intact.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-[#121212] space-y-1">
            <span className="text-xs font-semibold text-white">Complete Fresh Restore</span>
            <p className="text-[11px] text-neutral-400">
              Completely overwrites local IndexedDB stores with the exact snapshot from the backup file.
            </p>
          </div>
        </div>
      </>
    ),
  },
];

export default function DocsPage() {
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("vault-overview");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [packageManager, setPackageManager] = React.useState<"pnpm" | "npm" | "yarn" | "bun">("pnpm");

  const selectedTopic =
    DOC_TOPICS.find((t) => t.id === selectedTopicId) || DOC_TOPICS[0];

  const filteredTopics = React.useMemo(() => {
    if (!searchQuery.trim()) return DOC_TOPICS;
    const q = searchQuery.toLowerCase();
    return DOC_TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.headings.some((h) => h.title.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Group topics by category
  const categories = React.useMemo(() => {
    const map = new Map<string, DocTopic[]>();
    for (const topic of filteredTopics) {
      if (!map.has(topic.category)) {
        map.set(topic.category, []);
      }
      map.get(topic.category)!.push(topic);
    }
    return Array.from(map.entries());
  }, [filteredTopics]);

  // Find prev/next topic
  const currentIndex = DOC_TOPICS.findIndex((t) => t.id === selectedTopic.id);
  const prevTopic = currentIndex > 0 ? DOC_TOPICS[currentIndex - 1] : null;
  const nextTopic =
    currentIndex < DOC_TOPICS.length - 1 ? DOC_TOPICS[currentIndex + 1] : null;

  return (
    <div className="min-h-dvh bg-black text-neutral-100 flex flex-col font-sans">
      <MarketingNav />

      {/* 3-COLUMN SIDE-BY-SIDE LAYOUT (MATCHING NEXT.JS DOCS INSPIRATION) */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col lg:flex-row px-4 sm:px-8 py-8 gap-8 lg:gap-12">
        {/* ======================================================== */}
        {/* SEGMENT 1: LEFT NAVIGATION SIDEBAR (FIXED / INDEPENDENT) */}
        {/* ======================================================== */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          {/* Top Product Header Card */}
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-xs text-white">
              <Lock className="size-3.5 text-sky-400" />
              <span>Lokker Vault Guide</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              100% Local-First Zero-Knowledge Architecture
            </p>
          </div>

          {/* Version Pill */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <div>
                <div className="font-semibold text-white text-[11px]">Latest Release</div>
                <div className="text-[10px] text-neutral-400">v2.0.0 Production</div>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
              Stable
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="h-8 pl-8 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-sky-500"
            />
          </div>

          {/* Navigation Items Grouped by Category */}
          <nav className="space-y-5">
            {categories.map(([category, topics]) => (
              <div key={category} className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {topics.map((t) => {
                    const isSelected = t.id === selectedTopic.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTopicId(t.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border border-sky-500/80 bg-sky-500/10 text-sky-400 font-semibold shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                        {t.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 shrink-0 ml-1.5 font-mono">
                            {t.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ======================================================== */}
        {/* SEGMENT 2: MAIN CENTER CONTENT AREA (BREATHING ROOM)    */}
        {/* ======================================================== */}
        <main className="flex-1 min-w-0 max-w-4xl px-4 lg:px-8 py-2 space-y-8">
          {/* Header Title Section */}
          <div className="space-y-3 pb-6 border-b border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span>Lokker Docs</span>
              <span>/</span>
              <span className="text-sky-400 font-medium">{selectedTopic.category}</span>
              <span>/</span>
              <span className="text-white font-semibold">{selectedTopic.title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {selectedTopic.title}
              </h1>
              {selectedTopic.badge && (
                <Badge
                  variant="outline"
                  className="text-[11px] py-0.5 px-2.5 bg-sky-500/10 text-sky-400 border-sky-500/30 font-medium"
                >
                  {selectedTopic.badge}
                </Badge>
              )}
            </div>

            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed text-pretty">
              {selectedTopic.description}
            </p>
          </div>

          {/* Dynamic Content Body with Syntax Highlighting */}
          <article className="space-y-6 text-sm text-neutral-300 leading-relaxed">
            {selectedTopic.renderContent(packageManager, setPackageManager)}
          </article>

          {/* Previous / Next Page Navigation Cards */}
          <div className="pt-8 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevTopic ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTopicId(prevTopic.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-sky-500/50 transition-colors text-left space-y-1 cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                  <ArrowLeft className="size-3 text-sky-400" />
                  <span>Previous</span>
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {prevTopic.title}
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextTopic && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTopicId(nextTopic.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-sky-500/50 transition-colors text-right space-y-1 cursor-pointer sm:col-start-2"
              >
                <div className="flex items-center justify-end gap-1 text-[11px] text-neutral-400">
                  <span>Next</span>
                  <ArrowRight className="size-3 text-sky-400" />
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {nextTopic.title}
                </div>
              </button>
            )}
          </div>
        </main>

        {/* ======================================================== */}
        {/* SEGMENT 3: RIGHT SIDEBAR ("ON THIS PAGE" TOC)           */}
        {/* ======================================================== */}
        <aside className="hidden xl:block w-64 shrink-0 space-y-6">
          <div className="sticky top-20 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                On this page
              </h4>
              <nav className="space-y-1.5 text-xs">
                {selectedTopic.headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="block text-neutral-400 hover:text-sky-400 transition-colors py-1 pl-2 border-l border-neutral-800 hover:border-sky-500 text-[12px] leading-snug"
                  >
                    {h.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-neutral-800 space-y-2.5">
              <Link
                href="https://github.com/arnav-1124/lokker-vault-v2"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                <ExternalLink className="size-3.5 text-sky-400" />
                <span>Edit this page on GitHub</span>
              </Link>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowUp className="size-3.5 text-sky-400" />
                <span>Scroll to top</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <MarketingFooter />
    </div>
  );
}

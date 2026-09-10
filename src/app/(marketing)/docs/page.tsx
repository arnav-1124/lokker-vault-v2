"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
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
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

interface DocTopic {
  id: string;
  category: string;
  title: string;
  badge?: string;
  description: string;
  headings: { id: string; title: string }[];
  content: React.ReactNode;
}

function CodeBlock({
  code,
  language = "typescript",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-4 rounded-xl border border-border-subtle bg-background/80 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-border-subtle/60 bg-surface/50 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-[11px] text-muted-foreground">
            {filename || language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-success" />
              <span className="text-success">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-foreground">
        <pre>{code}</pre>
      </div>
    </div>
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
      border: "border-info/30",
      bg: "bg-info/5",
      icon: <Info className="size-4 text-info shrink-0 mt-0.5" />,
      defaultTitle: "Note",
    },
    tip: {
      border: "border-success/30",
      bg: "bg-success/5",
      icon: <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />,
      defaultTitle: "Pro Tip",
    },
    warning: {
      border: "border-warning/30",
      bg: "bg-warning/5",
      icon: <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />,
      defaultTitle: "Warning",
    },
    security: {
      border: "border-primary/40",
      bg: "bg-primary/5",
      icon: <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />,
      defaultTitle: "Security Guarantee",
    },
  }[type];

  return (
    <div className={`my-4 p-4 rounded-xl border ${styles.border} ${styles.bg} flex items-start gap-3`}>
      {styles.icon}
      <div className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {title && <h4 className="font-semibold text-foreground text-xs">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
}

const DOC_TOPICS: DocTopic[] = [
  {
    id: "introduction",
    category: "Getting Started",
    title: "Introduction & Architecture Philosophy",
    badge: "Core Architecture",
    description:
      "Lokker is a local-first personal security and digital utility workspace built on zero-knowledge cryptographic primitives.",
    headings: [
      { id: "core-mission", title: "Core Mission" },
      { id: "local-first-principle", title: "The Local-First Principle" },
      { id: "zero-knowledge-guarantee", title: "Zero-Knowledge Guarantee" },
    ],
    content: (
      <>
        <p>
          Lokker is designed around a single non-negotiable principle: <strong>Your vault. Your device. Your keys. Your data. Your control.</strong>
        </p>
        <p>
          Unlike legacy cloud password managers that store your encrypted data on multi-tenant servers, Lokker operates entirely on client devices using the native W3C Web Crypto API and IndexedDB.
        </p>

        <h3 id="core-mission" className="text-base font-semibold text-foreground mt-6 mb-2">
          Core Mission
        </h3>
        <p>
          Make secure digital habits effortless by combining credential management, bookmarks, TOTP authenticators, privacy-preserving email relays, WebAuthn passkeys, and encrypted file storage into one cohesive, beautiful workspace.
        </p>

        <h3 id="local-first-principle" className="text-base font-semibold text-foreground mt-6 mb-2">
          The Local-First Principle
        </h3>
        <p>
          The user&apos;s device is the primary data authority. Sensitive data never leaves browser ephemeral memory without authenticated symmetric encryption. All search, filtering, password generation, TOTP calculations, and backup parsing execute 100% locally.
        </p>

        <Callout type="security" title="Zero-Knowledge Invariant">
          Even if an attacker intercepts network traffic or gains physical access to offline backups, they cannot decrypt vault payloads without the user&apos;s master password or emergency recovery key. There is no master backdoor, recovery escrow, or telemetry tracking.
        </Callout>

        <h3 id="zero-knowledge-guarantee" className="text-base font-semibold text-foreground mt-6 mb-2">
          Architecture Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          <div className="p-3.5 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">Client Encryption Engine</span>
            <p className="text-[11px] text-muted-foreground">
              AES-GCM 256-bit envelope encryption with unique 12-byte random IVs per operation.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">Hardware Passkey PRF</span>
            <p className="text-[11px] text-muted-foreground">
              Direct WebAuthn PRF extension integration for seamless biometric hardware unlock.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">Zero-Backend Relays</span>
            <p className="text-[11px] text-muted-foreground">
              BYOK integration with SimpleLogin, Addy.io, and offline DuckDuckGo email masking.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">Full-Vault Portability</span>
            <p className="text-[11px] text-muted-foreground">
              100% roundtrip backup and restore covering passwords, passkeys, files, and settings.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "envelope-encryption",
    category: "Core Cryptography",
    title: "3-Tier Envelope Encryption Architecture",
    badge: "Cryptographic Specification",
    description:
      "Deep dive into Lokker's 3-Tier Envelope Architecture separating payload encryption from master credential wrapping.",
    headings: [
      { id: "encryption-tiers", title: "The Three Tiers" },
      { id: "key-wrapping", title: "Key Wrapping & PBKDF2" },
      { id: "rotation-mechanism", title: "Zero-Re-encryption Rotation" },
    ],
    content: (
      <>
        <p>
          Lokker prevents dangerous re-encryption bottlenecks using an enterprise 3-tier key hierarchy.
        </p>

        <h3 id="encryption-tiers" className="text-base font-semibold text-foreground mt-6 mb-2">
          The Three Cryptographic Tiers
        </h3>
        <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Vault Encryption Key (VEK):</strong> A cryptographically random 256-bit symmetric AES-GCM key (`crypto.subtle.generateKey`). The VEK directly encrypts all passwords, notes, credit cards, bookmarks, and file attachments.
          </li>
          <li>
            <strong className="text-foreground">Password Key Encryption Key (Password KEK):</strong> Derived from the user&apos;s Master Password using PBKDF2 (100,000 iterations of SHA-256, 16-byte random salt). The Password KEK wraps the VEK.
          </li>
          <li>
            <strong className="text-foreground">Recovery Key Encryption Key (Recovery KEK):</strong> Derived from a 32-character hexadecimal Emergency Recovery Key using PBKDF2 (100,000 iterations of SHA-256, 16-byte random recovery salt). The Recovery KEK wraps the SAME VEK.
          </li>
        </ol>

        <h3 id="key-wrapping" className="text-base font-semibold text-foreground mt-6 mb-2">
          Key Derivation Implementation
        </h3>
        <CodeBlock
          filename="src/lib/crypto.ts"
          code={`// Derive KEK from Master Password using Web Crypto PBKDF2
const kek = await crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: saltBuffer,
    iterations: 100_000,
    hash: "SHA-256",
  },
  masterKeyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["wrapKey", "unwrapKey"]
);

// Wrap VEK under Password KEK with random 12-byte IV
const wrappedVek = await crypto.subtle.wrapKey(
  "raw",
  vek,
  kek,
  { name: "AES-GCM", iv: ivBuffer }
);`}
        />

        <h3 id="rotation-mechanism" className="text-base font-semibold text-foreground mt-6 mb-2">
          Zero-Re-encryption Master Password Rotation
        </h3>
        <p>
          Because the VEK is independent of the user&apos;s password, changing the master password only requires deriving a new Password KEK and re-wrapping the 256-bit VEK. The underlying gigabytes of encrypted files and hundreds of credentials do not need to be touched or re-encrypted.
        </p>

        <Callout type="tip" title="Independent Recovery Key">
          Rotating your master password never invalidates your Emergency Recovery Key or biometric passkeys, because each slot holds an independently wrapped copy of the same underlying VEK.
        </Callout>
      </>
    ),
  },
  {
    id: "webauthn-prf",
    category: "Authentication & Keys",
    title: "WebAuthn PRF Biometric Hardware Unlock",
    badge: "WebAuthn / FIDO2",
    description:
      "Hardware-backed zero-knowledge biometric unlock via the WebAuthn Pseudo-Random Function (PRF) extension.",
    headings: [
      { id: "prf-overview", title: "How PRF Works" },
      { id: "prf-handshake", title: "Registration & Assertion" },
      { id: "hardware-support", title: "Hardware Key Compatibility" },
    ],
    content: (
      <>
        <p>
          Traditional WebAuthn authenticators only sign challenges, which cannot decrypt offline data without a server. Lokker bypasses this limitation using the <strong>WebAuthn PRF (Pseudo-Random Function) extension</strong>.
        </p>

        <h3 id="prf-overview" className="text-base font-semibold text-foreground mt-6 mb-2">
          How PRF Unlocks the Vault
        </h3>
        <p>
          During registration, your hardware authenticator (YubiKey, Touch ID, Chrome Android) evaluates a constant salt against its internal credential private key to compute an HMAC-SHA-256 output. Lokker derives a symmetric 256-bit KEK from this output to wrap the VEK.
        </p>

        <CodeBlock
          filename="WebAuthn PRF Assertion Call"
          code={`const credential = await navigator.credentials.get({
  publicKey: {
    challenge: new Uint8Array(32),
    rpId: window.location.hostname,
    allowCredentials: [{ id: passkeyCredentialId, type: "public-key" }],
    extensions: {
      prf: {
        eval: {
          first: salt32Bytes,
        },
      },
    },
  },
});

// Extract symmetric key output directly from hardware authenticator
const prfResults = credential.getClientExtensionResults().prf;
const symmetricSecret = prfResults.results.first;`}
        />

        <h3 id="hardware-support" className="text-base font-semibold text-foreground mt-6 mb-2">
          Hardware Compatibility Matrix
        </h3>
        <div className="border border-border-subtle rounded-xl overflow-hidden my-3 text-xs">
          <table className="w-full text-left">
            <thead className="bg-surface border-b border-border-subtle text-foreground font-semibold">
              <tr>
                <th className="p-2.5">Authenticator</th>
                <th className="p-2.5">Platform</th>
                <th className="p-2.5">PRF Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-muted-foreground">
              <tr>
                <td className="p-2.5 font-medium text-foreground">YubiKey 5 Series (v5.3+)</td>
                <td className="p-2.5">Windows, macOS, Linux, Android</td>
                <td className="p-2.5 text-success">Supported (Native FIDO2)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-foreground">Google Password Manager</td>
                <td className="p-2.5">Android 14+, ChromeOS</td>
                <td className="p-2.5 text-success">Supported</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-foreground">1Password Passkeys</td>
                <td className="p-2.5">Desktop & Browser Extension</td>
                <td className="p-2.5 text-success">Supported</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-foreground">Apple Touch ID / Keychain</td>
                <td className="p-2.5">macOS / iOS Safari</td>
                <td className="p-2.5 text-warning">Limited by Apple WebKit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "passkey-vault",
    category: "Authentication & Keys",
    title: "FIDO2 Passkey Engine (ES256)",
    badge: "Client-Side Cryptography",
    description:
      "Native Web Crypto ECDSA P-256 keypair generation, SPKI public key inspection, and challenge assertion signing.",
    headings: [
      { id: "passkey-engine", title: "Web Crypto Keypair Generation" },
      { id: "spki-pem", title: "SPKI Public Key Export" },
      { id: "assertion-signing", title: "Challenge Assertion Protocol" },
    ],
    content: (
      <>
        <p>
          Lokker includes a standalone FIDO2 Passkey Vault engine ([`src/lib/passkey.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/lokker-vault/src/lib/passkey.ts)). Users can generate, store, and manage ECDSA P-256 credentials directly on device without cloud vendor lock-in.
        </p>

        <h3 id="passkey-engine" className="text-base font-semibold text-foreground mt-6 mb-2">
          Keypair Generation & RFC 8812 Compliance
        </h3>
        <p>
          Passkeys use the standard WebAuthn algorithm identifier <code>-7</code> (ES256, ECDSA over NIST P-256 with SHA-256). The credential ID is generated as 32 cryptographically secure random bytes encoded as standard Base64URL.
        </p>

        <CodeBlock
          filename="src/lib/passkey.ts"
          code={`// Generate non-extractable or extractable ECDSA P-256 keypair
const keyPair = await window.crypto.subtle.generateKey(
  {
    name: "ECDSA",
    namedCurve: "P-256",
  },
  true,
  ["sign", "verify"]
);

// Export Public Key to SPKI Base64 & PEM
const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
const privateJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);`}
        />

        <h3 id="assertion-signing" className="text-base font-semibold text-foreground mt-6 mb-2">
          Challenge Assertion Signing
        </h3>
        <p>
          When an authentication challenge arrives from a Relying Party (RP), Lokker imports the stored JWK private key and signs the challenge buffer using ECDSA SHA-256:
        </p>
        <CodeBlock
          filename="Challenge Assertion"
          code={`export async function signPasskeyAssertion(
  privateKeyJwkJson: string,
  challengeBuffer: BufferSource
): Promise<ArrayBuffer> {
  const jwk = JSON.parse(privateKeyJwkJson);
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  return window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    challengeBuffer
  );
}`}
        />
      </>
    ),
  },
  {
    id: "security-watchtower",
    category: "Privacy & Watchtower",
    title: "Automated Watchtower & 2FA Intelligence",
    badge: "Threat Intelligence",
    description:
      "Automated evaluation of stored accounts against curated 2FA directories, stale credentials, and Have I Been Pwned breach records.",
    headings: [
      { id: "two-factor-directory", title: "2FA Directory Catalog" },
      { id: "k-anonymity", title: "Privacy-Preserving Breach Checks" },
      { id: "health-scoring", title: "Composite Security Scoring" },
    ],
    content: (
      <>
        <p>
          The Lokker Security Watchtower ([`src/lib/watchtower.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/lokker-vault/src/lib/watchtower.ts)) delivers automated, actionable intelligence to harden your accounts before breaches occur.
        </p>

        <h3 id="two-factor-directory" className="text-base font-semibold text-foreground mt-6 mb-2">
          Curated 2FA Capability Catalog
        </h3>
        <p>
          Lokker bundles a database of major internet services (Google, GitHub, AWS, Microsoft, Discord, Twitter, Cloudflare, Proton, etc.) specifying supported 2FA methods (TOTP, Hardware Keys, SMS) and direct documentation setup URLs. When a stored credential lacks TOTP, Watchtower flags it and links directly to the service&apos;s 2FA setup page.
        </p>

        <h3 id="k-anonymity" className="text-base font-semibold text-foreground mt-6 mb-2">
          k-Anonymity Dark Web Checks
        </h3>
        <p>
          Passwords are never sent across the network. Lokker computes the SHA-1 hash of the password, takes the first 5 characters (e.g. <code>21BD1</code>), and queries the Have I Been Pwned API with the header <code>Add-Padding: true</code>. Matching is completed entirely client-side.
        </p>

        <h3 id="health-scoring" className="text-base font-semibold text-foreground mt-6 mb-2">
          Composite Health Scoring Formula
        </h3>
        <p>
          Your vault receives a real-time composite health score from 0 to 100 based on:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Breached Passwords (-35 pts per breach):</strong> Immediate critical vulnerability.</li>
          <li><strong>Reused Passwords (-15 pts per set):</strong> Credential stuffing risk.</li>
          <li><strong>Weak Passwords (-10 pts per entry):</strong> Low entropy &lt; 50 bits.</li>
          <li><strong>Missing 2FA (-10 pts per entry):</strong> Service supports 2FA but account lacks TOTP secret.</li>
          <li><strong>Stale Passwords (-5 pts per entry):</strong> Unrotated for &gt; 12 months.</li>
        </ul>
      </>
    ),
  },
  {
    id: "masked-emails",
    category: "Privacy & Watchtower",
    title: "Live BYOK Masked Email Relays",
    badge: "Zero-Backend BYOK",
    description:
      "Direct client-to-API email masking for SimpleLogin, Addy.io, and offline DuckDuckGo tracker stripping.",
    headings: [
      { id: "byok-architecture", title: "BYOK Model" },
      { id: "supported-providers", title: "Supported Providers" },
      { id: "offline-duck", title: "Offline DuckDuckGo Generation" },
    ],
    content: (
      <>
        <p>
          Stop spam and protect your identity by creating disposable email aliases on demand ([`src/lib/masked-email.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/lokker-vault/src/lib/masked-email.ts)).
        </p>

        <h3 id="byok-architecture" className="text-base font-semibold text-foreground mt-6 mb-2">
          Zero-Backend BYOK Architecture
        </h3>
        <p>
          Lokker runs no centralized relay server. User API keys are stored strictly in local encrypted vault settings. API calls execute directly from the browser to the provider endpoints:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">SimpleLogin</span>
            <p className="text-[11px] text-muted-foreground">
              Direct integration with <code>app.simplelogin.io</code> API via personal API keys.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">Addy.io</span>
            <p className="text-[11px] text-muted-foreground">
              Direct Bearer token requests to <code>app.addy.io/api/v1</code> with instant status toggling.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">DuckDuckGo (@duck.com)</span>
            <p className="text-[11px] text-muted-foreground">
              Zero-config local generator with automatic spy pixel stripping by DuckDuckGo.
            </p>
          </div>
        </div>

        <h3 id="offline-duck" className="text-base font-semibold text-foreground mt-6 mb-2">
          DuckDuckGo Zero-Config Generation
        </h3>
        <p>
          When you select DuckDuckGo, Lokker generates a cryptographically random 6-character hex token and formats an alias:
        </p>
        <CodeBlock
          filename="Offline Alias Generation"
          code={`const hex = randomHex(6);
const cleanPrefix = options.prefix?.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const alias = cleanPrefix ? \`\${cleanPrefix}.\${hex}@duck.com\` : \`lokker.\${hex}@duck.com\`;`}
        />
      </>
    ),
  },
  {
    id: "backup-specification",
    category: "Portability & Recovery",
    title: "Full-Vault Encrypted Backup Specification",
    badge: ".lokker File Spec v2",
    description:
      "Formal specification for the .lokker encrypted backup container format and non-destructive merge deduplication.",
    headings: [
      { id: "backup-format", title: "Container Format" },
      { id: "backup-header", title: "Plaintext Summary Header" },
      { id: "restore-strategies", title: "Restore Strategies (Merge vs Replace)" },
    ],
    content: (
      <>
        <p>
          Lokker backups are portable, self-contained encrypted archives storing 100% of your vault data.
        </p>

        <h3 id="backup-format" className="text-base font-semibold text-foreground mt-6 mb-2">
          Backup JSON Envelope Schema
        </h3>
        <CodeBlock
          filename="backup.lokker (Encrypted Envelope)"
          code={`{
  "format": "lokker-encrypted-backup",
  "version": 2,
  "createdAt": 1726000000000,
  "kdf": {
    "algorithm": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 100000,
    "salt": "<base64-16-bytes>"
  },
  "encryption": {
    "algorithm": "AES-GCM",
    "length": 256,
    "iv": "<base64-12-bytes>"
  },
  "summary": {
    "itemCount": 42,
    "categoryCount": 6,
    "bookmarkCount": 18,
    "totpCount": 9,
    "fileCount": 3,
    "maskedEmailCount": 7,
    "passkeyCount": 4
  },
  "ciphertext": "<base64-aes-gcm-encrypted-payload>"
}`}
        />

        <h3 id="backup-header" className="text-base font-semibold text-foreground mt-6 mb-2">
          Non-Secret Summary Inspection
        </h3>
        <p>
          The <code>summary</code> block allows Lokker to render a pre-restore inspection modal showing exact item counts before prompting the user for their decryption password.
        </p>

        <h3 id="restore-strategies" className="text-base font-semibold text-foreground mt-6 mb-2">
          Restore Strategies
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
          <div className="p-3 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">Safe Merge & Synchronize</span>
            <p className="text-[11px] text-muted-foreground">
              Adds non-duplicate credentials, bookmarks, masked emails, and passkeys while keeping your existing local items intact.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border-subtle bg-surface/60 space-y-1">
            <span className="text-xs font-semibold text-foreground">Complete Fresh Restore</span>
            <p className="text-[11px] text-muted-foreground">
              Completely overwrites local IndexedDB stores with the exact snapshot from the backup file.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "platform-overview",
    category: "Platform & SDK (Preview)",
    title: "Lokker Platform & SDK Architecture",
    badge: "Platform Contract",
    description:
      "Conceptual architecture and public contract for exposing Lokker as a decoupled security and privacy engine for third-party developers.",
    headings: [
      { id: "platform-vision", title: "The Decoupled Platform Vision" },
      { id: "sdk-contracts", title: "@lokker/sdk Conceptual Contract" },
      { id: "byod-model", title: "Bring-Your-Own-Database (BYOD)" },
    ],
    content: (
      <>
        <p>
          Lokker is evolving from a standalone vault application into a <strong>reusable developer security and privacy platform</strong>.
        </p>

        <h3 id="platform-vision" className="text-base font-semibold text-foreground mt-6 mb-2">
          Architecture Separation
        </h3>
        <p>
          External developers can bring their own frontend, database, hosting, and business logic while consuming Lokker&apos;s security primitives via stable client SDKs and backend modules:
        </p>

        <div className="p-4 rounded-xl border border-border-subtle bg-surface/80 my-4 space-y-2 font-mono text-xs">
          <div className="text-primary font-semibold">{"// Developer Application"}</div>
          <div>Developer Frontend (Next.js / React / Svelte / Mobile)</div>
          <div className="text-muted-foreground">{"       ↓ consumes @lokker/client & @lokker/sdk"}</div>
          <div className="text-primary font-semibold">{"// Lokker Platform Layer"}</div>
          <div>Lokker Security Engine (Envelope Crypto, PRF Passkeys, Watchtower, Relays)</div>
          <div className="text-muted-foreground">{"       ↓ connects via Database & Storage Adapters"}</div>
          <div className="text-primary font-semibold">{"// Developer Infrastructure"}</div>
          <div>Developer Database (PostgreSQL / SQLite / Edge KV) + Blob Storage (S3 / R2)</div>
        </div>

        <h3 id="sdk-contracts" className="text-base font-semibold text-foreground mt-6 mb-2">
          Conceptual Developer Experience
        </h3>
        <CodeBlock
          filename="example-integration.ts"
          code={`import { LokkerClient } from "@lokker/client";
import { LokkerBackend } from "@lokker/server";
import { PostgresAdapter } from "@lokker/adapter-postgres";

// 1. Initialize Server Platform with BYOD
export const lokker = new LokkerBackend({
  database: new PostgresAdapter({ connectionString: process.env.DATABASE_URL }),
  encryptionKey: process.env.LOKKER_PLATFORM_KEY,
});

// 2. Client Side Zero-Knowledge Operations
const client = new LokkerClient();
const passkey = await client.passkeys.create({
  rpId: "myapp.com",
  userName: "alex@example.com",
});`}
        />

        <Callout type="tip" title="API First Design">
          All future backend endpoints (e.g. <code>POST /api/v1/vault/sync</code>, <code>POST /api/v1/relays/alias</code>) are being formally designed as OpenAPI 3.1 contracts so any language (Go, Rust, Python, Node) can consume Lokker.
        </Callout>
      </>
    ),
  },
];

export default function DocsPage() {
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("introduction");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

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
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <MarketingNav />

      {/* Docs Header Banner */}
      <div className="border-b border-border-subtle bg-surface/40 py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs py-0.5 px-2 bg-primary/10 text-primary border-primary/20">
                <BookOpen className="size-3 mr-1" />
                Technical Reference & API
              </Badge>
              <span className="text-xs text-muted-foreground">Version 2.0.0</span>
            </div>
            <h1 className="text-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Lokker Documentation & Guides
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              In-depth architecture specifications, cryptographic blueprints, client APIs, and developer contracts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="https://github.com/arnav-1124/lokker-vault-v2" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 cursor-pointer">
                <ExternalLink className="size-3.5" />
                <span>GitHub Repo</span>
              </Button>
            </Link>
            <Link href="/app">
              <Button size="sm" className="gap-1.5 text-xs h-8 cursor-pointer">
                <span>Launch App</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Docs Layout: Left Sidebar + Main Content + Right TOC */}
      <div className="mx-auto max-w-7xl w-full flex-1 flex flex-col lg:flex-row px-4 sm:px-6 py-8 gap-8">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-5">
          {/* Search Input */}
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="h-8 pl-8 text-xs bg-surface border-border-subtle"
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {categories.map(([category, topics]) => (
              <div key={category} className="space-y-1.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                  {category}
                </h4>
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
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                        {t.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-surface border border-border-subtle text-muted-foreground shrink-0 ml-1.5">
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

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 max-w-3xl space-y-8">
          {/* Breadcrumb Header */}
          <div className="space-y-2 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground transition-colors">
                Docs
              </Link>
              <span>/</span>
              <span>{selectedTopic.category}</span>
              <span>/</span>
              <span className="text-foreground font-medium">{selectedTopic.title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <h2 className="text-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {selectedTopic.title}
              </h2>
              {selectedTopic.badge && (
                <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-surface text-primary border-primary/20">
                  {selectedTopic.badge}
                </Badge>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {selectedTopic.description}
            </p>
          </div>

          {/* Topic Body Content */}
          <article className="prose prose-invert max-w-none text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-4">
            {selectedTopic.content}
          </article>

          {/* Next / Previous Page Navigation Cards */}
          <div className="pt-8 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevTopic ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTopicId(prevTopic.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="p-4 rounded-xl border border-border-subtle bg-surface hover:border-primary/40 transition-colors text-left space-y-1 cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ArrowLeft className="size-3" />
                  <span>Previous</span>
                </div>
                <div className="text-xs font-semibold text-foreground truncate">
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
                className="p-4 rounded-xl border border-border-subtle bg-surface hover:border-primary/40 transition-colors text-right space-y-1 cursor-pointer sm:col-start-2"
              >
                <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                  <span>Next</span>
                  <ArrowRight className="size-3" />
                </div>
                <div className="text-xs font-semibold text-foreground truncate">
                  {nextTopic.title}
                </div>
              </button>
            )}
          </div>
        </main>

        {/* Right Sidebar: On This Page Table of Contents */}
        <aside className="hidden xl:block w-56 shrink-0 space-y-6">
          <div className="sticky top-20 space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                On this page
              </h4>
              <nav className="space-y-1 text-xs">
                {selectedTopic.headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="block text-muted-foreground hover:text-foreground transition-colors py-1 pl-2 border-l border-border-subtle hover:border-primary text-[11px] leading-snug"
                  >
                    {h.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground">Resources</span>
              <div className="space-y-1 text-xs">
                <Link
                  href="https://github.com/arnav-1124/lokker-vault-v2/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="size-3" />
                  <span>Report an Issue</span>
                </Link>
                <Link
                  href="/download"
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Compass className="size-3" />
                  <span>Browser Extension</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <MarketingFooter />
    </div>
  );
}

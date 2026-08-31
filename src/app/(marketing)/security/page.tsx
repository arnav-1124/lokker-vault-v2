import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  FileKey,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function SecurityArchitecturePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 text-center">
          <Badge variant="outline" className="mb-4 text-xs py-1 px-3 bg-surface border-border-subtle">
            <ShieldCheck className="size-3 text-primary mr-1.5" />
            Cryptographic Architecture & Threat Model
          </Badge>
          <h1 className="text-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Zero-Knowledge Envelope Security
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base text-pretty">
            Lokker uses a 3-tier Envelope Encryption Model (VEK / KEK) designed so that plaintext data exists only in ephemeral client memory.
          </p>
        </section>

        {/* 3-Tier Key Encryption Architecture Breakdown */}
        <section className="mx-auto max-w-5xl px-6 pb-20 space-y-12">
          {/* Key Hierarchy Diagram Box */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6">
            <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">3-Tier Key Encryption Hierarchy</h2>
                <p className="text-xs text-muted-foreground">Decoupled authentication, recovery, and payload encryption</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs w-fit">
                Envelope Model
              </Badge>
            </div>

            {/* ASCII / Monospace Flow Diagram */}
            <div className="p-4 sm:p-6 rounded-xl bg-background border border-border-subtle font-mono text-xs sm:text-sm text-muted-foreground overflow-x-auto">
              <pre className="text-foreground leading-relaxed">{`  Master Password   ──────► Password KEK   ──────┐
  Recovery Key      ──────► Recovery KEK   ──────┼──► Unwrap VEK ──► AES-GCM Encrypted Vault
  Touch ID / PRF    ──────► Biometric KEK  ──────┘`}</pre>
            </div>

            <div className="grid gap-6 md:grid-cols-2 pt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <KeyRound className="size-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold">Vault Encryption Key (VEK)</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Random 256-bit symmetric key generated via <code className="text-primary font-mono">crypto.getRandomValues()</code>. Encrypts and authenticates the entire vault payload directly using AES-GCM 256.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <Lock className="size-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold">Key Encryption Key (KEK)</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Derived via PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt). Used to securely wrap and unwrap the VEK in client-side memory without exposing master password plaintext.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Security Pillars */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pillar 1: WebAuthn PRF */}
            <Card className="bg-surface border-border-subtle">
              <CardHeader>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Fingerprint className="size-4" />
                </div>
                <CardTitle className="text-base">WebAuthn PRF Hardware Protection</CardTitle>
                <CardDescription className="text-xs">
                  Hardware-bound biometric unlock without password caching
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  Biometric unlock derives a <code className="text-foreground">Biometric KEK</code> directly from hardware authenticator WebAuthn PRF evaluation bytes (<code className="text-foreground">eval: &#123; first: salt &#125;</code>).
                </p>
                <p className="font-semibold text-foreground">
                  Your Master Password is NEVER stored or XORed in local storage.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 2: Offline Recovery Key */}
            <Card className="bg-surface border-border-subtle">
              <CardHeader>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <FileKey className="size-4" />
                </div>
                <CardTitle className="text-base">Genuine Offline Recovery Key</CardTitle>
                <CardDescription className="text-xs">
                  256-bit emergency recovery key formatted in readable chunks
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  Generates an offline emergency key formatted as <code className="text-foreground font-mono">XXXX-XXXX-XXXX-...</code>. Derives a Recovery KEK via PBKDF2 to unwrap the VEK.
                </p>
                <p>
                  Enables instant vault recovery without requiring server resets or vendor intervention.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 3: AES-GCM Integrity */}
            <Card className="bg-surface border-border-subtle">
              <CardHeader>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <ShieldCheck className="size-4" />
                </div>
                <CardTitle className="text-base">AES-GCM Tag Tamper Resistance</CardTitle>
                <CardDescription className="text-xs">
                  Cryptographic authentication on every stored byte
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  AES-GCM provides authenticated encryption. Any 1-byte mutation of ciphertext, initialization vector (IV), salt, or wrapped VEK triggers immediate authentication tag rejection.
                </p>
                <p>
                  Guarantees that silent record alteration or tampering is mathematically impossible.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 4: Phishing Guard */}
            <Card className="bg-surface border-border-subtle">
              <CardHeader>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <ShieldAlert className="size-4" />
                </div>
                <CardTitle className="text-base">Extension Origin Allowlisting</CardTitle>
                <CardDescription className="text-xs">
                  Strict origin validation preventing credential theft
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  Extension synchronization and autofill messages are strictly filtered against an explicit origin allowlist. Unrelated origins or phishing sites are rejected.
                </p>
                <p>
                  Operates within an isolated Shadow DOM container to prevent host-page JavaScript injection.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Threat Model Comparison Table */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-semibold">Threat Model & Defense Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-muted-foreground font-mono">
                    <th className="pb-3 pr-4">Threat Vector</th>
                    <th className="pb-3 pr-4">Cloud Managers Risk</th>
                    <th className="pb-3">Lokker Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  <tr>
                    <td className="py-3 pr-4 font-medium text-foreground">Central Server Database Breach</td>
                    <td className="py-3 pr-4 text-destructive">Millions of encrypted vaults exposed in bulk</td>
                    <td className="py-3 text-success">Zero central database exists; data stays on hardware</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-foreground">Subpoena / Vendor Coercion</td>
                    <td className="py-3 pr-4 text-destructive">Metadata & encrypted blobs seized from vendor</td>
                    <td className="py-3 text-success">Vendor possesses zero custody or metadata</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-foreground">Malicious Page Script / DOM Scraping</td>
                    <td className="py-3 pr-4 text-warning">Injects scripts into active credential forms</td>
                    <td className="py-3 text-success">Isolated Shadow DOM + origin check authorization</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-foreground">Offline Brute Force</td>
                    <td className="py-3 pr-4 text-warning">Vulnerable if weak KDF parameters used</td>
                    <td className="py-3 text-success">PBKDF2 100,000 iterations (SHA-256) + 256-bit VEK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border-subtle bg-surface/40 py-16 text-center">
          <div className="mx-auto max-w-3xl px-6 space-y-4">
            <h2 className="text-heading text-2xl font-semibold">
              Inspect the Cryptographic Source
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Lokker is open source. Every primitive and boundary is transparent and auditable.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/app">
                <Button size="sm" className="gap-1.5">
                  <span>Open Vault</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="sm">
                  Technical Docs
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

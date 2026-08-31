import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  QrCode,
  Fingerprint,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function FeaturesPage() {
  const featureList = [
    {
      num: "01",
      title: "Zero-Knowledge Password Vault",
      tagline: "Local AES-GCM 256-bit Encrypted Storage",
      desc: "Store login credentials with custom categories, tags, notes, and password history. Features instant 1-click clipboard copy with automatic 30-second clipboard clearing and direct site links.",
      points: [
        "AES-GCM 256-bit authenticated encryption with random IVs",
        "Multi-strategy password generator (passphrases, patterned, high-entropy symbols)",
        "Zero server authority: secrets decrypted only into ephemeral memory",
        "Auto-clearing clipboard buffer for sensitive data protection",
      ],
      icon: KeyRound,
      preview: (
        <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-muted-foreground flex items-center gap-1">
              <Lock className="size-3 text-success" /> https://lokker.local/passwords
            </span>
            <Badge variant="outline" className="text-[10px] bg-background">Local Vault</Badge>
          </div>
          <div className="p-2.5 rounded bg-background border border-border-subtle flex justify-between items-center">
            <div>
              <p className="font-sans font-semibold text-foreground">GitHub</p>
              <p className="text-[11px] text-muted-foreground">alex@example.com</p>
            </div>
            <span className="text-muted-foreground">••••••••••••</span>
          </div>
          <div className="p-2.5 rounded bg-background border border-border-subtle flex justify-between items-center">
            <div>
              <p className="font-sans font-semibold text-foreground">ProtonMail</p>
              <p className="text-[11px] text-muted-foreground">alex.vault@proton.me</p>
            </div>
            <span className="text-muted-foreground">••••••••••••</span>
          </div>
        </div>
      ),
    },
    {
      num: "02",
      title: "Manifest V3 Browser Extension",
      tagline: "Contextual Autofill in Isolated Shadow DOM",
      desc: "Real browser autofill for Chrome, Edge, and Chromium browsers. Operates inside an isolated Shadow DOM container with strict origin verification to protect against clickjacking and DOM tampering.",
      points: [
        "Isolated Shadow DOM prevents host page script access",
        "Strict origin verification against phishing attacks",
        "Floating repositionable fill button that never blocks form fields",
        "Offline synchronization directly from local browser storage",
      ],
      icon: Compass,
      preview: (
        <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-muted-foreground">https://lokker.local/extension</span>
            <Badge variant="outline" className="text-[10px] bg-background">MV3 Ready</Badge>
          </div>
          <div className="p-3 rounded bg-background border border-border-subtle space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs font-medium">Domain: acme.com</span>
              <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Verified Origin</Badge>
            </div>
            <p className="text-muted-foreground text-[11px]">Autofill active credentials via 1-click authorization.</p>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      title: "Integrated 2FA TOTP Authenticator",
      tagline: "RFC 6238 Standard Time-Based Passcodes",
      desc: "No need for a separate phone authenticator app. Lokker generates standard RFC 6238 6-digit TOTP verification codes with 30-second live circular timers and 1-click clipboard auto-copy.",
      points: [
        "Standard RFC 6238 TOTP algorithm with HMAC-SHA1",
        "Live circular countdown timers with visual cadence",
        "Manual base32 secret input and standard otpauth:// URI parsing",
        "Eliminates dependency on mobile device cloud backups",
      ],
      icon: QrCode,
      preview: (
        <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-muted-foreground">https://lokker.local/totp</span>
            <Badge variant="outline" className="text-[10px] bg-background">Active RFC 6238</Badge>
          </div>
          <div className="p-3 rounded bg-background border border-border-subtle flex justify-between items-center">
            <div>
              <p className="font-sans text-xs font-semibold">AWS Root 2FA</p>
              <p className="text-xl font-bold text-primary tracking-widest mt-0.5">839 204</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground">Expires in</span>
              <p className="text-sm font-semibold text-foreground">18s</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "04",
      title: "Security Health & Breach Detection",
      tagline: "Mathematical Privacy via k-Anonymity",
      desc: "Automated local audit of password entropy, reuse across services, and dark web breach checks using k-Anonymity mathematical privacy (SHA-1 5-character prefix search).",
      points: [
        "k-Anonymity 5-char SHA-1 prefix check (zero plaintext leak)",
        "Automated password reuse detection across all stored accounts",
        "Stale and weak credential scoring with actionable guidance",
        "No forced arbitrary rotation — actionable security first",
      ],
      icon: ShieldCheck,
      preview: (
        <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-muted-foreground">https://lokker.local/security-audit</span>
            <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Score 94/100</Badge>
          </div>
          <div className="p-3 rounded bg-background border border-border-subtle space-y-1.5 font-sans">
            <div className="flex justify-between text-xs font-medium">
              <span>Vault Security Health</span>
              <span className="text-success font-semibold">Excellent</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              0 breached • 0 reused • 0 weak credentials detected.
            </p>
          </div>
        </div>
      ),
    },
    {
      num: "05",
      title: "WebAuthn PRF Biometric Unlock",
      tagline: "Hardware-Bound Symmetric Key Derivation",
      desc: "Derive symmetric encryption keys directly from your device hardware passkey (Touch ID, Windows Hello, or YubiKey) using the WebAuthn PRF extension without storing master passwords.",
      points: [
        "Hardware-bound symmetric key derivation via FIDO2 authenticator",
        "Master password never stored or XORed in local storage",
        "Zero-friction biometric unlock with genuine cryptographic backing",
        "Fallbacks strictly fail-closed if hardware authenticator is removed",
      ],
      icon: Fingerprint,
      preview: (
        <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-muted-foreground">https://lokker.local/settings</span>
            <Badge variant="outline" className="text-[10px] bg-background">FIDO2 / PRF</Badge>
          </div>
          <div className="p-3 rounded bg-background border border-border-subtle flex items-center gap-3">
            <div className="size-7 rounded bg-primary/10 text-primary flex items-center justify-center">
              <Fingerprint className="size-4" />
            </div>
            <div>
              <p className="font-sans text-xs font-semibold">Touch ID / Passkey Active</p>
              <p className="text-[11px] text-muted-foreground font-sans">Hardware key ready</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 text-center">
          <Badge variant="outline" className="mb-4 text-xs py-1 px-3 bg-surface border-border-subtle">
            <Sparkles className="size-3 text-primary mr-1.5" />
            Lokker Feature Matrix
          </Badge>
          <h1 className="text-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Full Security Suite. Zero Cloud.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base text-pretty">
            Every capability in Lokker is engineered to execute locally on your device without transmitting telemetry or credentials to external servers.
          </p>
        </section>

        {/* Features List */}
        <section className="mx-auto max-w-6xl px-6 pb-24 space-y-12">
          {featureList.map((feat, idx) => {
            const Icon = feat.icon;
            const isEven = idx % 2 === 1;
            return (
              <div
                key={feat.num}
                className={`rounded-2xl border border-border-subtle bg-surface/40 p-6 md:p-10 grid gap-8 lg:grid-cols-2 items-center ${
                  isEven ? "lg:grid-flow-dense" : ""
                }`}
              >
                <div className={`space-y-4 ${isEven ? "lg:col-start-2" : ""}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
                      {feat.num}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{feat.tagline}</span>
                  </div>

                  <h2 className="text-heading text-xl sm:text-2xl font-semibold flex items-center gap-2">
                    <Icon className="size-5 text-primary" />
                    <span>{feat.title}</span>
                  </h2>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>

                  <ul className="space-y-2 pt-2 text-xs text-foreground/90">
                    {feat.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`${isEven ? "lg:col-start-1" : ""}`}>
                  {feat.preview}
                </div>
              </div>
            );
          })}
        </section>

        {/* CTA */}
        <section className="border-t border-border-subtle bg-surface/40 py-16 text-center">
          <div className="mx-auto max-w-3xl px-6 space-y-6">
            <h2 className="text-heading text-2xl sm:text-3xl font-semibold">
              Ready to experience local-first security?
            </h2>
            <p className="text-sm text-muted-foreground">
              Launch the Lokker web workspace or install the browser extension.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/app">
                <Button size="lg" className="gap-2">
                  <span>Open Lokker Vault</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/download">
                <Button variant="outline" size="lg">
                  Get Extension
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

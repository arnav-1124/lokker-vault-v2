import Link from "next/link";
import {
  ShieldCheck,
  EyeOff,
  Database,
  Lock,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 text-center">
          <Badge variant="outline" className="mb-4 text-xs py-1 px-3 bg-surface border-border-subtle">
            <EyeOff className="size-3 text-primary mr-1.5" />
            Privacy Specification
          </Badge>
          <h1 className="text-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Privacy Policy & Local Data Guarantee
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base text-pretty">
            Lokker is built on a fundamental privacy promise: your credentials remain strictly on your own device.
          </p>
        </section>

        {/* Core Guarantees */}
        <section className="mx-auto max-w-5xl px-6 pb-20 space-y-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <HardDrive className="size-4" />
                <span>1. Zero Remote Server Storage</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lokker operates without a central cloud vault or user account server. Your passwords, 2FA keys, secure notes, credit cards, and bookmarks are encrypted client-side and saved exclusively inside your browser local IndexedDB.
              </p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <EyeOff className="size-4" />
                <span>2. Zero Telemetry & Tracking</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lokker contains no analytics scripts, third-party trackers, pixel beacons, or user tracking code. We do not collect or log usage statistics, search queries, or IP addresses.
              </p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <ShieldCheck className="size-4" />
                <span>3. k-Anonymity Leak Check Privacy</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When running dark web breach checks, Lokker uses SHA-1 k-Anonymity 5-character prefix search with <code className="text-foreground font-mono">Add-Padding: true</code> headers. Plaintext passwords are never sent over the network.
              </p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Lock className="size-4" />
                <span>4. Extension Isolation</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Lokker Chrome/Edge Manifest V3 extension communicates with website forms through isolated Shadow DOM containers. It checks credentials against target domain origins locally.
              </p>
            </div>
          </div>

          {/* Privacy Table Breakdown */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-semibold">Data Flow & Boundary Matrix</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-3">
                <div className="flex items-center gap-2 text-success font-semibold text-xs">
                  <CheckCircle2 className="size-4" />
                  <span>What is Stored Locally</span>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>• Master password salt & PBKDF2 parameters</li>
                  <li>• AES-GCM 256-bit encrypted vault payload</li>
                  <li>• User categories, tags, and settings</li>
                  <li>• 2FA TOTP secrets (encrypted at rest)</li>
                  <li>• Local encrypted bookmarks</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-3">
                <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
                  <XCircle className="size-4" />
                  <span>What Leaves Your Device</span>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>• <strong className="text-foreground">Nothing.</strong> Zero telemetry is transmitted.</li>
                  <li>• No tracking cookies, IPs, or analytics beacons.</li>
                  <li>• Optional breach check sends only 5-character SHA-1 prefix with padding.</li>
                  <li>• No cloud backups are created unless explicitly exported by you.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border-subtle bg-surface/40 py-16 text-center">
          <div className="mx-auto max-w-3xl px-6 space-y-4">
            <h2 className="text-heading text-2xl font-semibold">
              Privacy Mathematically Enforced
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Take back ownership of your passwords and digital identities today.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/app">
                <Button size="sm" className="gap-1.5">
                  <span>Open Lokker Vault</span>
                  <ArrowRight className="size-3.5" />
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

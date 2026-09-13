"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  ShieldCheck,
  Server,
  Database,
  Cloud,
  Coffee,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DonateModal } from "@/components/modals/donate-modal";

export default function AuthenticatedWhyToPayPage() {
  const [isDonateOpen, setIsDonateOpen] = React.useState(false);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12 lokker-scrollbar">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link href="/app">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Personal Vault</span>
          </Button>
        </Link>
        <Link href="/pricing" target="_blank" rel="noopener noreferrer">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 text-primary border-primary/30 cursor-pointer"
          >
            <span>View Public Pricing Plans</span>
            <ArrowRight className="size-3" />
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge
          variant="outline"
          className="text-xs px-3 py-1 border-primary/30 bg-primary/10 text-primary font-medium inline-flex items-center gap-1.5"
        >
          <Sparkles className="size-3.5 text-primary" />
          <span>Honest & Transparent Philosophy</span>
        </Badge>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
          Why Pay? <span className="text-primary">(Spoiler: You Don’t Have To)</span>
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Lokker is built on a simple promise: <strong className="text-foreground">your personal digital security should never be held hostage behind a paywall.</strong> Here is the full story behind how Lokker works, why paid plans exist, and how you can support this project.
        </p>
      </div>

      {/* Highlight 1: It is 100% Free to Use */}
      <div className="p-6 sm:p-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface to-background shadow-sm space-y-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 mb-0.5">
                100% Free Forever
              </Badge>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Lokker is Completely Free to Use
              </h2>
            </div>
          </div>

          <div className="text-right font-mono hidden sm:block">
            <span className="text-2xl font-extrabold text-emerald-500">$0</span>
            <span className="text-[11px] text-muted-foreground block">No hidden catches</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          You can use Lokker right now without paying a single penny. You don&apos;t even need to enter a credit card or connect to the cloud. All core features—storing unlimited passwords, bookmarks, credit cards, secure notes, 2FA authenticator codes, emergency recovery keys, and browser extension autofill—work <strong className="text-foreground">100% offline directly on your own device</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-border-subtle bg-background/80 space-y-1">
            <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Zero Paywalls</span>
            </p>
            <p className="text-[11px] text-muted-foreground">No artificial limits on your personal passwords or bookmarks.</p>
          </div>
          <div className="p-3 rounded-xl border border-border-subtle bg-background/80 space-y-1">
            <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>100% Local-First</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Encrypted locally with AES-GCM 256-bit cryptography.</p>
          </div>
          <div className="p-3 rounded-xl border border-border-subtle bg-background/80 space-y-1">
            <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>No User Tracking</span>
            </p>
            <p className="text-[11px] text-muted-foreground">No advertisements, no telemetry tracking your secrets.</p>
          </div>
        </div>
      </div>

      {/* Highlight 2: Why Paid Plans Exist (Fair Platform Costs) */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Server className="size-5 text-primary" />
            <span>Why Do Paid Plans (Pro & Plus) Exist?</span>
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If the vault is completely free, why do we have subscription tiers? The answer is straightforward: <strong className="text-foreground">cloud infrastructure costs real money every month.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-border-subtle bg-surface space-y-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Database className="size-4" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">Database Storage</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Hosting multi-region, real-time encrypted PostgreSQL instances requires continuous cloud hosting fees.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border-subtle bg-surface space-y-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Cloud className="size-4" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">Real-Time Cloud Relays</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Syncing credentials seamlessly between your desktop, laptop, mobile browser, and extension consumes server bandwidth.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border-subtle bg-surface space-y-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Heart className="size-4 text-rose-500" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">Keeping the Project Alive</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Fair monetization keeps the independent developer afloat so this project remains healthy without corporate VC pressure.
            </p>
          </div>
        </div>

        {/* Reassurance quote */}
        <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-1">
          <p className="text-xs text-foreground font-semibold">
            💡 Staying Local Helps Save Costs!
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            If you choose to use Lokker purely offline on your device, no one is questioning you or forcing you to upgrade. In fact, staying local actually saves server and database bandwidth, which directly helps our operating costs!
          </p>
        </div>
      </div>

      {/* Highlight 3: Donation & Friendly Support */}
      <div className="p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-background space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 mb-0.5">
              Optional Support
            </Badge>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Coffee className="size-5 text-amber-500" />
              <span>Want to Support with a Donation?</span>
            </h2>
          </div>

          <Button
            size="sm"
            onClick={() => setIsDonateOpen(true)}
            className="h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold cursor-pointer shadow-xs"
          >
            <Coffee className="size-3.5" />
            <span>Buy Me a Coffee</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          If you love using Lokker, appreciate the privacy-first design, and want to support the developer without needing a recurring cloud subscription, you are very welcome to leave a tip or send a kind message. Every kind gesture means the world and fuels ongoing development.
        </p>
      </div>

      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
    </div>
  );
}

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
  HardDrive,
  DollarSign,
  Gift,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { DonateModal } from "@/components/modals/donate-modal";

export default function WhyToPayPage() {
  const [isDonateOpen, setIsDonateOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <MarketingNav />

      <main className="flex-1 py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <Badge
            variant="outline"
            className="text-xs px-3 py-1 border-primary/30 bg-primary/10 text-primary font-medium inline-flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>Honest & Transparent Philosophy</span>
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
            Why Pay? <span className="text-primary">(Spoiler: You Don’t Have To)</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Lokker is built on a simple promise: <strong className="text-foreground">your personal digital security should never be held hostage behind a paywall.</strong> Here is the full, transparent story behind how Lokker works, why paid plans exist, and how you can support this project.
          </p>
        </div>

        {/* Highlight 1: It is 100% Free to Use */}
        <div className="p-8 sm:p-10 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface to-background shadow-lg space-y-6 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 mb-1">
                  100% Free Forever
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Lokker is Completely Free to Use
                </h2>
              </div>
            </div>

            <div className="text-right font-mono hidden sm:block">
              <span className="text-3xl font-extrabold text-emerald-500">$0</span>
              <span className="text-xs text-muted-foreground block">No hidden catches</span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            You can use Lokker right now without paying a single penny. You don&apos;t even need to enter a credit card or create an account. All core features—storing unlimited passwords, bookmarks, credit cards, secure notes, 2FA authenticator codes, emergency recovery keys, and browser extension autofill—work <strong className="text-foreground">100% offline directly on your own device</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-border-subtle bg-background/80 space-y-1">
              <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Zero Paywalls</span>
              </p>
              <p className="text-[11px] text-muted-foreground">No artificial limits on your passwords or bookmarks.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border-subtle bg-background/80 space-y-1">
              <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>100% Local-First</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Encrypted locally with AES-GCM 256-bit cryptography.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border-subtle bg-background/80 space-y-1">
              <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>No User Tracking</span>
              </p>
              <p className="text-[11px] text-muted-foreground">No advertisements, no telemetry tracking your secrets.</p>
            </div>
          </div>
        </div>

        {/* Highlight 2: Why Paid Plans Exist (Fair Platform Costs) */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Server className="size-6 text-primary" />
              <span>Why Do Paid Plans (Pro & Plus) Exist?</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If the vault is completely free, why do we have subscription options? The answer is straightforward: <strong className="text-foreground">cloud infrastructure costs real money every month.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-subtle bg-surface space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Database className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Database Storage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hosting multi-region, real-time encrypted PostgreSQL instances requires continuous cloud hosting fees.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border-subtle bg-surface space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Cloud className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Real-Time Cloud Relays</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Syncing credentials seamlessly between your desktop, laptop, mobile browser, and extension consumes server bandwidth.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border-subtle bg-surface space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Heart className="size-5 text-rose-500" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Keeping the Lights On</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fair monetization keeps the independent developer afloat so this project remains healthy without corporate VC pressure.
              </p>
            </div>
          </div>

          {/* Reassurance quote */}
          <div className="p-5 rounded-2xl border border-primary/25 bg-primary/5 space-y-2">
            <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
              💡 <strong>Staying Local Helps Save Costs!</strong>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you choose to use Lokker purely offline on your device, no one is questioning you or forcing you to upgrade. In fact, staying local actually saves server and database bandwidth, which directly helps our operating costs!
            </p>
          </div>
        </div>

        {/* Highlight 3: Donation & Friendly Support */}
        <div className="p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-background space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 mb-1">
                Optional Support
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Coffee className="size-5 text-amber-500" />
                <span>Want to Support with a Donation?</span>
              </h2>
            </div>

            <Button
              size="sm"
              onClick={() => setIsDonateOpen(true)}
              className="h-9 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold cursor-pointer shadow-xs"
            >
              <Coffee className="size-3.5" />
              <span>Buy Me a Coffee</span>
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            If you love using Lokker, appreciate the privacy-first design, and want to support the developer without needing a recurring cloud subscription, you are very welcome to leave a tip or send a kind message. Every kind gesture means the world and fuels ongoing development.
          </p>
        </div>

        {/* Call to action to View Pricing */}
        <div className="p-8 rounded-3xl border border-border-subtle bg-surface text-center space-y-4 max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-foreground">Explore All Options</h3>
          <p className="text-xs text-muted-foreground">
            Whether you stick with the Free tier, need Cloud Sync with Pro, or manage a team with Plus, we appreciate you being part of the Lokker community.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button size="sm" className="w-full h-9 text-xs font-medium gap-1.5 cursor-pointer">
                <span>View Public Pricing Plans</span>
                <ArrowRight className="size-3" />
              </Button>
            </Link>
            <Link href="/app" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full h-9 text-xs cursor-pointer">
                <span>Open Free Vault Directly</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
    </div>
  );
}

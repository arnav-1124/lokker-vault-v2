"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  Users,
  Cloud,
  ArrowRight,
  HelpCircle,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <MarketingNav />

      <main className="flex-1 py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        {/* Top Banner with Why to Pay Link */}
        <div className="flex justify-center">
          <Link
            href="/why-to-pay"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/15 transition-all text-xs text-primary font-medium shadow-xs group"
          >
            <HelpCircle className="size-3.5 text-primary group-hover:rotate-12 transition-transform" />
            <span>Why to Pay? Learn why Lokker is free and why cloud costs exist</span>
            <ArrowRight className="size-3 text-primary group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-heading">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Lokker is local-first and completely free by default. Our cloud subscription tiers exist solely to cover recurring hosting, database, and infrastructure costs.
          </p>
        </div>

        {/* 3 Pricing Cards: Free, Pro, Plus */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          {/* 1. FREE PLAN (RECOMMENDED) */}
          <div className="relative p-7 rounded-3xl border-2 border-primary bg-surface shadow-lg flex flex-col justify-between space-y-6">
            {/* Top Recommended Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground font-bold text-[11px] px-3 py-0.5 shadow-xs uppercase tracking-wider">
                Recommended
              </Badge>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Free</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Complete privacy-first security on your local device with zero compromises.
                </p>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-foreground">$0</span>
                <span className="text-xs text-muted-foreground">/ forever</span>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2.5 text-xs">
                <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Includes:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Unlimited passwords & bookmarks</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>100% offline AES-GCM 256-bit encryption</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>RFC 6238 2FA TOTP authenticator</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Browser extension autofill</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>1 Team Workspace included</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Unlimited member joins</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link href="/app" className="block w-full pt-4">
              <Button size="sm" className="w-full h-10 text-xs font-semibold cursor-pointer">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* 2. PRO PLAN ($5/mo) */}
          <div className="p-7 rounded-3xl border border-border-subtle bg-surface/80 flex flex-col justify-between space-y-6 hover:border-primary/40 transition-all">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Pro</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  For individuals needing encrypted cloud sync across multiple devices.
                </p>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-foreground">$5</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2.5 text-xs">
                <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Everything in Free, plus:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Zero-knowledge multi-device cloud sync</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Up to 5 Team Workspaces</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Automatic encrypted cloud backups</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Cross-device real-time sync relays</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Priority developer support</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link href="/signup?plan=pro" className="block w-full pt-4">
              <Button variant="outline" size="sm" className="w-full h-10 text-xs font-semibold cursor-pointer border-border-subtle hover:bg-surface-elevated">
                Upgrade to Pro
              </Button>
            </Link>
          </div>

          {/* 3. PLUS PLAN ($15/mo) */}
          <div className="p-7 rounded-3xl border border-border-subtle bg-surface/80 flex flex-col justify-between space-y-6 hover:border-primary/40 transition-all">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Plus</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  For growing teams, small organizations, and heavy collaboration.
                </p>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-foreground">$15</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2.5 text-xs">
                <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Everything in Pro, plus:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Up to 25 Team Workspaces</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Unlimited members per workspace</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Single-use cryptographic invite links</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Direct developer contact channel</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>Early access to experimental features</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link href="/signup?plan=plus" className="block w-full pt-4">
              <Button variant="outline" size="sm" className="w-full h-10 text-xs font-semibold cursor-pointer border-border-subtle hover:bg-surface-elevated">
                Choose Plus
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

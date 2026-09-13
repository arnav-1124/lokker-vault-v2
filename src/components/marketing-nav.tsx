"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ShieldCheck,
  Moon,
  Sun,
  ArrowRight,
  Menu,
  Cloud,
  ChevronDown,
  Lock,
  KeyRound,
  FileText,
  Download,
  Palette,
  HelpCircle,
  Users,
  Sparkles,
  Database,
  Layers,
  Heart,
  ExternalLink,
  Shield,
  EyeOff,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/config/app";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";

const emptySubscribe = () => () => {};

export function MarketingNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [activeMenu, setActiveMenu] = React.useState<"features" | "resources" | "pricing" | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = React.useState<string | null>("features");
  const leaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: "features" | "resources" | "pricing") => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

  const handleLinkClick = () => {
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-[var(--z-sticky)] border-b border-border-subtle bg-background/95 backdrop-blur-md"
      onMouseLeave={handleMouseLeave}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            <LokkerBrandIcon size="sm" />
            <span className="font-heading font-bold text-sm tracking-tight">{appConfig.name}</span>
          </Link>

          {/* 3 Scalable Options Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            {/* Option 1: Features (Mega-Menu) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("features")}
            >
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === "features" ? null : "features")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeMenu === "features" || pathname?.startsWith("/features")
                    ? "text-foreground bg-surface-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
                aria-expanded={activeMenu === "features"}
              >
                <span>Features</span>
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    activeMenu === "features" ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>

              {/* Features Mega Dropdown */}
              {activeMenu === "features" && (
                <div
                  onMouseEnter={() => handleMouseEnter("features")}
                  className="absolute left-0 top-full mt-1.5 w-[560px] rounded-2xl border border-border-subtle bg-surface/98 backdrop-blur-xl shadow-2xl p-5 z-[var(--z-popover)] animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="grid grid-cols-2 gap-5">
                    {/* Group A: Core Vault & Security */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                        <Lock className="size-3.5 text-primary" />
                        <span>Security & Privacy</span>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/security"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500/20 transition-colors">
                            <ShieldCheck className="size-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                Security Architecture
                              </span>
                              <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/30 py-0 px-1">
                                Zero-Knowledge
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              AES-GCM-256 + Argon2id client encryption. Your keys never touch a server.
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/privacy"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-500/20 transition-colors">
                            <EyeOff className="size-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Privacy First
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              No tracking, no telemetry, no analytics on personal credentials.
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/features"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                            <KeyRound className="size-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Password & 2FA Manager
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Generator, audit checks, TOTP codes, and secure note attachments.
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Group B: Cloud & Collaboration */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                        <Cloud className="size-3.5 text-primary" />
                        <span>Cloud & Teams</span>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/features#cloud-sync"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                            <Cloud className="size-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                Cloud Sync (Optional)
                              </span>
                              <Badge variant="outline" className="text-[9px] text-primary border-primary/30 py-0 px-1">
                                E2EE Relay
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Seamless encrypted synchronization across desktop, web, and extension.
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/features#workspaces"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500/20 transition-colors">
                            <Users className="size-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                Team Workspaces
                              </span>
                              <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/30 py-0 px-1">
                                New
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Role-based sharing, unique invite links, and granular access control.
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/docs"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5 group-hover:text-foreground transition-colors">
                            <FileText className="size-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Documentation & Guides
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Step-by-step setup guides, emergency kit recovery, and API notes.
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Callout */}
                  <div className="-mx-5 -mb-5 mt-4 p-3 rounded-b-2xl bg-muted/30 border-t border-border-subtle flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3 text-primary" />
                      <span>100% functional offline with zero setup required.</span>
                    </span>
                    <Link
                      href="/features"
                      onClick={handleLinkClick}
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <span>Explore all features</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Option 2: Resources & Trust (Mega-Menu) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("resources")}
            >
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === "resources" ? null : "resources")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeMenu === "resources" ||
                  pathname === "/security" ||
                  pathname === "/privacy" ||
                  pathname === "/docs" ||
                  pathname === "/download" ||
                  pathname === "/design"
                    ? "text-foreground bg-surface-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
                aria-expanded={activeMenu === "resources"}
              >
                <span>Resources</span>
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    activeMenu === "resources" ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>

              {/* Resources Mega Dropdown */}
              {activeMenu === "resources" && (
                <div
                  onMouseEnter={() => handleMouseEnter("resources")}
                  className="absolute left-0 top-full mt-1.5 w-[520px] rounded-2xl border border-border-subtle bg-surface/98 backdrop-blur-xl shadow-2xl p-5 z-[var(--z-popover)] animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="grid grid-cols-2 gap-5">
                    {/* Column 1: Trust & Architecture */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                        <Shield className="size-3.5 text-primary" />
                        <span>Trust & Architecture</span>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/security"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldCheck className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Security Model
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Cryptographic guarantees and master password derivation.
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/privacy"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                            <EyeOff className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Privacy Policy
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Local-first manifesto and zero-telemetry commitments.
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Column 2: Developers & Apps */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                        <Layers className="size-3.5 text-primary" />
                        <span>Apps & Tools</span>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/docs"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Documentation
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Guides, browser extension guide, and recovery keys.
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/download"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Download className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Desktop & Mobile Apps
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Windows, macOS, Linux, and web app install.
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/design"
                          onClick={handleLinkClick}
                          className="group flex items-start gap-3 p-2 rounded-xl hover:bg-background/80 transition-colors"
                        >
                          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Palette className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                              Design System
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              UI preview, typography, and component showcase.
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Option 3: Pricing & Why Pay? (Mega-Menu) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("pricing")}
            >
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === "pricing" ? null : "pricing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeMenu === "pricing" || pathname === "/pricing" || pathname === "/why-to-pay"
                    ? "text-foreground bg-surface-hover"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
                aria-expanded={activeMenu === "pricing"}
              >
                <span>Pricing & Why Pay?</span>
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    activeMenu === "pricing" ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>

              {/* Pricing Mega Dropdown */}
              {activeMenu === "pricing" && (
                <div
                  onMouseEnter={() => handleMouseEnter("pricing")}
                  className="absolute left-0 top-full mt-1.5 w-[500px] rounded-2xl border border-border-subtle bg-surface/98 backdrop-blur-xl shadow-2xl p-5 z-[var(--z-popover)] animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="space-y-4">
                    {/* Highlight: Why to Pay Philosophy */}
                    <Link
                      href="/why-to-pay"
                      onClick={handleLinkClick}
                      className="group p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex items-start gap-3.5 block"
                    >
                      <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                        <Heart className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            Why Pay? (Spoiler: You Don&apos;t Have To)
                          </span>
                          <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/30 font-semibold">
                            100% Free Vault
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Lokker is 100% free offline forever with zero paywalls. Learn how paid tiers simply cover cloud database and hosting costs.
                        </p>
                      </div>
                    </Link>

                    {/* Pricing Plans Overview */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Link
                        href="/pricing"
                        onClick={handleLinkClick}
                        className="group p-3 rounded-xl border border-border-subtle bg-background/80 hover:border-primary/40 hover:bg-background transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            Personal Free Tier
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-500">$0</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Unlimited passwords, bookmarks, 2FA codes, completely local.
                        </p>
                      </Link>

                      <Link
                        href="/pricing"
                        onClick={handleLinkClick}
                        className="group p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            Cloud & Pro Plans
                          </span>
                          <span className="text-xs font-mono font-bold text-primary">From $5/mo</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Encrypted multi-device sync, multiple team workspaces, and priority relay.
                        </p>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section: Actions & Theme */}
        <div className="flex items-center gap-2.5">
          {/* Theme Switcher */}
          {mounted ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle Theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-3.5 text-amber-500" />
              ) : (
                <Moon className="size-3.5 text-indigo-400" />
              )}
            </Button>
          ) : (
            <div className="size-7" />
          )}

          {/* Sign In Link */}
          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium">
              Sign In
            </Button>
          </Link>

          {/* Primary CTA */}
          <Link href="/app">
            <Button size="sm" className="h-8 text-xs gap-1.5 shadow-xs font-medium cursor-pointer">
              <span>Open Vault</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-muted-foreground cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (3 Sections Accordion) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border-subtle bg-surface/95 backdrop-blur-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1.5">
            {/* Mobile Section 1: Features */}
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-background">
              <button
                type="button"
                onClick={() =>
                  setMobileExpandedSection(mobileExpandedSection === "features" ? null : "features")
                }
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Lock className="size-3.5 text-primary" />
                  <span>Features</span>
                </div>
                <ChevronDown
                  className={`size-3.5 transition-transform ${
                    mobileExpandedSection === "features" ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>
              {mobileExpandedSection === "features" && (
                <div className="p-3 pt-0 border-t border-border-subtle/50 space-y-2 text-xs">
                  <Link
                    href="/security"
                    onClick={handleLinkClick}
                    className="flex items-center justify-between py-1 text-muted-foreground hover:text-foreground"
                  >
                    <span>Security Architecture</span>
                    <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/30">Zero-Knowledge</Badge>
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={handleLinkClick}
                    className="block py-1 text-muted-foreground hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/features"
                    onClick={handleLinkClick}
                    className="block py-1 text-muted-foreground hover:text-foreground"
                  >
                    Password & 2FA Manager
                  </Link>
                  <Link
                    href="/features#cloud-sync"
                    onClick={handleLinkClick}
                    className="flex items-center justify-between py-1 text-muted-foreground hover:text-foreground"
                  >
                    <span>Cloud Sync (Optional)</span>
                    <Badge variant="outline" className="text-[9px] text-primary border-primary/30">E2EE</Badge>
                  </Link>
                  <Link
                    href="/features#workspaces"
                    onClick={handleLinkClick}
                    className="flex items-center justify-between py-1 text-muted-foreground hover:text-foreground"
                  >
                    <span>Team Workspaces</span>
                    <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/30">New</Badge>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Section 2: Resources & Trust */}
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-background">
              <button
                type="button"
                onClick={() =>
                  setMobileExpandedSection(mobileExpandedSection === "resources" ? null : "resources")
                }
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5 text-primary" />
                  <span>Resources & Trust</span>
                </div>
                <ChevronDown
                  className={`size-3.5 transition-transform ${
                    mobileExpandedSection === "resources" ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>
              {mobileExpandedSection === "resources" && (
                <div className="p-3 pt-0 border-t border-border-subtle/50 space-y-2 text-xs">
                  <Link
                    href="/docs"
                    onClick={handleLinkClick}
                    className="block py-1 text-muted-foreground hover:text-foreground"
                  >
                    Documentation & Guides
                  </Link>
                  <Link
                    href="/download"
                    onClick={handleLinkClick}
                    className="block py-1 text-muted-foreground hover:text-foreground"
                  >
                    Desktop & Mobile Apps
                  </Link>
                  <Link
                    href="/design"
                    onClick={handleLinkClick}
                    className="block py-1 text-muted-foreground hover:text-foreground"
                  >
                    Design System Preview
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Section 3: Pricing & Why Pay */}
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-background">
              <button
                type="button"
                onClick={() =>
                  setMobileExpandedSection(mobileExpandedSection === "pricing" ? null : "pricing")
                }
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Heart className="size-3.5 text-emerald-500" />
                  <span>Pricing & Why Pay?</span>
                </div>
                <ChevronDown
                  className={`size-3.5 transition-transform ${
                    mobileExpandedSection === "pricing" ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>
              {mobileExpandedSection === "pricing" && (
                <div className="p-3 pt-0 border-t border-border-subtle/50 space-y-2 text-xs">
                  <Link
                    href="/why-to-pay"
                    onClick={handleLinkClick}
                    className="flex items-center justify-between py-1 text-emerald-500 font-medium"
                  >
                    <span>Why Pay? (Philosophy)</span>
                    <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/30">Free Vault</Badge>
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={handleLinkClick}
                    className="block py-1 text-muted-foreground hover:text-foreground"
                  >
                    Pricing Plans ($0 / $5 / $15)
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle flex flex-col gap-2">
            <Link href="/login" onClick={handleLinkClick}>
              <Button variant="outline" size="sm" className="w-full h-8 text-xs cursor-pointer">
                Sign In to Lokker Cloud
              </Button>
            </Link>
            <Link href="/signup" onClick={handleLinkClick}>
              <Button size="sm" className="w-full h-8 text-xs cursor-pointer">
                Create Account (Optional)
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

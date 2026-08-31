"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowRight,
  Sparkles,
  QrCode,
  Bookmark,
  Activity,
  Database,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  Move,
  CheckCircle2,
  XCircle,
  HardDrive,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function MarketingHomePage() {
  // Interactive Demo View State
  const [activeTab, setActiveTab] = React.useState<"vault" | "locked" | "autofill" | "totp">("vault");
  const [revealedPassId, setRevealedPassId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Locked State Simulation
  const [demoPassword, setDemoPassword] = React.useState("");
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState(false);

  // Autofill Interactive Simulation
  const [autofillOffset, setAutofillOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [filledEmail, setFilledEmail] = React.useState("");
  const [filledPass, setFilledPass] = React.useState("");

  // 2FA TOTP Simulation
  const [totpSeconds, setTotpSeconds] = React.useState(24);
  const [totpCode, setTotpCode] = React.useState("482910");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  // TOTP countdown effect
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTotpSeconds((prev) => {
        if (prev <= 1) {
          // Generate new simulated code
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          setTotpCode(newCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUnlockDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoPassword === "masterpassword" || demoPassword.length >= 6) {
      setIsUnlocked(true);
      setUnlockError(false);
    } else {
      setUnlockError(true);
    }
  };

  // Drag simulation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - autofillOffset.x, y: e.clientY - autofillOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setAutofillOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const sampleVaultItems = [
    {
      id: "1",
      name: "GitHub",
      domain: "github.com",
      username: "alex.developer@example.com",
      password: "ghp_secureToken992!@#x",
      category: "Developer",
      strength: "Strong",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      id: "2",
      name: "ProtonMail",
      domain: "proton.me",
      username: "alex.vault@proton.me",
      password: "Correct-Horse-Battery-Staple-92",
      category: "Personal",
      strength: "Very Strong",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      id: "3",
      name: "AWS Console",
      domain: "aws.amazon.com",
      username: "admin-iam-production",
      password: "AWS-Root-9941-Kdf#881",
      category: "Infrastructure",
      strength: "Strong",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  const faqs = [
    {
      q: "Does Lokker store my passwords on a server?",
      a: "No. Lokker operates zero central password databases. Your master password, encryption keys, and vault entries are generated, encrypted, and stored entirely within your browser local IndexedDB on your own device.",
    },
    {
      q: "Does my master password ever leave my device?",
      a: "Never. Your master password is used solely in client-side ephemeral memory to derive your Key Encryption Key (KEK) using PBKDF2 with 100,000 iterations. Plaintext secrets are never transmitted across the network.",
    },
    {
      q: "Can I use Lokker without an account?",
      a: "Yes! There are no user registrations, email requirements, or subscriptions needed for full local functionality. You open the app, initialize your master password, and begin managing your vault immediately.",
    },
    {
      q: "Can Lokker work 100% offline?",
      a: "Yes. All cryptographic operations (AES-GCM encryption/decryption, PBKDF2 derivation, TOTP calculation) run completely offline in your browser using standard Web Crypto APIs.",
    },
    {
      q: "How does browser autofill work without cloud sync?",
      a: "The Lokker Manifest V3 extension synchronizes encrypted payloads locally with your active web vault session via isolated postMessage / Shadow DOM communication. It verifies site origins locally before prompting to autofill.",
    },
    {
      q: "What happens if I forget my master password?",
      a: "Because Lokker has zero access to your vault, we cannot reset your password. However, during setup Lokker generates a 256-bit Emergency Recovery Key formatted as readable 4-character chunks. You can use this recovery key to independently unwrap your Vault Encryption Key (VEK) and restore access.",
    },
    {
      q: "How does biometric / passkey unlocking work?",
      a: "Lokker utilizes the WebAuthn PRF (Pseudo-Random Function) extension. Your hardware passkey (Touch ID, Windows Hello, or FIDO2 key) derives a symmetric key directly without server interaction, preserving zero-knowledge architecture.",
    },
    {
      q: "Is Lokker open source?",
      a: "Yes. Lokker is open source under the AGPLv3 license. You can inspect every cryptographic primitive, verify that no network telemetry exists, and build the app and extension from source.",
    },
  ];

  return (
    <div
      className="min-h-dvh bg-background text-foreground flex flex-col selection:bg-primary/20"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <MarketingNav />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-16 md:pt-24 md:pb-24 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge
              variant="outline"
              className="gap-1.5 py-1 px-3 text-xs bg-surface border-border-subtle shadow-xs"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span>Local-First Password Vault & Digital Workspace</span>
            </Badge>
          </div>

          <h1 className="text-display font-semibold tracking-tight text-balance max-w-4xl mx-auto mb-6 text-3xl sm:text-5xl md:text-6xl">
            Your passwords don&apos;t need a server.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            Lokker stores your encrypted vault locally and keeps your master password on your device.
            Manage credentials, generate 2FA codes, and autofill securely without handing your vault to a centralized cloud database.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link href="/app">
              <Button size="lg" className="h-11 px-6 gap-2 shadow-sm font-medium">
                <span>Open Vault App</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" size="lg" className="h-11 px-6 shadow-xs font-medium">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Highlights Pill Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-caption text-muted-foreground">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-subtle bg-surface">
              <HardDrive className="size-3.5 text-primary" /> Local-First
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-subtle bg-surface">
              <Lock className="size-3.5 text-primary" /> Encrypted Locally
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-subtle bg-surface">
              <ShieldCheck className="size-3.5 text-primary" /> No Mandatory Account
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-subtle bg-surface">
              <Cpu className="size-3.5 text-primary" /> Browser Autofill
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-subtle bg-surface">
              <CheckCircle2 className="size-3.5 text-primary" /> Open Source
            </span>
          </div>
        </section>

        {/* INTERACTIVE VAULT INTERFACE DEMO */}
        <section id="demo" className="border-t border-border-subtle bg-surface/30 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                Live Interactive Demonstration
              </Badge>
              <h2 className="text-heading text-2xl sm:text-3xl font-semibold mb-3">
                Store it. Lock it. Use it.
              </h2>
              <p className="text-caption sm:text-sm text-muted-foreground">
                Experience the actual Lokker application interface. Clean, fast, and engineered strictly for your local workflow.
              </p>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg border border-border-subtle bg-surface p-1 shadow-xs">
                <button
                  onClick={() => setActiveTab("vault")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === "vault"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Vault View
                </button>
                <button
                  onClick={() => setActiveTab("locked")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === "locked"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Locked State
                </button>
                <button
                  onClick={() => setActiveTab("autofill")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === "autofill"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Browser Autofill
                </button>
                <button
                  onClick={() => setActiveTab("totp")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === "totp"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  2FA TOTP
                </button>
              </div>
            </div>

            {/* Interactive Surface Window */}
            <div className="rounded-xl border border-border-subtle bg-surface shadow-md overflow-hidden">
              {/* Fake Window Header */}
              <div className="border-b border-border-subtle bg-surface-elevated px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-destructive/60" />
                    <span className="size-2.5 rounded-full bg-warning/60" />
                    <span className="size-2.5 rounded-full bg-success/60" />
                  </div>
                  <span className="text-muted-foreground ml-2 font-mono flex items-center gap-1">
                    <Lock className="size-3 text-success" />
                    https://lokker.local/{activeTab === "vault" ? "passwords" : activeTab}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs bg-background text-muted-foreground">
                  Local Vault
                </Badge>
              </div>

              {/* Window Content based on activeTab */}
              <div className="p-6">
                {/* TAB 1: VAULT VIEW */}
                {activeTab === "vault" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Password Vault</h3>
                        <p className="text-xs text-muted-foreground">
                          3 credentials stored • AES-GCM 256-bit encrypted
                        </p>
                      </div>
                      <Badge className="bg-success/15 text-success border-success/30 w-fit">
                        Decrypted in Memory
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      {sampleVaultItems.map((item) => {
                        const isRevealed = revealedPassId === item.id;
                        const isCopied = copiedId === item.id;
                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border-subtle bg-background p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                                {item.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                    {item.category}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">{item.username}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <span className="font-mono text-xs bg-surface px-2 py-1 rounded border border-border-subtle">
                                {isRevealed ? item.password : "••••••••••••••••"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={isRevealed ? "Hide Password" : "Show Password"}
                                onClick={() => setRevealedPassId(isRevealed ? null : item.id)}
                              >
                                {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleCopy(item.id, item.password)}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="size-3 text-success" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: LOCKED STATE */}
                {activeTab === "locked" && (
                  <div className="max-w-md mx-auto py-6 text-center">
                    {isUnlocked ? (
                      <div className="space-y-4">
                        <div className="size-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                          <CheckCircle2 className="size-6" />
                        </div>
                        <h3 className="text-base font-semibold">Vault Unlocked Successfully</h3>
                        <p className="text-xs text-muted-foreground">
                          Key Encryption Key (KEK) derived via PBKDF2. Vault Encryption Key (VEK) unwrapped into ephemeral memory.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsUnlocked(false);
                            setDemoPassword("");
                          }}
                        >
                          Lock Vault Again
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleUnlockDemo} className="space-y-4">
                        <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <Lock className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">Unlock Local Vault</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter your master password to unwrap your encryption keys.
                          </p>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <Label htmlFor="demo-pwd" className="text-xs">Master Password</Label>
                          <Input
                            id="demo-pwd"
                            type="password"
                            placeholder="Type any password (e.g. masterpassword)"
                            value={demoPassword}
                            onChange={(e) => {
                              setDemoPassword(e.target.value);
                              setUnlockError(false);
                            }}
                            aria-invalid={unlockError}
                          />
                          {unlockError && (
                            <p className="text-[11px] text-destructive">
                              Password must be at least 6 characters.
                            </p>
                          )}
                        </div>
                        <Button type="submit" className="w-full h-9">
                          Unlock Vault
                        </Button>
                        <p className="text-[11px] text-muted-foreground">
                          Tested completely locally. No server requests sent.
                        </p>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: BROWSER AUTOFILL */}
                {activeTab === "autofill" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                      <div>
                        <h3 className="text-sm font-semibold">Drag-and-Drop Password Fill</h3>
                        <p className="text-xs text-muted-foreground">
                          The Lokker badge floats in an isolated Shadow DOM. Move it anywhere so it never covers form fields.
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Interactive Preview
                      </Badge>
                    </div>

                    <div className="relative rounded-lg border border-border-subtle bg-background p-6 min-h-[240px]">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="text-center pb-2">
                          <p className="text-sm font-semibold">Sign in to Acme Inc</p>
                          <p className="text-xs text-muted-foreground">Example website login form</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email address</Label>
                          <Input
                            readOnly
                            placeholder="user@example.com"
                            value={filledEmail}
                            className="bg-surface"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Password</Label>
                          <Input
                            readOnly
                            type="password"
                            placeholder="••••••••••••"
                            value={filledPass}
                            className="bg-surface"
                          />
                        </div>
                      </div>

                      {/* Floating draggable badge */}
                      <div
                        onMouseDown={handleMouseDown}
                        style={{
                          transform: `translate(${autofillOffset.x}px, ${autofillOffset.y}px)`,
                          cursor: isDragging ? "grabbing" : "grab",
                        }}
                        className="absolute bottom-6 right-6 select-none flex items-center gap-2 rounded-full border border-primary/30 bg-primary/95 text-primary-foreground px-3 py-1.5 text-xs shadow-md font-medium hover:bg-primary transition-colors"
                      >
                        <Move className="size-3 text-primary-foreground/70" />
                        <ShieldCheck className="size-3.5" />
                        <span>Lokker Fill</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilledEmail("alex.developer@example.com");
                            setFilledPass("ghp_secureToken992!@#x");
                          }}
                          className="ml-1 px-1.5 py-0.5 rounded bg-background/20 text-[10px] hover:bg-background/40"
                        >
                          Fill Form
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tip: Drag the blue badge with your mouse to test repositioning.</span>
                      {(filledEmail || filledPass) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            setFilledEmail("");
                            setFilledPass("");
                          }}
                        >
                          Clear Form
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: 2FA TOTP */}
                {activeTab === "totp" && (
                  <div className="max-w-md mx-auto py-4 space-y-4">
                    <div className="text-center pb-2">
                      <h3 className="text-sm font-semibold">Live RFC 6238 TOTP Generator</h3>
                      <p className="text-xs text-muted-foreground">
                        Standard time-based one-time passcodes with real-time countdown.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border-subtle bg-background p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            G
                          </div>
                          <div>
                            <p className="text-xs font-semibold">GitHub Security 2FA</p>
                            <p className="text-[11px] text-muted-foreground">alex@developer.io</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono text-primary">
                          <span className="size-2 rounded-full bg-primary animate-pulse" />
                          <span>{totpSeconds}s</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-surface rounded-lg p-3 border border-border-subtle">
                        <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                          {totpCode.slice(0, 3)} {totpCode.slice(3)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleCopy("totp", totpCode)}
                        >
                          {copiedId === "totp" ? (
                            <>
                              <Check className="size-3 text-success" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-surface-hover h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-1000 ease-linear"
                          style={{ width: `${(totpSeconds / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* WHY LOCAL-FIRST ARCHITECTURE MATTERS (COMPARISON) */}
        <section className="py-20 border-t border-border-subtle">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                Architectural Independence
              </Badge>
              <h2 className="text-heading text-2xl sm:text-3xl font-semibold mb-3">
                Why Local-First Architecture Matters
              </h2>
              <p className="text-caption sm:text-sm text-muted-foreground">
                Your password manager shouldn&apos;t need custody of your passwords. Centralized password servers create high-value breach targets.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Cloud Card */}
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-destructive/20 pb-3">
                  <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                    <XCircle className="size-4" />
                    <span>Traditional Cloud Architecture</span>
                  </div>
                  <Badge variant="outline" className="text-[11px] border-destructive/30 text-destructive">
                    Centralized Custody
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your Device → Cloud Server Database → Remote Synchronization
                </p>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">×</span>
                    <span>Encrypted vaults stored on remote vendor servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">×</span>
                    <span>Mandatory user accounts and remote authentication sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">×</span>
                    <span>Single server breach or subpoena puts millions of vaults at risk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">×</span>
                    <span>Ongoing subscription fees and telemetry tracking</span>
                  </li>
                </ul>
              </div>

              {/* Lokker Local-First Card */}
              <div className="rounded-xl border border-success/30 bg-success/5 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-success/20 pb-3">
                  <div className="flex items-center gap-2 text-success font-semibold text-sm">
                    <CheckCircle2 className="size-4" />
                    <span>Lokker Local-First Model</span>
                  </div>
                  <Badge variant="outline" className="text-[11px] border-success/30 text-success">
                    Zero Server Custody
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your Device → AES-GCM Encryption → Local IndexedDB
                </p>
                <ul className="space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-success shrink-0" />
                    <span>Vault encrypted and stored strictly on your local hardware</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-success shrink-0" />
                    <span>Zero mandatory accounts or centralized credential databases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-success shrink-0" />
                    <span>Full functionality remains 100% operational offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-success shrink-0" />
                    <span>Open source under AGPLv3 with no telemetry or tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3-TIER ENVELOPE ENCRYPTION MODEL */}
        <section className="border-t border-border-subtle bg-surface/30 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                Envelope Encryption
              </Badge>
              <h2 className="text-heading text-2xl sm:text-3xl font-semibold mb-3">
                What Happens to Your Master Password?
              </h2>
              <p className="text-caption sm:text-sm text-muted-foreground">
                Lokker implements a 3-tier Envelope Encryption Model (VEK / KEK). Your master password never encrypts the data directly.
              </p>
            </div>

            {/* Step Flow Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="bg-surface border-border-subtle">
                <CardHeader className="p-4">
                  <span className="text-xs font-mono text-primary font-semibold">STEP 01</span>
                  <CardTitle className="text-sm">Master Password</CardTitle>
                  <CardDescription className="text-xs">Entered locally on your device</CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader className="p-4">
                  <span className="text-xs font-mono text-primary font-semibold">STEP 02</span>
                  <CardTitle className="text-sm">Derive KEK</CardTitle>
                  <CardDescription className="text-xs">PBKDF2 100,000 iterations (SHA-256)</CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader className="p-4">
                  <span className="text-xs font-mono text-primary font-semibold">STEP 03</span>
                  <CardTitle className="text-sm">Unwrap VEK</CardTitle>
                  <CardDescription className="text-xs">Vault Encryption Key (256-bit)</CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader className="p-4">
                  <span className="text-xs font-mono text-primary font-semibold">STEP 04</span>
                  <CardTitle className="text-sm">AES-GCM 256</CardTitle>
                  <CardDescription className="text-xs">Authenticated payload encryption</CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader className="p-4">
                  <span className="text-xs font-mono text-primary font-semibold">STEP 05</span>
                  <CardTitle className="text-sm">Local Storage</CardTitle>
                  <CardDescription className="text-xs">Encrypted payload saved in IndexedDB</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <Link href="/security">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <span>View Technical Cryptographic Details</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* COMPLETE LOCAL SECURITY TOOLKIT */}
        <section className="py-20 border-t border-border-subtle">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                Unified Capabilities
              </Badge>
              <h2 className="text-heading text-2xl sm:text-3xl font-semibold mb-3">
                A Complete Local Security Toolkit
              </h2>
              <p className="text-caption sm:text-sm text-muted-foreground">
                Everything you need for credential hygiene and private authentication in a single lightweight application.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-surface border-border-subtle">
                <CardHeader>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <KeyRound className="size-4" />
                  </div>
                  <CardTitle className="text-base">Password Vault</CardTitle>
                  <CardDescription>
                    Store passwords, usernames, URLs, categories, custom tags, and private notes with instant search.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <QrCode className="size-4" />
                  </div>
                  <CardTitle className="text-base">2FA TOTP Authenticator</CardTitle>
                  <CardDescription>
                    RFC 6238 time-based one-time passcodes with circular countdowns and 1-click clipboard auto-copy.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Activity className="size-4" />
                  </div>
                  <CardTitle className="text-base">Security Health Audit</CardTitle>
                  <CardDescription>
                    Local password strength scoring, reused password detection, and k-Anonymity dark web breach checking.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Database className="size-4" />
                  </div>
                  <CardTitle className="text-base">Import & Export</CardTitle>
                  <CardDescription>
                    Multi-format parser for Chrome, Bitwarden, 1Password, and CSV with conflict resolution preview.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Bookmark className="size-4" />
                  </div>
                  <CardTitle className="text-base">Encrypted Bookmarks</CardTitle>
                  <CardDescription>
                    Keep private bookmarks organized alongside your credentials with seamless bidirectional association.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-surface border-border-subtle">
                <CardHeader>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Fingerprint className="size-4" />
                  </div>
                  <CardTitle className="text-base">Passkeys & WebAuthn</CardTitle>
                  <CardDescription>
                    Hardware-bound biometric unlock via Touch ID, Windows Hello, or FIDO2 security keys via PRF.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* WHAT WE DON'T NEED (ZERO CUSTODY) */}
        <section className="border-t border-border-subtle bg-surface/30 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                Zero Custody Guarantee
              </Badge>
              <h2 className="text-heading text-2xl sm:text-3xl font-semibold mb-3">
                What We Don&apos;t Need to Protect Your Vault
              </h2>
              <p className="text-caption sm:text-sm text-muted-foreground">
                Our architecture is designed so that we never have custody of your credentials.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-5 rounded-xl border border-border-subtle bg-surface space-y-2">
                <div className="size-7 rounded bg-destructive/10 text-destructive font-bold flex items-center justify-center text-xs">
                  ✕
                </div>
                <h3 className="text-sm font-semibold">No Plaintext Database</h3>
                <p className="text-xs text-muted-foreground">
                  We operate no server-side password repository or remote storage.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border-subtle bg-surface space-y-2">
                <div className="size-7 rounded bg-destructive/10 text-destructive font-bold flex items-center justify-center text-xs">
                  ✕
                </div>
                <h3 className="text-sm font-semibold">No Master Password Storage</h3>
                <p className="text-xs text-muted-foreground">
                  Your master password stays exclusively on your local hardware.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border-subtle bg-surface space-y-2">
                <div className="size-7 rounded bg-destructive/10 text-destructive font-bold flex items-center justify-center text-xs">
                  ✕
                </div>
                <h3 className="text-sm font-semibold">No Mandatory Cloud Account</h3>
                <p className="text-xs text-muted-foreground">
                  No registration, email validation, or credit card required for local use.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border-subtle bg-surface space-y-2">
                <div className="size-7 rounded bg-destructive/10 text-destructive font-bold flex items-center justify-center text-xs">
                  ✕
                </div>
                <h3 className="text-sm font-semibold">No Analytics Trackers</h3>
                <p className="text-xs text-muted-foreground">
                  Zero third-party telemetry, behavioral tracking, or pixel beacons.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section className="py-20 border-t border-border-subtle">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-heading text-2xl sm:text-3xl font-semibold mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-caption sm:text-sm text-muted-foreground">
                Clear, transparent answers about Lokker architecture, cryptography, and privacy.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-border-subtle bg-surface overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium hover:bg-surface-hover transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="size-4 text-muted-foreground shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0 ml-2" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border-subtle/50 bg-background/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section className="border-t border-border-subtle bg-surface/50 py-20 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-heading text-3xl font-semibold mb-4">
              Your credentials belong to you.
            </h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-xl mx-auto text-pretty">
              Start with a private, local-first password vault. No cloud accounts, zero subscription fees, and complete cryptographic control.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/app">
                <Button size="lg" className="h-11 px-8 gap-2 font-medium shadow-sm">
                  <span>Open Lokker Vault</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="h-11 px-6 font-medium shadow-xs">
                  Explore Features
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

"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Flame,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  Eye,
  Clock,
  Sparkles,
  ArrowRight,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";
import { fetchAndDecryptSecret, DecryptedSecretResult } from "@/lib/secret-sharing";

type ViewState = "LOADING" | "MISSING_KEY" | "READY" | "DECRYPTING" | "REVEALED" | "ERROR";

export default function SharedSecretPage() {
  const params = useParams();
  const secretId = typeof params?.id === "string" ? params.id : "";

  const [state, setState] = React.useState<ViewState>("LOADING");
  const [key, setKey] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const [decryptedData, setDecryptedData] = React.useState<DecryptedSecretResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Extract decryption key from URL hash fragment on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      setState("MISSING_KEY");
      return;
    }

    // Support both #key=XYZ and #XYZ
    const keyMatch = hash.match(/key=([^&]+)/);
    const extractedKey = keyMatch ? keyMatch[1] : hash;

    if (!extractedKey) {
      setState("MISSING_KEY");
      return;
    }

    setKey(extractedKey);
    setState("READY");
  }, []);

  const handleReveal = async () => {
    if (!secretId || !key) return;

    setState("DECRYPTING");
    setErrorMsg("");

    try {
      const result = await fetchAndDecryptSecret(secretId, key);
      setDecryptedData(result);
      setState("REVEALED");
    } catch (err: any) {
      console.error("Failed to decrypt secret:", err);
      setErrorMsg(
        err?.message ||
          "This secret link does not exist, has expired, or has already reached its view limit."
      );
      setState("ERROR");
    }
  };

  const handleCopy = async () => {
    if (!decryptedData?.secret) return;
    await navigator.clipboard?.writeText(decryptedData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <LokkerBrandIcon size="md" />
            <span className="font-heading font-bold text-lg tracking-tight text-foreground">
              Lokker
            </span>
          </Link>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Zero-Knowledge Secure Link</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="p-6 rounded-2xl border border-border-subtle bg-surface shadow-md space-y-5">
          {state === "LOADING" && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="size-6 animate-spin text-primary" />
              <p className="text-xs">Preparing secure environment...</p>
            </div>
          )}

          {state === "MISSING_KEY" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 shrink-0 text-amber-400" />
                  <h2 className="text-sm font-semibold">Missing Decryption Key</h2>
                </div>
                <p className="text-xs leading-relaxed text-amber-200/90">
                  The zero-knowledge decryption key was not found in the URL. Decryption keys reside
                  strictly in the URL hash fragment (
                  <span className="font-mono font-medium">#key=...</span>) and never touch the
                  server.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Please check the link you received and ensure the entire URL, including the{" "}
                <span className="font-mono text-foreground font-semibold">#</span> portion, was
                copied.
              </p>
            </div>
          )}

          {state === "READY" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border-subtle bg-background">
                <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Lock className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-foreground">Encrypted Secret Waiting</h2>
                  <p className="text-xs text-muted-foreground truncate">
                    End-to-end encrypted with AES-GCM-256
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-amber-400 font-medium">
                  <Flame className="size-4" />
                  <span>Burn on Read Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Clicking reveal will fetch the encrypted ciphertext from the server and decrypt it
                  locally in your browser. If this secret is configured for single-use, it will be{" "}
                  <strong className="text-foreground font-semibold">permanently destroyed</strong>{" "}
                  from the server immediately.
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleReveal}
                className="w-full text-xs font-semibold gap-2 cursor-pointer"
              >
                <Eye className="size-4" />
                <span>Reveal Secret</span>
              </Button>
            </div>
          )}

          {state === "DECRYPTING" && (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="size-6 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-foreground">Decrypting Secret Payload</p>
                <p className="text-[11px] text-muted-foreground">
                  Using ephemeral key directly inside your browser...
                </p>
              </div>
            </div>
          )}

          {state === "REVEALED" && decryptedData && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Destruction Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {decryptedData.burned ? (
                    <Badge variant="destructive" className="gap-1 text-[10px]">
                      <Flame className="size-3 text-amber-300" />
                      <span>Permanently Burned</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Eye className="size-3" />
                      <span>{decryptedData.viewsRemaining} views left</span>
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  <span>
                    Expires {new Date(decryptedData.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {decryptedData.title && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Title / Context
                  </span>
                  <p className="text-sm font-semibold text-foreground">{decryptedData.title}</p>
                </div>
              )}

              {/* Secret Display Box */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Secret Content
                </span>
                <div className="relative group">
                  <pre className="p-3.5 rounded-xl border border-border-subtle bg-background font-mono text-xs text-foreground whitespace-pre-wrap break-all select-all max-h-60 overflow-y-auto">
                    {decryptedData.secret}
                  </pre>
                </div>
              </div>

              <Button
                onClick={handleCopy}
                className="w-full text-xs font-semibold gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-emerald-400" />
                    <span>Secret Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    <span>Copy Secret</span>
                  </>
                )}
              </Button>

              {decryptedData.burned && (
                <p className="text-[11px] text-center text-muted-foreground leading-relaxed pt-1">
                  🔥 This secret has been erased from the server. Once you close or reload this page,
                  it will be gone forever.
                </p>
              )}
            </div>
          )}

          {state === "ERROR" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-rose-400" />
                  <h2 className="text-sm font-semibold">Secret Unavailable or Burned</h2>
                </div>
                <p className="text-xs leading-relaxed text-rose-200/90">{errorMsg}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                The link may have expired or already been opened and burned by the recipient.
              </p>
              <Button asChild variant="outline" className="w-full text-xs">
                <Link href="/">Back to Lokker</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Zero-knowledge link generated with{" "}
            <Link href="/" className="text-primary hover:underline font-medium">
              Lokker Vault
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

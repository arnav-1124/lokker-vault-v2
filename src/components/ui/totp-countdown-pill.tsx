"use client";

import * as React from "react";
import { Copy, Check, AlertCircle, QrCode } from "lucide-react";
import { generateTOTPCode } from "@/lib/totp";

interface TotpCountdownPillProps {
  secret?: string;
  onCopy?: (code: string) => void;
  className?: string;
}

export function TotpCountdownPill({ secret, onCopy, className = "" }: TotpCountdownPillProps) {
  const [code, setCode] = React.useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(30);
  const [isCopied, setIsCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!secret || secret.trim().length === 0) {
      setCode("");
      setError(null);
      return;
    }

    let isMounted = true;

    const updateCode = async () => {
      try {
        const res = await generateTOTPCode(secret);
        if (isMounted) {
          setCode(res.code);
          setSecondsRemaining(res.secondsRemaining);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setCode("");
          setError(err?.userMessage || "Invalid 2FA secret");
        }
      }
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [secret]);

  if (!secret || secret.trim().length === 0) return null;

  if (error) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}
        title={error}
      >
        <AlertCircle className="size-3 text-rose-400 shrink-0" />
        <span>2FA Secret Error</span>
      </span>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setIsCopied(true);
    onCopy?.(code);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Circular ring math
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius; // ~40.84
  const progress = Math.max(0, Math.min(30, secondsRemaining)) / 30;
  const strokeDashoffset = circumference * (1 - progress);

  const urgencyColor =
    secondsRemaining <= 3
      ? "stroke-rose-500 text-rose-400"
      : secondsRemaining <= 7
      ? "stroke-amber-400 text-amber-400"
      : "stroke-primary text-primary";

  const formattedCode =
    code.length >= 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Click to copy 2FA code (${secondsRemaining}s remaining)`}
      className={`group relative inline-flex items-center gap-2 px-2 py-0.5 rounded-lg bg-surface-elevated/80 hover:bg-surface-elevated border border-border-subtle hover:border-primary/40 transition-all cursor-pointer select-none shrink-0 shadow-sm ${className}`}
    >
      {/* Animated SVG countdown ring */}
      <div className="relative size-4 flex items-center justify-center shrink-0">
        <svg className="size-4 -rotate-90">
          <circle
            cx="8"
            cy="8"
            r={radius}
            className="stroke-muted/30"
            strokeWidth="1.75"
            fill="none"
          />
          <circle
            cx="8"
            cy="8"
            r={radius}
            className={`${urgencyColor} transition-all duration-1000 ease-linear`}
            strokeWidth="1.75"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Code Text */}
      <span className="font-mono text-xs font-bold tracking-wider text-foreground">
        {formattedCode || "••••••"}
      </span>

      {/* Mini status indicator */}
      <div className="flex items-center text-muted-foreground group-hover:text-foreground shrink-0">
        {isCopied ? (
          <Check className="size-3 text-emerald-400" />
        ) : (
          <Copy className="size-3 opacity-60 group-hover:opacity-100" />
        )}
      </div>
    </button>
  );
}

"use client";

import * as React from "react";
import { ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { BreachStatus } from "@/hooks/use-breach-check";

interface BreachBadgeProps {
  status: BreachStatus;
  count: number;
  error?: string;
  compact?: boolean;
  className?: string;
}

export function BreachBadge({
  status,
  count,
  error,
  compact = false,
  className = "",
}: BreachBadgeProps) {
  if (status === "idle") return null;

  if (compact) {
    if (status === "checking") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted/20 border border-border-subtle shrink-0 ${className}`}
          title="Checking HaveIBeenPwned database..."
        >
          <RefreshCw className="size-2.5 animate-spin text-primary shrink-0" />
          <span>Checking...</span>
        </span>
      );
    }

    if (status === "breached") {
      const formatted =
        count > 999999
          ? `${(count / 1000000).toFixed(1)}M`
          : count > 999
          ? `${Math.round(count / 1000)}k`
          : count.toString();

      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0 cursor-help ${className}`}
          title={`Compromised in ${count.toLocaleString()} public data breaches (HaveIBeenPwned)`}
        >
          <ShieldAlert className="size-3 text-rose-400 shrink-0" />
          <span>Breached ({formatted})</span>
        </span>
      );
    }

    if (status === "clean") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 cursor-help ${className}`}
          title="Zero-Knowledge verified: Never seen in public data breaches"
        >
          <ShieldCheck className="size-3 text-emerald-400 shrink-0" />
          <span>Clean</span>
        </span>
      );
    }

    return null;
  }

  // Full detail mode (for modals and drawers)
  if (status === "checking") {
    return (
      <div
        className={`flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 ${className}`}
      >
        <RefreshCw className="size-3 text-primary animate-spin shrink-0" />
        <span>Checking breach databases with zero-knowledge k-anonymity...</span>
      </div>
    );
  }

  if (status === "breached") {
    return (
      <div
        className={`flex items-start gap-2.5 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs animate-in fade-in-50 duration-200 ${className}`}
      >
        <ShieldAlert className="size-4 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-rose-400">
            <span>Compromised in {count.toLocaleString()} known data breaches!</span>
          </div>
          <p className="text-[11px] text-rose-300/80 leading-relaxed">
            This password has appeared in public breach databases and is vulnerable to automated
            credential stuffing attacks. We strongly recommend generating a unique replacement.
          </p>
        </div>
      </div>
    );
  }

  if (status === "clean") {
    return (
      <div
        className={`flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1 animate-in fade-in-50 duration-200 ${className}`}
      >
        <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
        <span className="font-medium">Never seen in public breaches</span>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
          k-Anonymity Verified
        </span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={`flex items-center gap-1.5 text-[10px] text-muted-foreground/70 pt-0.5 ${className}`}
      >
        <AlertTriangle className="size-3 text-muted-foreground/60 shrink-0" />
        <span>Breach database currently unreachable (offline)</span>
      </div>
    );
  }

  return null;
}

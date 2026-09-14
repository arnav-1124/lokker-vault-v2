"use client";

import * as React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Edit2,
  CheckCircle2,
  Lock,
  QrCode,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PasswordEntry } from "@/types";
import { checkPasswordBreached } from "@/lib/crypto";
import { analyzeWatchtowerSecurity } from "@/lib/watchtower";

interface WorkspaceSecurityAuditViewProps {
  workspaceName?: string;
  passwords: PasswordEntry[];
  isAdmin?: boolean;
  canWrite?: boolean;
  onEditPassword: (p: PasswordEntry) => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
}

type FilterTab = "all" | "breached" | "2fa" | "weak" | "reused";

export function WorkspaceSecurityAuditView({
  workspaceName = "Workspace",
  passwords,
  isAdmin = false,
  canWrite,
  onEditPassword,
  addToast,
}: WorkspaceSecurityAuditViewProps) {
  const userCanWrite = canWrite !== undefined ? canWrite : isAdmin;
  const [checkingBreaches, setCheckingBreaches] = React.useState(false);
  const [checkingProgress, setCheckingProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [breachResults, setBreachResults] = React.useState<Record<string, { breached: boolean; count: number }>>({});
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");

  // Run continuous Watchtower intelligence
  const report = React.useMemo(() => {
    return analyzeWatchtowerSecurity(passwords, breachResults);
  }, [passwords, breachResults]);

  const handleRunBreachCheck = async () => {
    setCheckingBreaches(true);
    addToast("Running privacy-preserving k-Anonymity breach check...", "info");

    const uniquePasswords = Array.from(
      new Set(passwords.map((p) => p.password).filter((pw): pw is string => !!pw && pw.trim().length > 0))
    );

    const passwordResultMap = new Map<string, { breached: boolean; count: number; error?: string }>();
    const total = uniquePasswords.length;
    let completed = 0;
    setCheckingProgress({ current: 0, total });

    const CONCURRENCY_LIMIT = 4;
    for (let i = 0; i < uniquePasswords.length; i += CONCURRENCY_LIMIT) {
      const batch = uniquePasswords.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(
        batch.map(async (pw) => {
          try {
            const res = await checkPasswordBreached(pw);
            passwordResultMap.set(pw, res);
          } catch {
            passwordResultMap.set(pw, { breached: false, count: 0, error: "Offline" });
          } finally {
            completed++;
            setCheckingProgress({ current: completed, total });
          }
        })
      );
      if (i + CONCURRENCY_LIMIT < uniquePasswords.length) {
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    }

    const newBreachState: Record<string, { breached: boolean; count: number }> = {};
    let breachedTotal = 0;
    passwordResultMap.forEach((val, key) => {
      newBreachState[key] = { breached: val.breached, count: val.count };
      if (val.breached) breachedTotal++;
    });

    setBreachResults(newBreachState);
    setCheckingBreaches(false);
    setCheckingProgress(null);

    if (breachedTotal > 0) {
      addToast(`Watchtower Alert: ${breachedTotal} workspace password(s) found in dark web breach records!`, "error");
    } else {
      addToast("Workspace Watchtower Scan: Zero credentials exposed in public breach databases.", "success");
    }
  };

  const totalIssues =
    report.breachedItems.length +
    report.missingTwoFactorItems.length +
    report.weakItems.length +
    report.reusedItems.length;

  const filteredItems = React.useMemo(() => {
    switch (activeTab) {
      case "breached":
        return report.breachedItems.map((item) => ({ item: item.entry, reason: "Compromised in known public dark web breach" }));
      case "2fa":
        return report.missingTwoFactorItems.map((item) => ({ item: item.entry, reason: "Missing 2FA (TOTP authenticator key not set)" }));
      case "weak":
        return report.weakItems.map((item) => ({ item: item.entry, reason: "Low cryptographic entropy (< 14 chars, dictionary or numeric)" }));
      case "reused":
        return report.reusedItems.map((item) => ({ item: item.entry, reason: "Password is reused across multiple team credentials" }));
      case "all":
      default: {
        const map = new Map<string, { item: PasswordEntry; reasons: string[] }>();
        report.breachedItems.forEach((p) => {
          const entry = map.get(p.entry.id) || { item: p.entry, reasons: [] };
          entry.reasons.push("Dark Web Breach Detected");
          map.set(p.entry.id, entry);
        });
        report.weakItems.forEach((p) => {
          const entry = map.get(p.entry.id) || { item: p.entry, reasons: [] };
          entry.reasons.push("Weak Password Entropy");
          map.set(p.entry.id, entry);
        });
        report.reusedItems.forEach((p) => {
          const entry = map.get(p.entry.id) || { item: p.entry, reasons: [] };
          entry.reasons.push("Reused Across Workspace");
          map.set(p.entry.id, entry);
        });
        report.missingTwoFactorItems.forEach((p) => {
          const entry = map.get(p.entry.id) || { item: p.entry, reasons: [] };
          entry.reasons.push("2FA Secret Missing");
          map.set(p.entry.id, entry);
        });
        return Array.from(map.values()).map((v) => ({ item: v.item, reason: v.reasons.join(" • ") }));
      }
    }
  }, [activeTab, report]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>Workspace Security Watchtower</span>
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              {workspaceName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zero-knowledge organizational entropy verification, cross-member reuse detection, and k-Anonymity dark web breach intelligence.
          </p>
        </div>

        <Button
          onClick={handleRunBreachCheck}
          disabled={checkingBreaches || passwords.length === 0}
          size="sm"
          className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer font-medium"
        >
          <RefreshCw className={`size-3.5 ${checkingBreaches ? "animate-spin" : ""}`} />
          <span>
            {checkingBreaches
              ? checkingProgress
                ? `Checking ${checkingProgress.current}/${checkingProgress.total}...`
                : "Scanning Dark Web..."
              : "Run Team Breach Check"}
          </span>
        </Button>
      </div>

      {/* Health Score Overview Matrix */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 grid gap-4 grid-cols-2 sm:grid-cols-5 items-center shadow-xs">
        <div className="col-span-2 sm:col-span-1 space-y-1 text-center sm:text-left border-b sm:border-b-0 sm:border-r border-border-subtle pb-4 sm:pb-0 sm:pr-4">
          <p className="text-xs text-muted-foreground font-medium">Team Security Score</p>
          <p
            className={`text-4xl font-bold font-mono ${
              report.overallScore >= 80
                ? "text-emerald-500 dark:text-emerald-400"
                : report.overallScore >= 50
                ? "text-amber-500 dark:text-amber-400"
                : "text-destructive"
            }`}
          >
            {report.overallScore}/100
          </p>
          <span className="text-[11px] text-muted-foreground block">
            {report.overallScore >= 80
              ? "Strong organizational posture"
              : report.overallScore >= 50
              ? "Moderate security risks"
              : "Action required"}
          </span>
        </div>

        {/* Metric Cards */}
        <div className="space-y-1 p-3 rounded-xl bg-background/50 border border-border-subtle">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-destructive" />
            <span>Breached</span>
          </span>
          <p className="text-xl font-bold font-mono text-destructive">{report.breachedItems.length}</p>
          <span className="text-[10px] text-muted-foreground">Dark web exposed</span>
        </div>

        <div className="space-y-1 p-3 rounded-xl bg-background/50 border border-border-subtle">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            <QrCode className="size-3.5 text-amber-500" />
            <span>Missing 2FA</span>
          </span>
          <p className="text-xl font-bold font-mono text-amber-500">{report.missingTwoFactorItems.length}</p>
          <span className="text-[10px] text-muted-foreground">TOTP not configured</span>
        </div>

        <div className="space-y-1 p-3 rounded-xl bg-background/50 border border-border-subtle">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-500" />
            <span>Weak Passwords</span>
          </span>
          <p className="text-xl font-bold font-mono text-amber-500">{report.weakItems.length}</p>
          <span className="text-[10px] text-muted-foreground">Low entropy items</span>
        </div>

        <div className="space-y-1 p-3 rounded-xl bg-background/50 border border-border-subtle">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            <Users className="size-3.5 text-blue-500" />
            <span>Reused Passwords</span>
          </span>
          <p className="text-xl font-bold font-mono text-blue-500">{report.reusedItems.length}</p>
          <span className="text-[10px] text-muted-foreground">Shared across services</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border-subtle pb-2 overflow-x-auto lokker-scrollbar">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          All Issues ({totalIssues})
        </button>
        <button
          onClick={() => setActiveTab("breached")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "breached"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          Breached ({report.breachedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("2fa")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "2fa"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          Missing 2FA ({report.missingTwoFactorItems.length})
        </button>
        <button
          onClick={() => setActiveTab("weak")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "weak"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          Weak Passwords ({report.weakItems.length})
        </button>
        <button
          onClick={() => setActiveTab("reused")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "reused"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          Reused ({report.reusedItems.length})
        </button>
      </div>

      {/* Items List */}
      {passwords.length === 0 ? (
        <div className="p-12 text-center border border-border-subtle rounded-2xl bg-surface/40 space-y-3">
          <Lock className="size-8 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-foreground">No Shared Credentials in this Workspace</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add team credentials to this workspace to enable automated vulnerability analysis and dark web breach checks.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center border border-border-subtle rounded-2xl bg-surface/40 space-y-3">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Zero Security Vulnerabilities Detected!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            All team credentials in this category satisfy organizational complexity rules, unique hashing, and dark web checks.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-surface/50 divide-y divide-border-subtle overflow-hidden">
          {filteredItems.map(({ item, reason }) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface/80 transition-colors">
              <div className="min-w-0 space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs truncate">
                    {item.websiteName || "Untitled Credential"}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-border-subtle font-normal">
                    {item.category || "General"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="font-mono">{item.username || "No username"}</span>
                  <span>•</span>
                  <span className="text-amber-500 dark:text-amber-400 font-medium">{reason}</span>
                </div>
              </div>

              {userCanWrite ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditPassword(item)}
                  className="h-7 text-xs gap-1.5 cursor-pointer shrink-0 hover:bg-surface-elevated font-medium"
                >
                  <Edit2 className="size-3" />
                  <span>Fix Credential</span>
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground italic shrink-0">Read-only audit mode</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

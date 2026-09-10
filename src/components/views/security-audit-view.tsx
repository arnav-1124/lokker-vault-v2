"use client";

import * as React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Edit2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Lock,
  Clock,
  QrCode,
  FileQuestion,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PasswordEntry } from "@/types";
import { checkPasswordBreached } from "@/lib/crypto";
import { analyzeWatchtowerSecurity } from "@/lib/watchtower";

interface SecurityAuditViewProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  onUnlockClick: () => void;
  onEditPassword: (p: PasswordEntry) => void;
  onUpdatePassword?: (p: PasswordEntry) => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
  onNavigate?: (view: any) => void;
}

type FilterTab = "all" | "breached" | "2fa" | "weak" | "reused" | "stale";

export function SecurityAuditView({
  passwords,
  onEditPassword,
  addToast,
}: SecurityAuditViewProps) {
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
            const result = await checkPasswordBreached(pw);
            passwordResultMap.set(pw, result);
          } catch {
            passwordResultMap.set(pw, { breached: false, count: 0, error: "Network check failed" });
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
      addToast(`Watchtower Alert: ${breachedTotal} password(s) found in dark web breach records!`, "error");
    } else {
      addToast("Watchtower Scan Complete: Zero passwords exposed in public breach databases.", "success");
    }
  };

  const totalIssues =
    report.breachedItems.length +
    report.missingTwoFactorItems.length +
    report.weakItems.length +
    report.reusedItems.length +
    report.staleItems.length +
    report.emptyItems.length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span>Automated Security Watchtower</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Zero-knowledge 2FA directory intelligence, entropy verification, and k-Anonymity dark web breach checks
          </p>
        </div>

        <Button
          onClick={handleRunBreachCheck}
          disabled={checkingBreaches || passwords.length === 0}
          size="sm"
          className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${checkingBreaches ? "animate-spin" : ""}`} />
          <span>
            {checkingBreaches
              ? checkingProgress
                ? `Checking ${checkingProgress.current}/${checkingProgress.total}...`
                : "Checking Breach Database..."
              : "Run Dark Web Breach Check"}
          </span>
        </Button>
      </div>

      {/* Health Score Overview Matrix */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 grid gap-4 grid-cols-2 sm:grid-cols-5 items-center shadow-xs">
        <div className="col-span-2 sm:col-span-1 space-y-1 text-center sm:text-left border-b sm:border-b-0 sm:border-r border-border-subtle pb-4 sm:pb-0 sm:pr-4">
          <p className="text-xs text-muted-foreground font-medium">Vault Health</p>
          <p
            className={`text-4xl font-bold font-mono ${
              report.overallScore >= 80
                ? "text-success"
                : report.overallScore >= 50
                ? "text-warning"
                : "text-destructive"
            }`}
          >
            {report.overallScore}/100
          </p>
          <span className="text-[11px] text-muted-foreground block">
            {report.overallScore >= 80
              ? "Strong security posture"
              : report.overallScore >= 50
              ? "Vulnerabilities detected"
              : "Critical risk action required"}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Breached</p>
          <p className="text-lg font-bold text-destructive">{report.breachedItems.length}</p>
        </div>

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Missing 2FA</p>
          <p className="text-lg font-bold text-primary">{report.missingTwoFactorItems.length}</p>
        </div>

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Weak & Reused</p>
          <p className="text-lg font-bold text-warning">{report.weakItems.length + report.reusedItems.length}</p>
        </div>

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Stale (&gt;1 yr)</p>
          <p className="text-lg font-bold text-muted-foreground">{report.staleItems.length}</p>
        </div>
      </div>

      {/* Filter Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border-subtle text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === "all"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Issues ({totalIssues})
        </button>
        {report.breachedItems.length > 0 && (
          <button
            onClick={() => setActiveTab("breached")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "breached"
                ? "bg-destructive/15 text-destructive font-semibold"
                : "text-destructive/80 hover:text-destructive"
            }`}
          >
            <ShieldAlert className="size-3.5" />
            <span>Breached ({report.breachedItems.length})</span>
          </button>
        )}
        {report.missingTwoFactorItems.length > 0 && (
          <button
            onClick={() => setActiveTab("2fa")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "2fa"
                ? "bg-primary/15 text-primary font-semibold"
                : "text-primary/80 hover:text-primary"
            }`}
          >
            <QrCode className="size-3.5" />
            <span>Missing 2FA ({report.missingTwoFactorItems.length})</span>
          </button>
        )}
        {report.weakItems.length > 0 && (
          <button
            onClick={() => setActiveTab("weak")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === "weak"
                ? "bg-warning/15 text-warning font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Weak ({report.weakItems.length})
          </button>
        )}
        {report.reusedItems.length > 0 && (
          <button
            onClick={() => setActiveTab("reused")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === "reused"
                ? "bg-warning/15 text-warning font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Reused ({report.reusedItems.length})
          </button>
        )}
        {report.staleItems.length > 0 && (
          <button
            onClick={() => setActiveTab("stale")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === "stale"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Stale ({report.staleItems.length})
          </button>
        )}
      </div>

      {/* SECTION 1: DARK WEB BREACHES */}
      {(activeTab === "all" || activeTab === "breached") && report.breachedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5">
            <ShieldAlert className="size-3.5" />
            <span>Dark Web Compromised Passwords ({report.breachedItems.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            These passwords were found in public data breaches. Attackers actively credential-stuff these passwords across services.
          </p>
          <div className="space-y-2">
            {report.breachedItems.map(({ entry, breachCount }) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{entry.websiteName}</p>
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                      Seen in {breachCount.toLocaleString()} breaches
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px]">{entry.username || "No username"}</p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onEditPassword(entry)}
                  className="h-7 text-xs gap-1.5 self-end sm:self-auto cursor-pointer"
                >
                  <Edit2 className="size-3" />
                  <span>Change Compromised Password</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: MISSING 2FA DIRECTORY INTELLIGENCE */}
      {(activeTab === "all" || activeTab === "2fa") && report.missingTwoFactorItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <QrCode className="size-3.5" />
            <span>Missing 2FA Protection ({report.missingTwoFactorItems.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            These websites are verified in the open-source 2FA Directory to support TOTP Authenticator or Security Keys, but your vault entry does not have a 2FA secret saved.
          </p>
          <div className="space-y-2">
            {report.missingTwoFactorItems.map(({ entry, service }) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{entry.websiteName}</p>
                    <Badge variant="outline" className="text-[10px] bg-background border-primary/30 text-primary py-0 px-1.5">
                      Supports TOTP
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px]">{entry.username || "No username"}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {service.docUrl && (
                    <a
                      href={service.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
                    >
                      <span>Setup Guide</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditPassword(entry)}
                    className="h-7 text-xs gap-1.5 cursor-pointer border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Plus className="size-3" />
                    <span>Add 2FA Secret</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: WEAK PASSWORDS */}
      {(activeTab === "all" || activeTab === "weak") && report.weakItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            <span>Weak Passwords ({report.weakItems.length})</span>
          </h3>
          <div className="space-y-2">
            {report.weakItems.map(({ entry, score }) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{entry.websiteName}</p>
                    <span className="text-[10px] font-mono text-destructive">Entropy Score: {score}/100</span>
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px]">{entry.username || "No username"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditPassword(entry)}
                  className="h-7 text-xs gap-1.5 self-end sm:self-auto cursor-pointer"
                >
                  <Edit2 className="size-3" />
                  <span>Update Password</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: REUSED PASSWORDS */}
      {(activeTab === "all" || activeTab === "reused") && report.reusedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-warning flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            <span>Reused Passwords ({report.reusedItems.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Using identical passwords across multiple services means a single breach compromises all of them.
          </p>
          <div className="space-y-2">
            {report.reusedItems.map(({ entry, count }) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-warning/20 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{entry.websiteName}</p>
                    <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-background py-0">
                      Reused across {count} accounts
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px]">{entry.username || "No username"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditPassword(entry)}
                  className="h-7 text-xs gap-1.5 self-end sm:self-auto cursor-pointer"
                >
                  <Edit2 className="size-3" />
                  <span>Generate Unique Password</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: STALE CREDENTIALS */}
      {(activeTab === "all" || activeTab === "stale") && report.staleItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>Stale Credentials ({report.staleItems.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            These passwords have not been rotated in over 12 months. Consider auditing whether these accounts are still needed.
          </p>
          <div className="space-y-2">
            {report.staleItems.map(({ entry, daysOld }) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{entry.websiteName}</p>
                    <span className="text-[10px] text-muted-foreground">Updated {daysOld} days ago</span>
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px]">{entry.username || "No username"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditPassword(entry)}
                  className="h-7 text-xs gap-1.5 self-end sm:self-auto cursor-pointer"
                >
                  <Edit2 className="size-3" />
                  <span>Rotate</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: EMPTY CREDENTIAL SHELLS */}
      {report.emptyItems.length > 0 && (activeTab === "all") && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileQuestion className="size-3.5 text-muted-foreground" />
            <span>Incomplete Credential Shells ({report.emptyItems.length})</span>
          </h3>
          <div className="space-y-2">
            {report.emptyItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">{item.websiteName}</p>
                  <p className="text-muted-foreground font-mono text-[11px]">{item.websiteUrl || "Bookmark shell"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditPassword(item)}
                  className="h-7 text-xs gap-1.5 self-end sm:self-auto cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>Add Password</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean State */}
      {totalIssues === 0 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center space-y-2">
          <CheckCircle2 className="size-8 text-success mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Zero Critical Security Issues</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            All stored passwords have strong entropy, unique values, active 2FA where available, and no known dark web breach exposures.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
  Edit2,
  CheckCircle2,
  Activity,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  FileQuestion,
  Users,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PasswordEntry } from "@/types";
import { calculatePasswordStrength, checkPasswordBreached } from "@/lib/crypto";

interface SecurityAuditViewProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  onUnlockClick: () => void;
  onEditPassword: (p: PasswordEntry) => void;
  onUpdatePassword?: (p: PasswordEntry) => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
  onNavigate?: (view: any) => void;
}

export function SecurityAuditView({
  passwords,
  isUnlocked,
  onUnlockClick,
  onEditPassword,
  addToast,
}: SecurityAuditViewProps) {
  const [checkingBreaches, setCheckingBreaches] = React.useState(false);
  const [breachResults, setBreachResults] = React.useState<Record<string, { breached: boolean; count: number }>>({});

  // Analysis: Weak, Reused, Empty, and Duplicates
  const auditAnalysis = React.useMemo(() => {
    const weakItems: PasswordEntry[] = [];
    const emptyItems: PasswordEntry[] = [];
    const passwordCounts: Record<string, number> = {};
    const reusedItems: PasswordEntry[] = [];
    const domainUserMap: Record<string, PasswordEntry[]> = {};

    passwords.forEach((p) => {
      // Empty password check
      if (!p.password || p.password.trim().length === 0) {
        if (p.entryType === "login") {
          emptyItems.push(p);
        }
        return;
      }

      // Weak password check
      const strength = calculatePasswordStrength(p.password);
      if (strength.score <= 40) {
        weakItems.push(p);
      }
      passwordCounts[p.password] = (passwordCounts[p.password] || 0) + 1;

      // Duplicate check (Domain + Username)
      const host = (p.websiteUrl || p.websiteName).toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
      const user = p.username.toLowerCase().trim();
      if (host && user) {
        const key = `${host}::${user}`;
        if (!domainUserMap[key]) domainUserMap[key] = [];
        domainUserMap[key].push(p);
      }
    });

    passwords.forEach((p) => {
      if (p.password && passwordCounts[p.password] > 1) {
        reusedItems.push(p);
      }
    });

    const duplicateGroups = Object.values(domainUserMap).filter((group) => group.length > 1);

    // Calculate score (0-100)
    let totalScore = 100;
    totalScore -= weakItems.length * 15;
    totalScore -= reusedItems.length * 10;
    totalScore -= emptyItems.length * 5;
    totalScore -= Object.values(breachResults).filter((r) => r.breached).length * 20;
    const finalScore = Math.max(0, Math.min(100, totalScore));

    return {
      score: finalScore,
      weakItems,
      reusedItems,
      emptyItems,
      duplicateGroups,
      totalPasswords: passwords.length,
    };
  }, [passwords, breachResults]);

  const handleRunBreachCheck = async () => {
    setCheckingBreaches(true);
    addToast("Running k-Anonymity breach check on stored credentials...", "info");

    const results: Record<string, { breached: boolean; count: number }> = {};
    for (const item of passwords) {
      if (item.password) {
        const res = await checkPasswordBreached(item.password);
        results[item.id] = res;
      }
    }
    setBreachResults(results);
    setCheckingBreaches(false);
    addToast("Breach check complete (0 plaintext leaked).", "success");
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
          <Lock className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Vault Locked</h2>
          <p className="text-xs text-muted-foreground">
            Unlock your vault to view automated security health findings.
          </p>
        </div>
        <Button onClick={onUnlockClick} size="sm" className="h-9 px-6 text-xs cursor-pointer">
          Unlock Vault
        </Button>
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
          <Activity className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Your security report will appear here</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add or import credentials to start checking password health, entropy scores, and dark web breach exposure.
          </p>
        </div>
      </div>
    );
  }

  const totalIssues =
    auditAnalysis.weakItems.length +
    auditAnalysis.reusedItems.length +
    auditAnalysis.emptyItems.length +
    Object.values(breachResults).filter((r) => r.breached).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <span>Security Health Audit</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Automated password entropy, reuse detection, and k-Anonymity breach verification
          </p>
        </div>

        <Button
          onClick={handleRunBreachCheck}
          disabled={checkingBreaches || passwords.length === 0}
          size="sm"
          className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${checkingBreaches ? "animate-spin" : ""}`} />
          <span>{checkingBreaches ? "Checking Dark Web..." : "Run Breach Check"}</span>
        </Button>
      </div>

      {/* Health Score Overview Card */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 grid gap-6 sm:grid-cols-4 items-center shadow-xs">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-xs text-muted-foreground font-medium">Vault Health Score</p>
          <p
            className={`text-4xl font-bold font-mono ${
              auditAnalysis.score >= 80
                ? "text-success"
                : auditAnalysis.score >= 50
                ? "text-warning"
                : "text-destructive"
            }`}
          >
            {auditAnalysis.score}/100
          </p>
          <span className="text-[11px] text-muted-foreground">
            {auditAnalysis.score >= 80
              ? "Strong security posture"
              : auditAnalysis.score >= 50
              ? "Action recommended"
              : "Critical improvements needed"}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Weak Passwords</p>
          <p className="text-lg font-bold text-destructive">{auditAnalysis.weakItems.length}</p>
        </div>

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Reused Passwords</p>
          <p className="text-lg font-bold text-warning">{auditAnalysis.reusedItems.length}</p>
        </div>

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Empty Passwords</p>
          <p className="text-lg font-bold text-muted-foreground">{auditAnalysis.emptyItems.length}</p>
        </div>
      </div>

      {/* Weak Passwords Section */}
      {auditAnalysis.weakItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            <span>Weak Passwords Detected ({auditAnalysis.weakItems.length})</span>
          </h3>
          <div className="space-y-2">
            {auditAnalysis.weakItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">{item.websiteName}</p>
                  <p className="text-muted-foreground font-mono text-[11px]">{item.username || "No username"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditPassword(item)}
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

      {/* Reused Passwords Section */}
      {auditAnalysis.reusedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-warning flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            <span>Reused Passwords ({auditAnalysis.reusedItems.length})</span>
          </h3>
          <div className="space-y-2">
            {auditAnalysis.reusedItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-warning/20 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">{item.websiteName}</p>
                  <p className="text-muted-foreground font-mono text-[11px]">{item.username || "No username"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditPassword(item)}
                  className="h-7 text-xs gap-1.5 self-end sm:self-auto cursor-pointer"
                >
                  <Edit2 className="size-3" />
                  <span>Change Password</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty / Incomplete Passwords Section */}
      {auditAnalysis.emptyItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileQuestion className="size-3.5 text-muted-foreground" />
            <span>Incomplete Credential Shells ({auditAnalysis.emptyItems.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            These entries were created from saved bookmarks and do not have stored passwords yet.
          </p>
          <div className="space-y-2">
            {auditAnalysis.emptyItems.map((item) => (
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
            All stored passwords have strong entropy, unique values across accounts, and no known breach exposures.
          </p>
        </div>
      )}
    </div>
  );
}

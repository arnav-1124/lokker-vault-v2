"use client";

import * as React from "react";
import {
  History,
  ShieldCheck,
  RefreshCw,
  Search,
  UserPlus,
  UserCheck,
  UserMinus,
  KeyRound,
  Building2,
  Settings2,
  Lock,
  Calendar,
  Clock,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  FileCode,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/workspace-context";
import { WorkspaceActivityLog } from "@/types";

type ActivityCategory = "ALL" | "VAULT" | "MEMBERS" | "WORKSPACE";

export default function WorkspaceActivityPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    fetchWorkspaceActivity,
    isAdmin,
    isAuditor,
    canViewActivity,
    isLoading: isWorkspaceLoading,
  } = useWorkspace();

  const [activities, setActivities] = React.useState<WorkspaceActivityLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filterCategory, setFilterCategory] = React.useState<ActivityCategory>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const loadActivities = React.useCallback(
    async (isManualRefresh = false) => {
      if (!activeWorkspace?.id) return;
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const data = await fetchWorkspaceActivity(activeWorkspace.id, 100, 0);
        setActivities(data);
      } catch (err: any) {
        console.error("Failed to load workspace activity:", err);
        setError(err.message || "Failed to load activity logs");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeWorkspace?.id, fetchWorkspaceActivity]
  );

  // 1-Click RFC 4180 CSV Compliance Audit Trail Exporter
  const exportCsvReport = React.useCallback(() => {
    if (!activities.length) {
      alert("No activity log entries to export.");
      return;
    }
    const headers = ["Timestamp (UTC)", "Event Action", "Actor Name", "Actor Email", "Actor User ID", "Details"];
    const rows = activities.map((act) => {
      const actorName = (act.actor?.name || "Unknown").replace(/"/g, '""');
      const actorEmail = (act.actor?.email || "").replace(/"/g, '""');
      const actorId = (act.actor?.id || act.actorUserId || "").replace(/"/g, '""');
      const details = (act.details || "").replace(/"/g, '""');
      return `"${act.createdAt}","${act.action}","${actorName}","${actorEmail}","${actorId}","${details}"`;
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (activeWorkspace?.name || "workspace").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `lokker-compliance-audit-${safeName}-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activities, activeWorkspace?.name]);

  // Structured JSON Compliance Audit Trail Exporter
  const exportJsonReport = React.useCallback(() => {
    if (!activities.length) {
      alert("No activity log entries to export.");
      return;
    }
    const report = {
      complianceReport: {
        schemaVersion: "1.0",
        format: "Lokker Workspace Immutable Compliance Audit Trail",
        complianceStandard: "SOC 2 Type II / ISO 27001 Annex A.12.4",
        workspaceId: activeWorkspace?.id,
        workspaceName: activeWorkspace?.name,
        plan: activeWorkspace?.plan,
        exportedAt: new Date().toISOString(),
        totalEventCount: activities.length,
        auditTrail: activities.map((act) => ({
          id: act.id,
          timestamp: act.createdAt,
          action: act.action,
          actor: {
            name: act.actor?.name || null,
            email: act.actor?.email || null,
            userId: act.actor?.id || act.actorUserId || null,
          },
          details: act.details,
          metadata: act.metadata,
        })),
      },
    };
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (activeWorkspace?.name || "workspace").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `lokker-compliance-audit-${safeName}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activities, activeWorkspace]);

  React.useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Filtering
  const filteredActivities = React.useMemo(() => {
    return activities.filter((act) => {
      // Category filter
      if (filterCategory === "VAULT" && act.action !== "VAULT_SYNCED") {
        return false;
      }
      if (
        filterCategory === "MEMBERS" &&
        !["MEMBER_INVITED", "MEMBER_JOINED", "MEMBER_REMOVED"].includes(act.action)
      ) {
        return false;
      }
      if (
        filterCategory === "WORKSPACE" &&
        !["WORKSPACE_CREATED", "WORKSPACE_UPDATED"].includes(act.action)
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actorName = act.actor?.name?.toLowerCase() || "";
        const actorEmail = act.actor?.email?.toLowerCase() || "";
        const details = act.details?.toLowerCase() || "";
        const action = act.action?.toLowerCase() || "";
        return (
          actorName.includes(q) ||
          actorEmail.includes(q) ||
          details.includes(q) ||
          action.includes(q)
        );
      }

      return true;
    });
  }, [activities, filterCategory, searchQuery]);

  // Visual helper for action styling
  const getActionConfig = (action: string) => {
    switch (action) {
      case "VAULT_SYNCED":
        return {
          icon: KeyRound,
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          label: "Vault Synced",
        };
      case "MEMBER_JOINED":
        return {
          icon: UserCheck,
          badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
          iconBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
          label: "Member Joined",
        };
      case "MEMBER_INVITED":
        return {
          icon: UserPlus,
          badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          label: "Invite Created",
        };
      case "MEMBER_REMOVED":
        return {
          icon: UserMinus,
          badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          iconBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          label: "Member Removed",
        };
      case "WORKSPACE_CREATED":
        return {
          icon: Building2,
          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          iconBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          label: "Workspace Created",
        };
      case "WORKSPACE_UPDATED":
        return {
          icon: Settings2,
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          iconBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          label: "Settings Updated",
        };
      default:
        return {
          icon: History,
          badgeColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          iconBg: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
          label: action.replace(/_/g, " "),
        };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 10) return "Just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  if (!isWorkspaceLoading && !canViewActivity) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Workspace activity logs and security audit trails are restricted to Workspace Administrators and Compliance Auditors.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/app/workspace/${activeWorkspace?.id || ""}`)}
          className="text-xs cursor-pointer border-border-subtle"
        >
          Return to Workspace Overview
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="size-5 text-primary" />
            <span>Workspace Activity Log</span>
            <Badge variant="outline" className="text-[10px] font-mono border-border-subtle bg-surface/50 text-muted-foreground">
              SOC 2 & ISO 27001 Ready
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time immutable audit trail for{" "}
            <span className="text-foreground font-medium">
              {activeWorkspace?.name || "this workspace"}
            </span>
            .
          </p>
        </div>

        {/* Action Controls & Compliance Export */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportCsvReport}
            disabled={isLoading || !activities.length}
            className="h-8 text-xs gap-1.5 border-border-subtle bg-card hover:bg-card/80 text-foreground cursor-pointer"
            title="Download RFC 4180 CSV table for external auditors"
          >
            <Download className="size-3.5 text-primary" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={exportJsonReport}
            disabled={isLoading || !activities.length}
            className="h-8 text-xs gap-1.5 border-border-subtle bg-card hover:bg-card/80 text-foreground cursor-pointer"
            title="Download structured JSON compliance audit report"
          >
            <FileCode className="size-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => loadActivities(true)}
            disabled={isLoading || isRefreshing}
            className="h-8 text-xs gap-1.5 border-border-subtle bg-card hover:bg-card/80 text-foreground cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 text-muted-foreground ${
                isRefreshing ? "animate-spin text-primary" : ""
              }`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Zero-Knowledge Security Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <span>Zero-Knowledge Immutable Audit Trail</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-mono font-normal">
              E2EE
            </span>
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Activity events only record operational timestamps, actor identifiers, and high-level
            metrics. Passwords, cryptographic keys, and decrypted contents are strictly zero-knowledge
            and never logged or transmitted to server logs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterCategory("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border border-border-subtle"
            }`}
          >
            All Events ({activities.length})
          </button>
          <button
            onClick={() => setFilterCategory("VAULT")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterCategory === "VAULT"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border border-border-subtle"
            }`}
          >
            Vault Changes (
            {activities.filter((a) => a.action === "VAULT_SYNCED").length}
            )
          </button>
          <button
            onClick={() => setFilterCategory("MEMBERS")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterCategory === "MEMBERS"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border border-border-subtle"
            }`}
          >
            Members (
            {
              activities.filter((a) =>
                ["MEMBER_INVITED", "MEMBER_JOINED", "MEMBER_REMOVED"].includes(a.action)
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilterCategory("WORKSPACE")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterCategory === "WORKSPACE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border border-border-subtle"
            }`}
          >
            Settings (
            {
              activities.filter((a) =>
                ["WORKSPACE_CREATED", "WORKSPACE_UPDATED"].includes(a.action)
              ).length
            }
            )
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-card border-border-subtle w-full"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center rounded-xl border border-border-subtle bg-card/50 space-y-3">
            <RefreshCw className="size-6 text-primary mx-auto animate-spin" />
            <p className="text-xs text-muted-foreground">Loading workspace activity trail...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-border-subtle bg-card/50 space-y-2">
            <History className="size-8 text-muted-foreground/50 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">No activities recorded</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No events match "${searchQuery}". Try clearing your search query.`
                : "Operational events such as credential syncs, member invites, and joins will appear here in chronological order."}
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[1px] before:bg-border-subtle">
            {filteredActivities.map((act) => {
              const conf = getActionConfig(act.action);
              const Icon = conf.icon;
              const formattedTime = formatRelativeTime(act.createdAt);
              const exactTime = new Date(act.createdAt).toLocaleString();

              return (
                <div
                  key={act.id}
                  className="relative group flex items-start gap-3 p-3.5 rounded-xl border border-border-subtle bg-card hover:border-border transition-colors shadow-sm"
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[27px] top-4 size-5 rounded-full border flex items-center justify-center bg-background ${conf.iconBg}`}
                  >
                    <Icon className="size-2.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${conf.badgeColor}`}
                        >
                          {conf.label}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {act.details}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono"
                        title={exactTime}
                      >
                        <Clock className="size-3 text-muted-foreground" />
                        <span>{formattedTime}</span>
                      </div>
                    </div>

                    {/* Metadata & Actor Bar */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                      {act.actor ? (
                        <div className="flex items-center gap-1.5">
                          <div className="size-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold">
                            {(act.actor.name || act.actor.email)[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground text-[11px]">
                            {act.actor.name || act.actor.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] italic">System</span>
                      )}

                      {/* Optional metadata pills */}
                      {act.metadata && Object.keys(act.metadata).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Object.entries(act.metadata).map(([key, val]) => {
                            if (val === null || val === undefined) return null;
                            return (
                              <span
                                key={key}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono"
                              >
                                {key}: {String(val)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

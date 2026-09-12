"use client";

import * as React from "react";
import {
  Cloud,
  ShieldCheck,
  Users,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { appConfig } from "@/config/app";
import {
  getCloudSession,
  setCloudSession,
  clearCloudSession,
  CLOUD_AUTH_CHANGE_EVENT,
} from "@/lib/auth-session";
import { useVaultData } from "@/context/vault-data-context";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSession {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  name?: string | null;
  accessToken: string;
}

function formatLastSynced(timestamp: string | null): string {
  if (!timestamp) return "Never synchronized";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 30) return "Just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CloudSyncModal({ isOpen, onClose }: CloudSyncModalProps) {
  const {
    syncStatus,
    lastSyncedAt,
    cloudItemCount,
    syncError,
    triggerCloudSync,
    deleteCloudBackup,
  } = useVaultData();

  const [activeTab, setActiveTab] = React.useState<"account" | "features">("account");
  const [authMode, setAuthMode] = React.useState<"signup" | "signin">("signup");
  const [session, setSession] = React.useState<UserSession | null>(null);

  // Form states
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Deletion confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = React.useState(false);

  // Load existing session from storage if any
  React.useEffect(() => {
    setSession(getCloudSession());
    const handleAuthChange = () => {
      setSession(getCloudSession());
    };
    window.addEventListener(CLOUD_AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener(CLOUD_AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [isOpen]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint = authMode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload: Record<string, string> = { email, password };
      if (authMode === "signup" && name.trim()) {
        payload.name = name.trim();
      }

      const res = await fetch(`${appConfig.apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      const userSession: UserSession = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        name: data.user.name,
        accessToken: data.accessToken,
      };

      setCloudSession(userSession);
      setSession(userSession);
      setSuccessMsg(
        authMode === "signup"
          ? `Account created successfully! Role: ${userSession.role}`
          : "Logged in successfully to Lokker Cloud!"
      );
      setPassword("");
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes("Failed to fetch")
          ? "Unable to reach backend server. Please verify lokker-server is running on " + appConfig.apiUrl
          : err.message || "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearCloudSession();
    setSession(null);
    setSuccessMsg("Disconnected from cloud. Your vault remains 100% safe locally.");
    setErrorMsg(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-surface border-border-subtle p-6 max-h-[90vh] overflow-y-auto lokker-scrollbar">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Cloud className="size-5" />
            </div>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 px-2 py-0.5">
              100% Optional • Local-First
            </Badge>
          </div>

          <DialogTitle className="text-lg font-semibold tracking-tight">
            Lokker Cloud & Team Workspaces
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect an optional account to enable encrypted cross-device sync and upcoming team workspaces.
          </DialogDescription>
        </DialogHeader>

        {/* Clear reassurance banner */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 mt-1">
          <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Zero-Knowledge & Never Mandatory</p>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Lokker is local-first by default. Your master keys and vault records never leave your
              device unencrypted. Cloud accounts are completely optional and only store encrypted blobs
              on our Neon PostgreSQL backend.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 h-9 bg-background border border-border-subtle">
            <TabsTrigger value="account" className="text-xs cursor-pointer">
              {session ? "Connected Account" : "Sign In / Sign Up"}
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs cursor-pointer">
              Upcoming Features
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4 pt-3">
            {session ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border-subtle bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-success" />
                      <span className="text-xs font-semibold text-foreground">Active Cloud Session</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/10 text-primary">
                      {session.role}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 pt-1">
                    <p className="text-muted-foreground">Signed in as:</p>
                    <p className="font-mono text-foreground font-medium">{session.email}</p>
                    {session.name && <p className="text-muted-foreground">Name: {session.name}</p>}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
                    <span className="text-[11px] text-muted-foreground">Backend: Neon Serverless Postgres</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive cursor-pointer"
                    >
                      <LogOut className="size-3" />
                      <span>Disconnect</span>
                    </Button>
                  </div>
                </div>

                {/* Cloud Sync Status & Actions Card */}
                <div className="p-4 rounded-xl border border-border-subtle bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw
                        className={`size-4 text-primary ${syncStatus === "syncing" ? "animate-spin" : ""}`}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        Encrypted Cloud Vault Relay
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium px-2 py-0.5 ${
                        syncStatus === "syncing"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : syncStatus === "synced"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                          : syncStatus === "error"
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-muted/40 bg-muted/10 text-muted-foreground"
                      }`}
                    >
                      {syncStatus === "syncing" && "Syncing..."}
                      {syncStatus === "synced" && "Synchronized"}
                      {syncStatus === "error" && "Sync Issue"}
                      {syncStatus === "idle" && "Ready to Sync"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface border border-border-subtle space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">Cloud-Scoped Items</p>
                      <p className="font-semibold text-foreground text-sm">{cloudItemCount} items</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-border-subtle space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">Last Synchronized</p>
                      <p className="font-semibold text-foreground text-xs truncate">
                        {formatLastSynced(lastSyncedAt)}
                      </p>
                    </div>
                  </div>

                  {syncError && (
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{syncError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                    <Button
                      size="sm"
                      onClick={async () => {
                        setErrorMsg(null);
                        await triggerCloudSync({ force: true });
                      }}
                      disabled={syncStatus === "syncing"}
                      className="flex-1 h-8 text-xs gap-1.5 cursor-pointer font-medium"
                    >
                      <RefreshCw
                        className={`size-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
                      />
                      <span>
                        {syncStatus === "syncing" ? "Synchronizing Vault..." : "Sync Vault Now"}
                      </span>
                    </Button>

                    {showDeleteConfirm ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            setIsDeletingBackup(true);
                            await deleteCloudBackup();
                            setIsDeletingBackup(false);
                            setShowDeleteConfirm(false);
                          }}
                          disabled={isDeletingBackup}
                          className="h-8 text-xs cursor-pointer"
                        >
                          {isDeletingBackup ? "Deleting..." : "Confirm Delete"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="h-8 text-xs cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Delete the encrypted backup from cloud (local vault is unaffected)"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="hidden sm:inline">Delete Backup</span>
                      </Button>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                    🔒 Protected by zero-knowledge encryption. Only AES-GCM 256-bit ciphertext blobs are
                    stored on the server. Local-only items remain exclusively on this device.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-medium text-foreground">
                    {authMode === "signup" ? "Create Free Account (Optional)" : "Sign In to Lokker Cloud"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "signup" ? "signin" : "signup");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    {authMode === "signup" ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                  </button>
                </div>

                {authMode === "signup" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Name (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 text-xs bg-background border-border-subtle"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 text-xs bg-background border-border-subtle"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Account Password</Label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 text-xs bg-background border-border-subtle"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Notice: This is for your cloud account authentication, distinct from your local master password.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-start gap-2">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-8 text-xs gap-1.5 cursor-pointer font-medium"
                  >
                    {isLoading ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <Cloud className="size-3.5" />
                    )}
                    <span>
                      {authMode === "signup"
                        ? "Create Free Cloud Account (Optional)"
                        : "Sign In to Cloud"}
                    </span>
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-3 pt-3 text-xs">
            <div className="p-3 rounded-xl border border-border-subtle bg-background flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="size-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">Team Workspaces & Shared Vaults</h4>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary/30">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Collaborate securely with your team or family. Role-Based Access Control (Admins and Members)
                  allows granular sharing while maintaining zero-knowledge encryption across workspaces.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border-subtle bg-background flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <RefreshCw className="size-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">Real-Time Encrypted Cloud Sync</h4>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-success border-success/30">
                    Backend Live
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Powered by Fastify v5 and Neon Serverless Postgres. Sync your credentials seamlessly between your
                  desktop browser, mobile app, and the Chromium autofill extension.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border-subtle bg-background flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Lock className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-semibold text-foreground">Encrypted Serverless Snapshots</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Never worry about device loss. Automatic encrypted backups protect against hardware failure,
                  recoverable only with your local master password.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-3 border-t border-border-subtle flex sm:justify-between items-center w-full">
          <span className="text-[11px] text-muted-foreground">
            Prefer offline? Close this modal anytime.
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
            Keep Vault Offline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

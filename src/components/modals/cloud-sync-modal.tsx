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
  Fingerprint,
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
  type CloudSessionUser,
} from "@/lib/auth-session";
import { deriveAuthHash } from "@/lib/crypto";
import { useVaultData } from "@/context/vault-data-context";
import { CloudUploadChoiceModal } from "./cloud-upload-choice-modal";
import {
  isPlatformPasskeyAvailable,
  registerCloudPasskey,
  authenticateCloudPasskey,
  getRegisteredCloudPasskeys,
  removeCloudPasskey,
  getPasskeyDeviceName,
  type CloudPasskeyDescriptor,
} from "@/lib/cloud-passkey";

type UserSession = CloudSessionUser;

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatLastSynced(iso: string | null) {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
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
    migrateAllToCloudAndSync,
    deleteCloudBackup,
  } = useVaultData();

  const [activeTab, setActiveTab] = React.useState<"account" | "features">("account");
  const [authMode, setAuthMode] = React.useState<"signup" | "signin">("signup");
  const [session, setSession] = React.useState<UserSession | null>(null);
  const [showChoiceModal, setShowChoiceModal] = React.useState(false);

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

  // Passkey states
  const [passkeys, setPasskeys] = React.useState<CloudPasskeyDescriptor[]>([]);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);
  const [hasPasskeySupport, setHasPasskeySupport] = React.useState(true);
  const [deviceName, setDeviceName] = React.useState("Windows Hello / Touch ID");

  // Load existing session from storage if any
  React.useEffect(() => {
    isPlatformPasskeyAvailable().then(setHasPasskeySupport);
    setDeviceName(getPasskeyDeviceName());
    const currentSession = getCloudSession();
    setSession(currentSession);
    if (currentSession) {
      setPasskeys(getRegisteredCloudPasskeys(currentSession.id));
    }
    const handleAuthChange = () => {
      const s = getCloudSession();
      setSession(s);
      if (s) {
        setPasskeys(getRegisteredCloudPasskeys(s.id));
      } else {
        setPasskeys([]);
      }
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
      const authHash = await deriveAuthHash(password, email);
      const payload: Record<string, string> = { email, password: authHash };
      if (authMode === "signup" && name.trim()) {
        payload.name = name.trim();
      }

      let res = await fetch(`${appConfig.apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Legacy fallback for signin if account was originally registered with plain password
      if (!res.ok && authMode === "signin" && res.status === 401) {
        const legacyRes = await fetch(`${appConfig.apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (legacyRes.ok) {
          res = legacyRes;
        }
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      const userSession: UserSession = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role === "ADMIN" ? "ADMIN" : "USER",
        name: data.user.name,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      setCloudSession(userSession);
      setSession(userSession);
      setSuccessMsg(
        authMode === "signup"
          ? "Account created successfully! Welcome to Lokker Cloud."
          : "Logged in successfully to Lokker Cloud!"
      );
      // Trigger cloud sync with the master password to restore remote VEK if needed
      triggerCloudSync({ force: true, masterPassword: password }).catch(console.error);
      setPassword("");
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes("Failed to fetch")
          ? "Unable to reach the cloud service. Please check your internet connection and try again."
          : err.message || "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (session?.accessToken) {
      try {
        await fetch(`${appConfig.apiUrl}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: "{}",
        });
      } catch (err) {
        console.warn("Backend logout request error:", err);
      }
    }
    clearCloudSession();
    setSession(null);
    setSuccessMsg("Disconnected from cloud. Your vault remains 100% safe locally.");
    setErrorMsg(null);
  };

  const handlePasskeySignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPasskeyLoading(true);
    try {
      const restored = await authenticateCloudPasskey(email.trim() || undefined);
      setSession(restored);
      setSuccessMsg("Signed in with biometric passkey!");
      triggerCloudSync({ force: true }).catch(console.error);
    } catch (err: any) {
      setErrorMsg(err.userMessage || err.message || "Passkey verification failed.");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!session) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPasskeyLoading(true);
    try {
      const created = await registerCloudPasskey(session);
      setPasskeys(getRegisteredCloudPasskeys(session.id));
      setSuccessMsg(`Passkey registered successfully for ${created.deviceName}!`);
    } catch (err: any) {
      setErrorMsg(err.userMessage || err.message || "Failed to register passkey.");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleRemovePasskey = (credentialId: string) => {
    removeCloudPasskey(credentialId);
    if (session) {
      setPasskeys(getRegisteredCloudPasskeys(session.id));
    }
    setSuccessMsg("Passkey removed from this device.");
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
              Lokker is local-first by default. Your master password and vault records never leave your
              device unencrypted. Cloud sync is completely optional and stores only securely encrypted
              backups that only you can decrypt.
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
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Cloud Sync Active</span>
                    </span>
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
                        Encrypted Cloud Backup
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
                      onClick={() => {
                        setErrorMsg(null);
                        setShowChoiceModal(true);
                      }}
                      disabled={syncStatus === "syncing"}
                      className="flex-1 h-8 text-xs gap-1.5 cursor-pointer font-medium"
                    >
                      <RefreshCw
                        className={`size-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
                      />
                      <span>
                        {syncStatus === "syncing" ? "Synchronizing Vault..." : "Sync to Cloud"}
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
                    🔒 Protected by zero-knowledge architecture. Your vault is fully encrypted on this device
                    before syncing. Only your master password can unlock your data.
                  </p>
                </div>

                {/* Biometric Passkeys (Windows Hello / Touch ID) Section */}
                <div className="p-4 rounded-xl border border-border-subtle bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="size-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-foreground">
                        Biometric Passkeys on this Device
                      </span>
                    </div>
                    {passkeys.length > 0 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">
                        {passkeys.length} Registered
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border-subtle">
                        None Linked
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Link your device's biometric authenticator ({deviceName}) to sign in to Lokker Cloud instantly without typing your cloud password.
                  </p>

                  {passkeys.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {passkeys.map((p) => (
                        <div
                          key={p.credentialId}
                          className="p-2.5 rounded-lg bg-surface border border-border-subtle flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                              <Fingerprint className="size-3 text-emerald-500" />
                              <span>{p.deviceName}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Added {new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePasskey(p.credentialId)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                            <span>Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="pt-2 border-t border-border-subtle">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPasskeyLoading}
                      onClick={handleRegisterPasskey}
                      className="w-full h-8 text-xs gap-1.5 cursor-pointer font-medium border-border-subtle hover:bg-surface"
                    >
                      {isPasskeyLoading ? (
                        <RefreshCw className="size-3.5 animate-spin text-primary" />
                      ) : (
                        <Fingerprint className="size-3.5 text-emerald-500" />
                      )}
                      <span>
                        {passkeys.length > 0
                          ? `Register Another Passkey (${deviceName})`
                          : `Register ${deviceName} on this Device`}
                      </span>
                    </Button>
                  </div>
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

                {authMode === "signin" && hasPasskeySupport && (
                  <div className="space-y-2 pt-1 pb-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPasskeyLoading || isLoading}
                      onClick={handlePasskeySignIn}
                      className="w-full h-9 text-xs justify-center gap-2 border-border-subtle bg-surface hover:bg-surface/80 cursor-pointer"
                    >
                      {isPasskeyLoading ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin text-primary" />
                          <span>Verifying {deviceName}...</span>
                        </>
                      ) : (
                        <>
                          <Fingerprint className="size-3.5 text-emerald-500" />
                          <span>Sign In with Passkey ({deviceName})</span>
                        </>
                      )}
                    </Button>

                    <div className="relative flex items-center justify-center">
                      <div className="w-full border-t border-border-subtle" />
                      <span className="bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        or sign in with password
                      </span>
                    </div>
                  </div>
                )}

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
                    Available Now
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Sync your credentials seamlessly and securely between your desktop browser, mobile devices,
                  and the Lokker browser extension.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border-subtle bg-background flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Lock className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-semibold text-foreground">Automatic Encrypted Backups</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Never worry about device loss. Automatic encrypted cloud backups protect against hardware failure,
                  recoverable only with your master password.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="-mx-6 -mb-6 mt-6 px-6 py-3.5 border-t border-border-subtle bg-muted/30 flex flex-row items-center justify-between rounded-b-xl shrink-0">
          <span className="text-xs text-muted-foreground">
            Prefer offline? Close this modal anytime.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Keep Vault Offline
          </Button>
        </DialogFooter>
      </DialogContent>

      <CloudUploadChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onUploadAll={async () => {
          await migrateAllToCloudAndSync();
        }}
        onUploadSelected={() => {
          setShowChoiceModal(false);
          onClose();
        }}
        totalLocalItems={cloudItemCount}
      />
    </Dialog>
  );
}

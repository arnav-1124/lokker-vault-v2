"use client";

import * as React from "react";
import {
  Settings,
  Clock,
  Fingerprint,
  ShieldAlert,
  Puzzle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  FileKey,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { VaultSettings } from "@/types";

interface SettingsViewProps {
  settings: VaultSettings;
  onUpdateSettings: (s: VaultSettings) => void;
  onExportJSON: (encrypted: boolean) => void;
  onExportCSV: () => void;
  onImportFile: (file: File) => void;
  onResetVault: () => void;
  isUnlocked: boolean;
  onOpenExtensionGuide: () => void;
  isWebAuthnRegistered?: boolean;
  onRegisterWebAuthn?: () => Promise<void>;
  onUnregisterWebAuthn?: () => Promise<void>;
  onChangeMasterPasswordClick?: () => void;
  onOpenRecoveryKeyClick?: () => void;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onResetVault,
  onOpenExtensionGuide,
  isUnlocked,
  isWebAuthnRegistered,
  onRegisterWebAuthn,
  onUnregisterWebAuthn,
  onChangeMasterPasswordClick,
  onOpenRecoveryKeyClick,
}: SettingsViewProps) {
  const [autoLock, setAutoLock] = React.useState(settings.autoLockMinutes);
  const [requireConfirmation, setRequireConfirmation] = React.useState(
    settings.requireConfirmationForAutofill ?? true
  );
  const [webAuthnActive, setWebAuthnActive] = React.useState(!!isWebAuthnRegistered);
  const [webAuthnLoading, setWebAuthnLoading] = React.useState(false);
  const [webAuthnError, setWebAuthnError] = React.useState<string | null>(null);

  // Genuine WebAuthn platform authenticator & browser support detection
  const [hasPlatformAuth, setHasPlatformAuth] = React.useState<boolean | null>(null);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = React.useState<boolean | null>(null);

  // Sync toggle state with the actual registration status using the
  // render-adjust pattern (no setState inside an effect).
  const [prevRegistered, setPrevRegistered] = React.useState(isWebAuthnRegistered);
  if (prevRegistered !== isWebAuthnRegistered) {
    setPrevRegistered(isWebAuthnRegistered);
    setWebAuthnActive(!!isWebAuthnRegistered);
  }

  React.useEffect(() => {
    let isMounted = true;
    async function checkWebAuthn() {
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        if (isMounted) setIsWebAuthnSupported(true);
        if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
          try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (isMounted) setHasPlatformAuth(available);
          } catch {
            if (isMounted) setHasPlatformAuth(false);
          }
        } else {
          if (isMounted) setHasPlatformAuth(false);
        }
      } else {
        if (isMounted) {
          setIsWebAuthnSupported(false);
          setHasPlatformAuth(false);
        }
      }
    }
    checkWebAuthn();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleWebAuthn = async (checked: boolean) => {
    setWebAuthnError(null);
    setWebAuthnLoading(true);
    try {
      if (checked) {
        if (!onRegisterWebAuthn) {
          setWebAuthnError("WebAuthn registration is not available.");
          setWebAuthnLoading(false);
          return;
        }
        await onRegisterWebAuthn();
        setWebAuthnActive(true);
        onUpdateSettings({ ...settings, webAuthnEnabled: true });
      } else {
        if (!onUnregisterWebAuthn) {
          setWebAuthnError("WebAuthn unregistration is not available.");
          setWebAuthnLoading(false);
          return;
        }
        await onUnregisterWebAuthn();
        setWebAuthnActive(false);
        onUpdateSettings({ ...settings, webAuthnEnabled: false });
      }
    } catch (err) {
      // Prefer the AppError userMessage (actionable guidance) over the
      // developer-facing error message.
      const userMessage =
        err && typeof err === "object" && "userMessage" in err
          ? String((err as { userMessage: unknown }).userMessage)
          : err instanceof Error
            ? err.message
            : null;
      setWebAuthnError(userMessage || "WebAuthn operation failed.");
      // Revert toggle
      setWebAuthnActive(!checked);
    } finally {
      setWebAuthnLoading(false);
    }
  };

  const handleToggleAutofillConfirmation = (checked: boolean) => {
    setRequireConfirmation(checked);
    onUpdateSettings({ ...settings, requireConfirmationForAutofill: checked });
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      <div className="pb-4 border-b border-border-subtle">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Settings className="size-4 text-primary" />
          <span>Vault Settings & Security Controls</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Manage encryption policies, auto-lock timeouts, and hardware authentication capabilities.
        </p>
      </div>

      {/* Auto-Lock Settings */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Auto-Lock Inactivity Timer</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Automatically locks your decrypted vault when inactive to protect against unauthorized physical access.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {[1, 5, 15, 30, 0].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                setAutoLock(mins);
                onUpdateSettings({ ...settings, autoLockMinutes: mins });
              }}
              className={`p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                autoLock === mins
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              {mins === 0 ? "Never" : `${mins} Minutes`}
            </button>
          ))}
        </div>
      </div>

      {/* Account Recovery — Master Password & Recovery Key */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Account Recovery</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Rotate your master password (re-wraps the vault key in place) or generate a fresh Emergency
          Recovery Key if the current one is lost or compromised. Both actions re-key only their own
          slot — your vault data stays untouched.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onChangeMasterPasswordClick}
            disabled={!isUnlocked}
            className="text-xs h-8 cursor-pointer"
          >
            <KeyRound className="size-3.5" />
            <span>Change Master Password</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenRecoveryKeyClick}
            disabled={!isUnlocked}
            className="text-xs h-8 cursor-pointer"
          >
            <FileKey className="size-3.5" />
            <span>Regenerate Recovery Key</span>
          </Button>
        </div>
        {!isUnlocked && (
          <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>Unlock your vault first to rotate credentials.</span>
          </div>
        )}
      </div>

      {/* Genuine WebAuthn / Platform Authenticator Settings */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Fingerprint className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Hardware Security Key & Passkey Unlock (WebAuthn PRF)
              </h3>
              {webAuthnActive ? (
                <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                  Registered & Active
                </Badge>
              ) : isWebAuthnSupported ? (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  FIDO2 / YubiKey 5.3+ Required
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  WebAuthn Unavailable
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Uses the WebAuthn PRF extension to derive your 256-bit vault encryption key on-device — no secrets are stored. Requires an authenticator that supports cryptographic key derivation: FIDO2 security keys (YubiKey 5.3+), PRF-capable passkey providers (e.g. 1Password), or Chrome on Android. Standard laptop biometrics (Windows Hello on older builds, macOS Touch ID) only support login signatures and cannot derive encryption keys.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="webauthn-toggle"
              checked={webAuthnActive}
              onCheckedChange={handleToggleWebAuthn}
              disabled={isWebAuthnSupported === false || webAuthnLoading || !isUnlocked}
              className="cursor-pointer"
            />
            {webAuthnLoading && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                {webAuthnActive ? "Registering..." : "Removing..."}
              </span>
            )}
          </div>
        </div>

        {webAuthnError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="size-4 shrink-0" />
                <span>Authenticator Lacks PRF Support</span>
              </div>
              <button
                type="button"
                onClick={() => setWebAuthnError(null)}
                className="text-destructive/70 hover:text-destructive cursor-pointer text-xs"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">{webAuthnError}</p>
          </div>
        )}

        {!isUnlocked && (
          <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>Unlock your vault first to register or manage a passkey.</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <KeyRound className="size-4 text-primary shrink-0" />
            <span>Why standard laptop biometrics (Windows Hello / Touch ID) may fail here</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
            Logging into a website only requires your laptop to sign a challenge. Unlocking Lokker’s zero-knowledge vault requires the authenticator to deterministically calculate an AES-256 encryption key from hardware via the WebAuthn PRF extension. If your device biometrics do not support PRF, you can use a FIDO2 security key (such as a YubiKey 5.3+) or continue using your Master Password and Emergency Recovery Key.
          </p>
        </div>
      </div>

      {/* Extension Autofill Security */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Autofill Confirmation Prompts</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Require explicit user confirmation in the extension popup before injecting credentials into webpage inputs.
            </p>
          </div>
          <Switch
            id="autofill-prompt"
            checked={requireConfirmation}
            onCheckedChange={handleToggleAutofillConfirmation}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* Browser Extension Settings */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Puzzle className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Manifest V3 Extension Package</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Download and load the ready-to-use Manifest V3 extension package (.zip) into Chrome, Edge, or Brave.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenExtensionGuide}
            className="text-xs h-8 cursor-pointer"
          >
            Setup Guide
          </Button>
        </div>
      </div>

      {/* Danger Zone / Wipe Vault */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="size-4" />
          <h3 className="text-sm font-semibold">Danger Zone</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Resetting your vault will permanently erase all local IndexedDB tables, stored credentials, bookmarks, files, and encryption keys.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={onResetVault}
          className="text-xs font-medium h-8 cursor-pointer"
        >
          Reset & Wipe Local Vault
        </Button>
      </div>
    </div>
  );
}

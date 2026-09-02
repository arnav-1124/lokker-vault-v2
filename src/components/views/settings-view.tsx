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
}: SettingsViewProps) {
  const [autoLock, setAutoLock] = React.useState(settings.autoLockMinutes);
  const [requireConfirmation, setRequireConfirmation] = React.useState(
    settings.requireConfirmationForAutofill ?? true
  );
  const [webAuthnActive, setWebAuthnActive] = React.useState(!!settings.webAuthnEnabled);
  const [webAuthnLoading, setWebAuthnLoading] = React.useState(false);
  const [webAuthnError, setWebAuthnError] = React.useState<string | null>(null);

  // Genuine WebAuthn platform authenticator detection
  const [hasPlatformAuth, setHasPlatformAuth] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function checkWebAuthn() {
      if (
        typeof window !== "undefined" &&
        window.PublicKeyCredential &&
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
      ) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (isMounted) setHasPlatformAuth(available);
        } catch {
          if (isMounted) setHasPlatformAuth(false);
        }
      } else {
        if (isMounted) setHasPlatformAuth(false);
      }
    }
    checkWebAuthn();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync toggle state with actual registration status
  React.useEffect(() => {
    if (isWebAuthnRegistered !== undefined) {
      setWebAuthnActive(isWebAuthnRegistered);
    }
  }, [isWebAuthnRegistered]);

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
      setWebAuthnError(err instanceof Error ? err.message : "WebAuthn operation failed.");
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

      {/* Genuine WebAuthn / Platform Authenticator Settings */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Fingerprint className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Hardware Passkey & Biometric Unlock
              </h3>
              {hasPlatformAuth ? (
                <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                  Hardware Detected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {hasPlatformAuth === null ? "Checking..." : "Hardware Unavailable"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Uses the WebAuthn PRF extension to derive your encryption key on-device — your biometrics never leave the device and no secret is stored. Requires a PRF-capable authenticator: FIDO2 security keys (YubiKey 5.3+), PRF-capable passkey providers (e.g. 1Password), or Chrome on Android. Note: Windows Hello and Touch ID / iCloud Keychain do not support PRF.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="webauthn-toggle"
              checked={webAuthnActive}
              onCheckedChange={handleToggleWebAuthn}
              disabled={hasPlatformAuth === false || webAuthnLoading || !isUnlocked}
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
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{webAuthnError}</span>
          </div>
        )}

        {!isUnlocked && (
          <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>Unlock your vault first to register or manage a passkey.</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-background border border-border-subtle text-xs space-y-1">
          <div className="flex items-center gap-2 text-foreground font-medium">
            {hasPlatformAuth ? (
              <CheckCircle2 className="size-4 text-success shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-warning shrink-0" />
            )}
            <span>
              {hasPlatformAuth
                ? "Platform authenticator detected. If registration fails, this device's biometrics may not support PRF — use a FIDO2 security key instead."
                : "No platform biometric hardware detected in current environment. A FIDO2 security key can still be used."}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground pl-6">
            Lokker uses native Web Crypto PBKDF2-SHA256 (600,000 iterations) with 3-tier VEK envelope encryption across all platforms.
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

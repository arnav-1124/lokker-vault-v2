"use client";

import * as React from "react";
import { ShieldCheck, KeyRound, Copy, Check, Lock, ArrowRight, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface UnifiedPasswordModalProps {
  isOpen: boolean;
  mode: "local-to-cloud" | "cloud-first";
  recoveryKey?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

/**
 * Clean, minimal centered modal that informs users about the Unified Master Password strategy:
 * 1. "local-to-cloud": Alerts user transitioning from local vault that their existing
 *    Master Password will automatically serve as their cloud account password.
 * 2. "cloud-first": Alerts cloud-first users that their chosen registration password
 *    will unlock their vault upon auto-lock timeout, and displays their Emergency Recovery Key.
 */
export function UnifiedPasswordModal({
  isOpen,
  mode,
  recoveryKey = "",
  onConfirm,
  onClose,
}: UnifiedPasswordModalProps) {
  const [copiedKey, setCopiedKey] = React.useState(false);
  const [hasConfirmedSaved, setHasConfirmedSaved] = React.useState(false);

  const handleCopyKey = () => {
    if (!recoveryKey) return;
    navigator.clipboard?.writeText(recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onClose) onClose();
      }}
    >
      <DialogContent
        className="max-w-md bg-surface border-border-subtle p-6 shadow-2xl rounded-2xl"
        showCloseButton={mode === "local-to-cloud"}
      >
        {mode === "local-to-cloud" ? (
          /* LOCAL TO CLOUD MODAL */
          <div className="space-y-5">
            <DialogHeader className="space-y-2">
              <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <KeyRound className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold text-foreground">
                    One Password For Everything
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0">
                    Unified
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  We noticed you already have an active vault on this device.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    Your Master Password is your Cloud Password
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    To keep your login simple and seamless, the master password you previously created will automatically be your cloud account password.
                  </p>
                </div>
              </div>

              <div className="border-t border-border-subtle/60 pt-2.5 text-[11px] text-muted-foreground">
                No need to memorize multiple passwords. Simply enter your existing Master Password to create or link your cloud account.
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={onConfirm}
                className="w-full h-9 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm"
              >
                <span>Got it, continue</span>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* CLOUD FIRST REGISTRATION MODAL */
          <div className="space-y-5">
            <DialogHeader className="space-y-2">
              <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Master Password & Recovery Key
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0">
                    Important
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Your account is registered. Here is how your vault security works:
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Inactivity timer explanation */}
            <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1.5">
              <div className="flex items-center gap-2">
                <Lock className="size-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Auto-Lock & Unlock
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The password you just created is your <strong className="text-foreground font-semibold">Master Password</strong>. Whenever your vault locks after a period of inactivity, enter this exact password to unlock it.
              </p>
            </div>

            {/* Emergency Recovery Key Box */}
            <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <KeyRound className="size-3.5 text-emerald-400" />
                  Emergency Recovery Key
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyKey}
                  className="h-6 text-[11px] gap-1 px-2 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {copiedKey ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                </Button>
              </div>

              <p className="font-mono text-xs text-emerald-400 bg-surface p-2.5 rounded-lg border border-border-subtle select-all text-center tracking-wider font-semibold">
                {recoveryKey || "XXXX-XXXX-XXXX-XXXX"}
              </p>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Save this key securely offline. If you ever forget your master password, this recovery key is the only way to regain access to your vault.
              </p>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="cloud-recovery-check"
                checked={hasConfirmedSaved}
                onCheckedChange={(checked) => setHasConfirmedSaved(!!checked)}
                className="mt-0.5"
              />
              <Label
                htmlFor="cloud-recovery-check"
                className="text-xs text-muted-foreground font-normal cursor-pointer leading-tight select-none"
              >
                I have safely stored my Emergency Recovery Key in a secure place.
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                disabled={!hasConfirmedSaved}
                onClick={onConfirm}
                className="w-full h-9 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white cursor-pointer shadow-sm gap-1.5"
              >
                <span>Enter My Vault</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

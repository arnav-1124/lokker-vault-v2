"use client";

import * as React from "react";
import {
  ShieldCheck,
  Link as LinkIcon,
  Copy,
  Check,
  Clock,
  Eye,
  Flame,
  Lock,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEncryptedSecretLink, CreatedSecretLink } from "@/lib/secret-sharing";

interface ShareSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSecret?: string;
  initialTitle?: string;
}

export function ShareSecretModal({
  isOpen,
  onClose,
  initialSecret = "",
  initialTitle = "",
}: ShareSecretModalProps) {
  const [title, setTitle] = React.useState(initialTitle);
  const [secret, setSecret] = React.useState(initialSecret);
  const [expiresIn, setExpiresIn] = React.useState<string>("86400"); // 24 hours
  const [viewsLimit, setViewsLimit] = React.useState<string>("1"); // Burn after 1 view

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdLink, setCreatedLink] = React.useState<CreatedSecretLink | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setSecret(initialSecret);
      setCreatedLink(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, initialSecret, initialTitle]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError("Please enter a secret to share.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await createEncryptedSecretLink(
        { secret: secret.trim(), title: title.trim() || undefined },
        {
          expiresInSeconds: parseInt(expiresIn, 10),
          viewsRemaining: parseInt(viewsLimit, 10),
        }
      );
      setCreatedLink(result);
    } catch (err: any) {
      console.error("Failed to create secret link:", err);
      setError(err?.message || "Failed to generate encrypted secret link.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdLink) return;
    await navigator.clipboard?.writeText(createdLink.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border-subtle p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <span>Zero-Knowledge Secret Link</span>
          </DialogTitle>
        </DialogHeader>

        {/* Security explanation banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Encrypted client-side with AES-GCM-256. The decryption key resides exclusively in the
            URL hash fragment (<span className="font-mono text-primary font-medium">#key=...</span>)
            and is never transmitted to or stored on our servers.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {createdLink ? (
          /* Result state: link generated */
          <div className="space-y-4 pt-2 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Flame className="size-3.5 text-amber-400" />
                  <span>Your Secure Link is Ready</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {createdLink.viewsRemaining === 1
                    ? "Burns after 1 view"
                    : `Max ${createdLink.viewsRemaining} views`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdLink.shareUrl}
                  className="h-8 text-xs font-mono bg-background border-border-subtle select-all flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 text-xs gap-1.5 shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Send this link to the recipient. Once opened (or when the timer expires), the
                server automatically burns the encrypted record forever.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedLink(null)}
                className="h-8 text-xs cursor-pointer"
              >
                Create Another
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                className="h-8 text-xs cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form state: configure secret */
          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="secret-title" className="text-xs">
                Secret Title (Optional)
              </Label>
              <Input
                id="secret-title"
                placeholder="e.g. Production Database Password"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="secret-content" className="text-xs">
                Secret Content / Password <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="secret-content"
                required
                rows={3}
                placeholder="Paste the password, API key, or confidential note..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="text-xs font-mono bg-background resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="secret-expires" className="text-xs flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>Expires In</span>
                </Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger id="secret-expires" size="sm" className="bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3600">1 Hour</SelectItem>
                    <SelectItem value="86400">24 Hours (1 Day)</SelectItem>
                    <SelectItem value="604800">7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="secret-views" className="text-xs flex items-center gap-1">
                  <Flame className="size-3 text-amber-400" />
                  <span>View Limit</span>
                </Label>
                <Select value={viewsLimit} onValueChange={setViewsLimit}>
                  <SelectTrigger id="secret-views" size="sm" className="bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 View (Burn on read)</SelectItem>
                    <SelectItem value="3">3 Views</SelectItem>
                    <SelectItem value="5">5 Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isGenerating || !secret.trim()}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="size-3 animate-spin" />
                    <span>Encrypting...</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-3" />
                    <span>Generate Secure Link</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

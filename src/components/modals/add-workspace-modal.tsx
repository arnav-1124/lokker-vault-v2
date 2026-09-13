"use client";

import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Sparkles, Check, AlertCircle, Cloud } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { useVaultUI } from "@/context/vault-ui-context";

interface AddWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddWorkspaceModal({ isOpen, onClose }: AddWorkspaceModalProps) {
  const { createWorkspace, planQuota, isCloudActive } = useWorkspace();
  const { setIsCloudSyncModalOpen } = useVaultUI();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isLimitReached = planQuota.ownedCount >= planQuota.maxAllowed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await createWorkspace(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Building2 className="size-5" />
            </div>
            <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary px-2 py-0.5 font-mono">
              {planQuota.plan} • {planQuota.ownedCount}/{planQuota.maxAllowed} Created
            </Badge>
          </div>
          <DialogTitle className="text-base font-semibold tracking-tight">Create Team Workspace</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Workspaces let you securely share passwords, bookmarks, and categories with your team or family.
          </DialogDescription>
        </DialogHeader>

        {!isCloudActive ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                <Cloud className="size-4 text-primary shrink-0" />
                <span>Cloud Account Required</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Team Workspaces require an active Lokker Cloud account to securely synchronize credentials and manage team invitations in real-time.
              </p>
            </div>

            <DialogFooter className="-mx-6 -mb-6 mt-4 px-6 py-3.5 border-t border-border-subtle bg-muted/30 flex flex-row items-center justify-between rounded-b-xl shrink-0">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  setIsCloudSyncModalOpen(true);
                }}
                className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
              >
                <Cloud className="size-3.5" />
                <span>Connect Cloud Account</span>
              </Button>
            </DialogFooter>
          </div>
        ) : isLimitReached ? (
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border border-warning/30 bg-warning/5 space-y-2">
              <div className="flex items-center gap-2 text-warning text-xs font-semibold">
                <AlertCircle className="size-4 shrink-0" />
                <span>Workspace Quota Reached</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                You have created {planQuota.ownedCount} of {planQuota.maxAllowed} workspaces available on your{" "}
                <span className="font-semibold text-foreground">{planQuota.plan}</span> plan.
              </p>
            </div>

            {/* Plan options */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-semibold text-foreground">Available Upgrades:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg border border-border-subtle bg-background space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Pro</span>
                    <span className="text-primary font-mono text-xs">$5/mo</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Up to 5 workspaces</p>
                </div>
                <div className="p-3 rounded-lg border border-border-subtle bg-background space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Plus</span>
                    <span className="text-primary font-mono text-xs">$15/mo</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Up to 25 workspaces</p>
                </div>
              </div>
            </div>

            <DialogFooter className="-mx-6 -mb-6 mt-4 px-6 py-3 border-t border-border-subtle bg-muted/30 flex flex-row justify-end rounded-b-xl">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Workspace Name</Label>
              <Input
                required
                placeholder="e.g. Acme Engineering, Design Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs bg-background border-border-subtle"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description (Optional)</Label>
              <Textarea
                placeholder="Brief purpose of this shared workspace..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-xs bg-background border-border-subtle resize-none"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-2.5 rounded-lg border border-border-subtle bg-muted/20 text-[11px] text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-primary" /> Role Assignment
              </p>
              <p className="leading-tight">
                You will be the permanent <strong className="text-foreground">Admin</strong> of this workspace. You can invite team members via link anytime.
              </p>
            </div>

            <DialogFooter className="-mx-6 -mb-6 mt-4 px-6 py-3.5 border-t border-border-subtle bg-muted/30 flex flex-row items-center justify-between rounded-b-xl shrink-0">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()} className="h-8 text-xs font-medium cursor-pointer">
                {isSubmitting ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

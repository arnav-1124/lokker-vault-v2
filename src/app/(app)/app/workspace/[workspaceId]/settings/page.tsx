"use client";

import * as React from "react";
import {
  Settings,
  Building2,
  Trash2,
  LogOut,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/workspace-context";

export default function WorkspaceSettingsPage() {
  const {
    activeWorkspace,
    userRole,
    isOwner,
    isAdmin,
    isAuditor,
    updateWorkspace,
    deleteWorkspace,
    leaveWorkspace,
  } = useWorkspace();

  const [name, setName] = React.useState(activeWorkspace?.name || "");
  const [description, setDescription] = React.useState(activeWorkspace?.description || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Deletion confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Leave confirm
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  React.useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setDescription(activeWorkspace.description || "");
    }
  }, [activeWorkspace]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !name.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      await updateWorkspace(activeWorkspace.id, name.trim(), description.trim() || undefined);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to update workspace settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeWorkspace) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(activeWorkspace.id);
    } catch (err: any) {
      setError(err.message || "Failed to delete workspace");
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (!activeWorkspace) return;
    setIsLeaving(true);
    try {
      await leaveWorkspace(activeWorkspace.id);
    } catch (err: any) {
      setError(err.message || "Failed to leave workspace");
      setIsLeaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage workspace profile, plan details, and membership.
        </p>
      </div>

      {/* General Settings Form */}
      {isAdmin ? (
        <form onSubmit={handleSave} className="p-5 rounded-xl border border-border-subtle bg-surface/50 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">General Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="ws-name" className="text-xs">
              Workspace Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Engineering"
              required
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-desc" className="text-xs">
              Description <span className="text-muted-foreground text-[10px]">(optional)</span>
            </Label>
            <Textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief summary of who has access and how credentials are partitioned..."
              rows={3}
              className="text-xs bg-background resize-none"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
              <Check className="size-3.5 shrink-0" />
              <span>Workspace updated successfully!</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving || !name.trim()} size="sm" className="h-8 text-xs font-medium cursor-pointer">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-5 rounded-xl border border-border-subtle bg-surface/50 space-y-2 text-xs">
          <h2 className="text-sm font-semibold text-foreground">{activeWorkspace?.name}</h2>
          <p className="text-muted-foreground">{activeWorkspace?.description || "No description provided."}</p>
          <Badge variant="outline" className="text-[10px] text-muted-foreground mt-2">
            {isAuditor ? "Auditor Read-Only Access" : "Member Access Only"}
          </Badge>
        </div>
      )}

      {/* Plan Details Card */}
      <div className="p-5 rounded-xl border border-border-subtle bg-surface/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">Workspace Plan</h2>
            <p className="text-xs text-muted-foreground">Current tier and quota entitlements.</p>
          </div>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 px-2 py-0.5 font-mono">
            {activeWorkspace?.plan || "FREE"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className="p-3 rounded-lg border border-border-subtle bg-background space-y-0.5">
            <span className="font-semibold text-foreground">Free Plan</span>
            <p className="text-[10px] text-muted-foreground">1 Workspace</p>
            <span className="text-[10px] text-primary font-mono font-medium">Included</span>
          </div>
          <div className="p-3 rounded-lg border border-border-subtle bg-background space-y-0.5">
            <span className="font-semibold text-foreground">Pro Plan</span>
            <p className="text-[10px] text-muted-foreground">Up to 5 Workspaces</p>
            <span className="text-[10px] text-muted-foreground font-mono">$5 / month</span>
          </div>
          <div className="p-3 rounded-lg border border-border-subtle bg-background space-y-0.5">
            <span className="font-semibold text-foreground">Plus Plan</span>
            <p className="text-[10px] text-muted-foreground">Up to 25 Workspaces</p>
            <span className="text-[10px] text-muted-foreground font-mono">$15 / month</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
        <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>

        {isOwner ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Delete this workspace</p>
              <p className="text-[11px] text-muted-foreground">
                Permanently delete this workspace and remove all shared credentials. This action can only be performed by the workspace owner.
              </p>
            </div>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-8 text-xs cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
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
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-8 text-xs gap-1.5 cursor-pointer shrink-0 font-medium"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Workspace</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Leave workspace</p>
              <p className="text-[11px] text-muted-foreground">
                Remove your membership from this workspace. You will lose access to its shared credentials.
              </p>
            </div>

            {showLeaveConfirm ? (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="h-8 text-xs cursor-pointer"
                >
                  {isLeaving ? "Leaving..." : "Confirm Leave"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaveConfirm(true)}
                className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 cursor-pointer shrink-0"
              >
                <LogOut className="size-3.5" />
                <span>Leave Workspace</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

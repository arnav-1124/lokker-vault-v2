"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";
import { appConfig } from "@/config/app";
import { getCloudSession } from "@/lib/auth-session";

interface InviteInfo {
  workspaceName: string;
  description?: string | null;
  adminName?: string | null;
  expiresAt: string;
  isExpired: boolean;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";

  const [inviteInfo, setInviteInfo] = React.useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [session, setSession] = React.useState(getCloudSession());

  React.useEffect(() => {
    setSession(getCloudSession());
  }, []);

  // Fetch invite details
  React.useEffect(() => {
    if (!token) return;

    fetch(`${appConfig.apiUrl}/api/workspaces/invites/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Invalid invitation link");
        setInviteInfo(data);
      })
      .catch((err) => {
        setError(err.message || "This invitation link is invalid, expired, or has already been used.");
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!session?.accessToken) {
      router.push(`/signup?redirect=/invite/${token}`);
      return;
    }

    setIsAccepting(true);
    setError(null);
    try {
      const res = await fetch(`${appConfig.apiUrl}/api/workspaces/invites/${token}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept invite");

      router.push(`/app/${session.id}/workspace/${data.workspaceId}`);
    } catch (err: any) {
      setError(err.message || "Could not accept invitation");
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <LokkerBrandIcon size="md" />
            <span className="font-heading font-bold text-lg tracking-tight text-foreground">Lokker</span>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Team Workspace Invitation</h1>
        </div>

        {/* Invite Card */}
        <div className="p-6 rounded-2xl border border-border-subtle bg-surface shadow-md space-y-5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Verifying invitation link...
            </div>
          ) : error ? (
            <div className="space-y-4 text-center py-4">
              <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">Invitation Unavailable</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/app")} className="h-8 text-xs cursor-pointer">
                Return to Lokker
              </Button>
            </div>
          ) : inviteInfo ? (
            <>
              <div className="space-y-3 text-center pb-2">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Building2 className="size-7" />
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 px-2 py-0.5">
                    Single-Use Team Invite
                  </Badge>
                  <h2 className="text-base font-bold text-foreground">{inviteInfo.workspaceName}</h2>
                  <p className="text-xs text-muted-foreground">
                    Invited by <strong className="text-foreground">{inviteInfo.adminName}</strong>
                  </p>
                </div>
                {inviteInfo.description && (
                  <p className="text-[11px] text-muted-foreground bg-background/50 border border-border-subtle p-2.5 rounded-lg">
                    {inviteInfo.description}
                  </p>
                )}
              </div>

              {/* Security info */}
              <div className="p-3 rounded-xl border border-border-subtle bg-muted/20 text-xs text-muted-foreground flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Join this workspace to securely share passwords and bookmarks with zero-knowledge end-to-end encryption.
                </p>
              </div>

              {/* Accept / Register Actions */}
              <div className="space-y-3 pt-2">
                {session ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground text-center">
                      Signed in as <strong className="text-foreground">{session.email}</strong>
                    </p>
                    <Button
                      onClick={handleAccept}
                      disabled={isAccepting}
                      className="w-full h-9 text-xs font-medium cursor-pointer"
                    >
                      {isAccepting ? "Joining Workspace..." : "Accept & Join Workspace"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground text-center">
                      Don&apos;t have an account? You can create one in seconds to accept this invitation.
                    </p>
                    <Button
                      onClick={() => router.push(`/signup?redirect=/invite/${token}`)}
                      className="w-full h-9 text-xs font-medium gap-1.5 cursor-pointer"
                    >
                      <span>Create Free Account & Join</span>
                      <ArrowRight className="size-3" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/login?redirect=/invite/${token}`)}
                      className="w-full h-8 text-xs cursor-pointer"
                    >
                      <span>Already have an account? Sign In</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

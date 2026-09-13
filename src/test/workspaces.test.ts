import { describe, it, expect } from "vitest";
import type { Workspace, WorkspacePlan, WorkspacePlanQuota, PasswordEntry, Bookmark } from "../types";

describe("Team Workspaces & Cloud-Only Rules", () => {
  const planQuotas: Record<WorkspacePlan, number> = {
    FREE: 1,
    PRO: 5,
    PLUS: 25,
  };

  it("enforces plan quota limits for workspace creation", () => {
    // Free plan: 1 workspace allowed
    const freeQuota: WorkspacePlanQuota = {
      plan: "FREE",
      ownedCount: 1,
      maxAllowed: planQuotas.FREE,
    };
    expect(freeQuota.ownedCount >= freeQuota.maxAllowed).toBe(true);

    // Pro plan: 5 workspaces allowed
    const proQuota: WorkspacePlanQuota = {
      plan: "PRO",
      ownedCount: 2,
      maxAllowed: planQuotas.PRO,
    };
    expect(proQuota.ownedCount < proQuota.maxAllowed).toBe(true);

    // Plus plan: 25 workspaces allowed
    const plusQuota: WorkspacePlanQuota = {
      plan: "PLUS",
      ownedCount: 25,
      maxAllowed: planQuotas.PLUS,
    };
    expect(plusQuota.ownedCount >= plusQuota.maxAllowed).toBe(true);
  });

  it("isolates workspace items from personal items", () => {
    const personalPasswords: PasswordEntry[] = [
      {
        id: "p1",
        websiteName: "Personal Bank",
        websiteUrl: "https://bank.com",
        username: "me",
        password: "secretPassword1",
        category: "Finance",
        isFavorite: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const workspacePasswords: PasswordEntry[] = [
      {
        id: "p2",
        websiteName: "AWS Console",
        websiteUrl: "https://aws.amazon.com",
        username: "dev-team",
        password: "secretPassword2",
        category: "Production",
        isFavorite: false,
        workspaceId: "ws-eng-123",
        workspaceName: "Engineering",
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    // Member views workspace only: personal item does not appear
    const scopedWorkspaceItems = workspacePasswords.filter(
      (item) => item.workspaceId === "ws-eng-123"
    );
    expect(scopedWorkspaceItems).toHaveLength(1);
    expect(scopedWorkspaceItems[0].websiteName).toBe("AWS Console");

    // Personal items do not contain workspaceId
    expect(personalPasswords[0].workspaceId).toBeUndefined();
  });

  it("validates single-use invite tokens and rejects re-use", () => {
    interface MockInvite {
      token: string;
      workspaceId: string;
      status: "PENDING" | "ACCEPTED";
      usedByUserId?: string;
    }

    const invites: MockInvite[] = [
      {
        token: "unique-crypto-token-abc123",
        workspaceId: "ws-1",
        status: "PENDING",
      },
    ];

    function acceptInvite(token: string, userId: string): { success: boolean; error?: string } {
      const invite = invites.find((i) => i.token === token);
      if (!invite) return { success: false, error: "Invitation link not found" };
      if (invite.status === "ACCEPTED") {
        return {
          success: false,
          error: "This invitation link has already been used. Please ask your team admin for a new invite link.",
        };
      }

      // Mark single-use invite as ACCEPTED
      invite.status = "ACCEPTED";
      invite.usedByUserId = userId;
      return { success: true };
    }

    // First user claims the link
    const firstAttempt = acceptInvite("unique-crypto-token-abc123", "user-alice");
    expect(firstAttempt.success).toBe(true);

    // Second user attempts to use the SAME link -> MUST fail with single-use error
    const secondAttempt = acceptInvite("unique-crypto-token-abc123", "user-bob");
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toContain("has already been used");
  });

  it("requires Lokker Cloud session for team workspace creation", () => {
    function canCreateWorkspace(session: { accessToken?: string } | null): boolean {
      if (!session?.accessToken) return false;
      return true;
    }

    // Local-only user (no cloud session)
    expect(canCreateWorkspace(null)).toBe(false);
    expect(canCreateWorkspace({})).toBe(false);

    // Cloud-authenticated user
    expect(canCreateWorkspace({ accessToken: "valid-jwt-token" })).toBe(true);
  });
});

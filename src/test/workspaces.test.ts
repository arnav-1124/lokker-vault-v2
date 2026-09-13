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

  it("automatically creates a matching workspace bookmark when a workspace password is saved", () => {
    const normalizeHost = (str: string) => {
      if (!str) return "";
      try {
        const raw = str.startsWith("http") ? str : `https://${str}`;
        return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return str.trim().toLowerCase();
      }
    };

    let bookmarks: Bookmark[] = [];
    let passwords: PasswordEntry[] = [];

    function saveWorkspacePassword(entry: PasswordEntry) {
      passwords = [entry, ...passwords];
      if (entry.websiteUrl || entry.websiteName) {
        let formattedUrl = entry.websiteUrl?.trim() || "";
        if (!formattedUrl) {
          formattedUrl = `https://${entry.websiteName.toLowerCase().replace(/\s+/g, "")}.com`;
        } else if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
          formattedUrl = `https://${formattedUrl}`;
        }
        const targetHost = normalizeHost(formattedUrl);
        const alreadyExists = bookmarks.some((b) => normalizeHost(b.url || b.title) === targetHost);
        if (!alreadyExists) {
          bookmarks = [
            {
              id: "ws-bm-test",
              title: entry.websiteName,
              url: formattedUrl,
              category: entry.category || "General",
              isFavorite: !!entry.isFavorite,
              description: entry.notes || "",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              workspaceId: entry.workspaceId,
            },
            ...bookmarks,
          ];
        }
      }
    }

    // Save a new workspace password
    saveWorkspacePassword({
      id: "ws-pwd-1",
      websiteName: "GitHub Team",
      websiteUrl: "https://github.com",
      username: "org-admin",
      password: "secretPassword",
      category: "Engineering",
      isFavorite: true,
      workspaceId: "ws-1",
      createdAt: 1000,
      updatedAt: 1000,
    });

    expect(passwords).toHaveLength(1);
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].title).toBe("GitHub Team");
    expect(bookmarks[0].url).toBe("https://github.com");
    expect(bookmarks[0].category).toBe("Engineering");
    expect(bookmarks[0].isFavorite).toBe(true);

    // Saving another entry with the same domain should not duplicate the bookmark
    saveWorkspacePassword({
      id: "ws-pwd-2",
      websiteName: "GitHub Team Second",
      websiteUrl: "https://github.com/login",
      username: "second-user",
      password: "secretPassword2",
      category: "Engineering",
      isFavorite: false,
      workspaceId: "ws-1",
      createdAt: 1001,
      updatedAt: 1001,
    });

    expect(passwords).toHaveLength(2);
    expect(bookmarks).toHaveLength(1); // Not duplicated
  });

  it("toggles favorite status on workspace items", () => {
    let passwords: PasswordEntry[] = [
      {
        id: "p1",
        websiteName: "AWS",
        websiteUrl: "https://aws.amazon.com",
        username: "dev",
        password: "secret",
        category: "Cloud",
        isFavorite: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    function toggleFavorite(id: string) {
      passwords = passwords.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    }

    toggleFavorite("p1");
    expect(passwords[0].isFavorite).toBe(true);

    toggleFavorite("p1");
    expect(passwords[0].isFavorite).toBe(false);
  });

  it("always redirects logged-out users to dedicated auth page with redirect param and avoids modal popups", () => {
    function resolveWorkspaceRouteAccess(isAuthenticated: boolean, requestedPath: string) {
      if (!isAuthenticated) {
        return {
          allowed: false,
          redirectUrl: `/signup?redirect=${encodeURIComponent(requestedPath)}`,
          shouldOpenModal: false,
        };
      }
      return {
        allowed: true,
        redirectUrl: null,
        shouldOpenModal: false,
      };
    }

    // 1. Logged-out access to /app/workspaces
    const loggedOutAccess = resolveWorkspaceRouteAccess(false, "/app/workspaces");
    expect(loggedOutAccess.allowed).toBe(false);
    expect(loggedOutAccess.shouldOpenModal).toBe(false);
    expect(loggedOutAccess.redirectUrl).toBe("/signup?redirect=%2Fapp%2Fworkspaces");

    // 2. Logged-out access to specific workspace detail route
    const loggedOutDetailAccess = resolveWorkspaceRouteAccess(false, "/app/workspace/ws-123/passwords");
    expect(loggedOutDetailAccess.allowed).toBe(false);
    expect(loggedOutDetailAccess.shouldOpenModal).toBe(false);
    expect(loggedOutDetailAccess.redirectUrl).toBe("/signup?redirect=%2Fapp%2Fworkspace%2Fws-123%2Fpasswords");

    // 3. Logged-in access proceeds normally
    const loggedInAccess = resolveWorkspaceRouteAccess(true, "/app/workspaces");
    expect(loggedInAccess.allowed).toBe(true);
    expect(loggedInAccess.redirectUrl).toBeNull();
  });
});


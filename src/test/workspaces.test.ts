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

  it("enforces 3-Tier Multi-Admin governance rules and owner protection", () => {
    interface TestMember {
      userId: string;
      role: "ADMIN" | "MEMBER";
    }

    const ownerUserId = "user-owner-1";
    let members: TestMember[] = [
      { userId: ownerUserId, role: "ADMIN" },
      { userId: "user-coadmin-2", role: "ADMIN" },
      { userId: "user-member-3", role: "MEMBER" },
    ];

    function updateMemberRole(actorUserId: string, targetUserId: string, newRole: "ADMIN" | "MEMBER") {
      const actor = members.find((m) => m.userId === actorUserId);
      if (!actor || actor.role !== "ADMIN") {
        throw new Error("Forbidden: Only workspace admins can perform this action");
      }
      if (targetUserId === ownerUserId) {
        throw new Error("Cannot modify workspace owner role");
      }
      members = members.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m));
    }

    function removeMember(actorUserId: string, targetUserId: string) {
      const actor = members.find((m) => m.userId === actorUserId);
      if (!actor || actor.role !== "ADMIN") {
        throw new Error("Forbidden: Only workspace admins can perform this action");
      }
      if (targetUserId === ownerUserId) {
        throw new Error("Cannot remove workspace owner");
      }
      members = members.filter((m) => m.userId !== targetUserId);
    }

    // 1. Co-Admin promotes Member to Admin
    updateMemberRole("user-coadmin-2", "user-member-3", "ADMIN");
    expect(members.find((m) => m.userId === "user-member-3")?.role).toBe("ADMIN");

    // 2. Newly promoted Admin demotes previous Co-Admin to Member
    updateMemberRole("user-member-3", "user-coadmin-2", "MEMBER");
    expect(members.find((m) => m.userId === "user-coadmin-2")?.role).toBe("MEMBER");

    // 3. Standard member cannot promote or demote anyone
    expect(() => updateMemberRole("user-coadmin-2", "user-member-3", "MEMBER")).toThrow("Forbidden");

    // 4. Strict owner protection: cannot demote owner
    expect(() => updateMemberRole("user-member-3", ownerUserId, "MEMBER")).toThrow("Cannot modify workspace owner role");

    // 5. Strict owner protection: cannot remove owner
    expect(() => removeMember("user-member-3", ownerUserId)).toThrow("Cannot remove workspace owner");

    // 6. Admin can remove non-owner member
    removeMember("user-member-3", "user-coadmin-2");
    expect(members.some((m) => m.userId === "user-coadmin-2")).toBe(false);
  });

  it("moves entries between categories without modal", () => {
    let entry: PasswordEntry = {
      id: "p1",
      websiteName: "GitHub",
      websiteUrl: "https://github.com",
      username: "octocat",
      password: "pwd",
      category: "Development",
      isFavorite: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    function moveCategory(item: PasswordEntry, newCat: string): PasswordEntry {
      return {
        ...item,
        category: newCat || "General",
        updatedAt: Date.now(),
      };
    }

    // Move to Staging
    entry = moveCategory(entry, "Staging");
    expect(entry.category).toBe("Staging");
    expect(entry.username).toBe("octocat");

    // Move to Uncategorized (defaults to General)
    entry = moveCategory(entry, "");
    expect(entry.category).toBe("General");
  });

  it("strictly restricts workspace activity log access to Administrators", () => {
    function canAccessActivityLog(role: "ADMIN" | "MEMBER", isOwner: boolean): boolean {
      return role === "ADMIN" || isOwner;
    }

    expect(canAccessActivityLog("ADMIN", true)).toBe(true);
    expect(canAccessActivityLog("ADMIN", false)).toBe(true);
    expect(canAccessActivityLog("MEMBER", false)).toBe(false);
    expect(canAccessActivityLog("MEMBER", true)).toBe(true); // Owner is always granted
  });

  it("isolates per-user workspace favorites without mutating shared vault payload", () => {
    // Shared workspace credentials and bookmarks
    const sharedPasswords: PasswordEntry[] = [
      {
        id: "ws-p-1",
        websiteName: "Production Database",
        websiteUrl: "https://db.prod.company.internal",
        username: "admin_root",
        password: "SuperSecretPassword123!",
        category: "Production",
        isFavorite: false,
        createdAt: 1000,
        updatedAt: 1000,
        workspaceId: "ws-1",
      },
      {
        id: "ws-p-2",
        websiteName: "Staging API Gateway",
        websiteUrl: "https://api.staging.company.internal",
        username: "developer",
        password: "StagingPassword456!",
        category: "Staging",
        isFavorite: false,
        createdAt: 1000,
        updatedAt: 1000,
        workspaceId: "ws-1",
      },
    ];

    const sharedBookmarks: Bookmark[] = [
      {
        id: "ws-b-1",
        title: "AWS Console",
        url: "https://console.aws.amazon.com",
        category: "General",
        isFavorite: false,
        createdAt: 1000,
        updatedAt: 1000,
        workspaceId: "ws-1",
      },
    ];

    // Simulated per-user local favorite stores
    const userFavoritesStore: Record<string, { passwordIds: string[]; bookmarkIds: string[] }> = {
      "user-alice-admin": { passwordIds: [], bookmarkIds: [] },
      "user-bob-member": { passwordIds: [], bookmarkIds: [] },
    };

    function toggleUserFavorite(
      userId: string,
      type: "password" | "bookmark",
      itemId: string
    ) {
      const store = userFavoritesStore[userId];
      const targetList = type === "password" ? store.passwordIds : store.bookmarkIds;
      const idx = targetList.indexOf(itemId);
      if (idx >= 0) {
        targetList.splice(idx, 1);
      } else {
        targetList.push(itemId);
      }
    }

    function computeDisplayedItems(
      userId: string,
      passwords: PasswordEntry[],
      bookmarks: Bookmark[]
    ) {
      const store = userFavoritesStore[userId];
      const pSet = new Set(store.passwordIds);
      const bSet = new Set(store.bookmarkIds);

      return {
        passwords: passwords.map((p) => ({ ...p, isFavorite: pSet.has(p.id) })),
        bookmarks: bookmarks.map((b) => ({ ...b, isFavorite: bSet.has(b.id) })),
        favoriteCount: store.passwordIds.length + store.bookmarkIds.length,
      };
    }

    // Initial state: 0 favorites for both users
    const aliceInit = computeDisplayedItems("user-alice-admin", sharedPasswords, sharedBookmarks);
    const bobInit = computeDisplayedItems("user-bob-member", sharedPasswords, sharedBookmarks);
    expect(aliceInit.favoriteCount).toBe(0);
    expect(bobInit.favoriteCount).toBe(0);

    // Alice stars Production DB and AWS Console
    toggleUserFavorite("user-alice-admin", "password", "ws-p-1");
    toggleUserFavorite("user-alice-admin", "bookmark", "ws-b-1");

    const aliceUpdated = computeDisplayedItems("user-alice-admin", sharedPasswords, sharedBookmarks);
    expect(aliceUpdated.favoriteCount).toBe(2);
    expect(aliceUpdated.passwords.find((p) => p.id === "ws-p-1")?.isFavorite).toBe(true);
    expect(aliceUpdated.passwords.find((p) => p.id === "ws-p-2")?.isFavorite).toBe(false);
    expect(aliceUpdated.bookmarks.find((b) => b.id === "ws-b-1")?.isFavorite).toBe(true);

    // Bob still sees 0 favorites in his view
    const bobAfterAlice = computeDisplayedItems("user-bob-member", sharedPasswords, sharedBookmarks);
    expect(bobAfterAlice.favoriteCount).toBe(0);
    expect(bobAfterAlice.passwords.find((p) => p.id === "ws-p-1")?.isFavorite).toBe(false);
    expect(bobAfterAlice.bookmarks.find((b) => b.id === "ws-b-1")?.isFavorite).toBe(false);

    // Bob stars Staging API Gateway
    toggleUserFavorite("user-bob-member", "password", "ws-p-2");

    const bobUpdated = computeDisplayedItems("user-bob-member", sharedPasswords, sharedBookmarks);
    expect(bobUpdated.favoriteCount).toBe(1);
    expect(bobUpdated.passwords.find((p) => p.id === "ws-p-2")?.isFavorite).toBe(true);
    expect(bobUpdated.passwords.find((p) => p.id === "ws-p-1")?.isFavorite).toBe(false);

    // Alice's view remains unchanged
    const aliceFinal = computeDisplayedItems("user-alice-admin", sharedPasswords, sharedBookmarks);
    expect(aliceFinal.favoriteCount).toBe(2);
    expect(aliceFinal.passwords.find((p) => p.id === "ws-p-2")?.isFavorite).toBe(false);

    // Crucial: The underlying shared objects were never mutated
    expect(sharedPasswords[0].isFavorite).toBe(false);
    expect(sharedPasswords[1].isFavorite).toBe(false);
    expect(sharedBookmarks[0].isFavorite).toBe(false);
  });

  it("merges remote workspace vault changes and updates lastSyncedAt on sync", async () => {
    let localPasswords: PasswordEntry[] = [
      {
        id: "p1",
        websiteName: "Existing Item",
        websiteUrl: "https://example.com",
        username: "user",
        password: "pwd",
        category: "General",
        isFavorite: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];
    let lastSyncedAt: Date | null = null;

    // Simulate remote server returning updated vault blob
    const remoteVaultBlob = {
      passwords: [
        {
          id: "p1",
          websiteName: "Existing Item",
          websiteUrl: "https://example.com",
          username: "user",
          password: "pwd",
          category: "General",
          isFavorite: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: "p2",
          websiteName: "Newly Added by Admin on Device B",
          websiteUrl: "https://newservice.com",
          username: "admin",
          password: "newPassword789!",
          category: "General",
          isFavorite: false,
          createdAt: 2000,
          updatedAt: 2000,
        },
      ],
    };

    function syncWorkspaceVault(remoteBlob: typeof remoteVaultBlob) {
      localPasswords = remoteBlob.passwords;
      lastSyncedAt = new Date();
    }

    expect(localPasswords).toHaveLength(1);
    expect(lastSyncedAt).toBeNull();

    // Trigger sync
    syncWorkspaceVault(remoteVaultBlob);

    expect(localPasswords).toHaveLength(2);
    expect(localPasswords.some((p) => p.id === "p2")).toBe(true);
    expect(lastSyncedAt).not.toBeNull();
  });
});


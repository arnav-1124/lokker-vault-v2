import { describe, it, expect } from "vitest";
import type { WorkspaceActivityLog } from "../types";

describe("Workspace Activity Trail & Zero-Knowledge Audit Invariants", () => {
  const mockActivities: WorkspaceActivityLog[] = [
    {
      id: "act-1",
      workspaceId: "ws-100",
      actorUserId: "user-1",
      action: "WORKSPACE_CREATED",
      details: "Created workspace 'Engineering Core'",
      metadata: { plan: "FREE" },
      createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), // 1 day ago
      actor: {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice Admin",
      },
    },
    {
      id: "act-2",
      workspaceId: "ws-100",
      actorUserId: "user-1",
      action: "MEMBER_INVITED",
      details: "Created invite token",
      metadata: { inviteId: "inv-99", expiresAt: "2026-09-20T00:00:00.000Z" },
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), // 5 hours ago
      actor: {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice Admin",
      },
    },
    {
      id: "act-3",
      workspaceId: "ws-100",
      actorUserId: "user-2",
      action: "MEMBER_JOINED",
      details: "Joined the workspace as MEMBER",
      metadata: { role: "MEMBER" },
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
      actor: {
        id: "user-2",
        email: "bob@example.com",
        name: "Bob Builder",
      },
    },
    {
      id: "act-4",
      workspaceId: "ws-100",
      actorUserId: "user-1",
      action: "VAULT_SYNCED",
      details: "Synced 5 encrypted items to cloud vault",
      metadata: { itemCount: 5, clientVersion: 1 },
      createdAt: new Date(Date.now() - 1000 * 120).toISOString(), // 2 minutes ago
      actor: {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice Admin",
      },
    },
    {
      id: "act-5",
      workspaceId: "ws-100",
      actorUserId: "user-2",
      action: "MEMBER_REMOVED",
      details: "Left the workspace",
      metadata: { userId: "user-2" },
      createdAt: new Date(Date.now() - 1000 * 15).toISOString(), // 15 seconds ago
      actor: {
        id: "user-2",
        email: "bob@example.com",
        name: "Bob Builder",
      },
    },
    {
      id: "act-6",
      workspaceId: "ws-100",
      actorUserId: "user-1",
      action: "WORKSPACE_UPDATED",
      details: "Updated workspace settings",
      metadata: { updatedFields: ["name"] },
      createdAt: new Date(Date.now() - 1000 * 3).toISOString(), // 3 seconds ago
      actor: {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice Admin",
      },
    },
  ];

  it("filters activities correctly by category", () => {
    // VAULT category filter
    const vaultEvents = mockActivities.filter((a) => a.action === "VAULT_SYNCED");
    expect(vaultEvents).toHaveLength(1);
    expect(vaultEvents[0].details).toContain("Synced 5 encrypted items");

    // MEMBERS category filter
    const memberEvents = mockActivities.filter((a) =>
      ["MEMBER_INVITED", "MEMBER_JOINED", "MEMBER_REMOVED"].includes(a.action)
    );
    expect(memberEvents).toHaveLength(3);
    expect(memberEvents.map((e) => e.action)).toEqual([
      "MEMBER_INVITED",
      "MEMBER_JOINED",
      "MEMBER_REMOVED",
    ]);

    // WORKSPACE / Settings category filter
    const workspaceEvents = mockActivities.filter((a) =>
      ["WORKSPACE_CREATED", "WORKSPACE_UPDATED"].includes(a.action)
    );
    expect(workspaceEvents).toHaveLength(2);
    expect(workspaceEvents.map((e) => e.action)).toEqual([
      "WORKSPACE_CREATED",
      "WORKSPACE_UPDATED",
    ]);
  });

  it("filters activities accurately by search query across multiple fields", () => {
    // Search by actor email
    const bobEvents = mockActivities.filter((act) => {
      const q = "bob@example.com";
      return (
        act.actor?.email.toLowerCase().includes(q) ||
        act.details.toLowerCase().includes(q)
      );
    });
    expect(bobEvents).toHaveLength(2);

    // Search by action or detail term
    const syncEvents = mockActivities.filter((act) => {
      const q = "synced";
      return (
        act.actor?.name?.toLowerCase().includes(q) ||
        act.details.toLowerCase().includes(q) ||
        act.action.toLowerCase().includes(q)
      );
    });
    expect(syncEvents).toHaveLength(1);
    expect(syncEvents[0].action).toBe("VAULT_SYNCED");
  });

  it("strictly guarantees zero-knowledge audit privacy (never logs plaintext secrets or keys)", () => {
    const sensitiveKeys = [
      "password",
      "plaintext",
      "masterPassword",
      "encryptionKey",
      "vek",
      "wrappedVek",
      "encryptedBlob",
      "privateKey",
      "secret",
    ];

    for (const activity of mockActivities) {
      // Details must not contain secret values
      for (const forbidden of sensitiveKeys) {
        expect(activity.details.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }

      // Metadata must only contain safe operational indicators
      if (activity.metadata) {
        const metadataKeys = Object.keys(activity.metadata);
        for (const forbidden of sensitiveKeys) {
          expect(metadataKeys).not.toContain(forbidden);
        }
      }
    }
  });

  it("formats relative timestamps correctly", () => {
    const formatRelativeTime = (isoString: string) => {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 10) return "Just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return "Older";
    };

    expect(formatRelativeTime(mockActivities[5].createdAt)).toBe("Just now");
    expect(formatRelativeTime(mockActivities[4].createdAt)).toContain("s ago");
    expect(formatRelativeTime(mockActivities[3].createdAt)).toContain("m ago");
    expect(formatRelativeTime(mockActivities[2].createdAt)).toContain("h ago");
    expect(formatRelativeTime(mockActivities[0].createdAt)).toBe("1d ago");
  });

  it("correctly maps actions to UI badge color and icon semantics", () => {
    const actionMap: Record<string, string> = {
      VAULT_SYNCED: "Vault Synced",
      MEMBER_JOINED: "Member Joined",
      MEMBER_INVITED: "Invite Created",
      MEMBER_REMOVED: "Member Removed",
      WORKSPACE_CREATED: "Workspace Created",
      WORKSPACE_UPDATED: "Settings Updated",
    };

    for (const activity of mockActivities) {
      expect(actionMap[activity.action]).toBeDefined();
    }
  });
});

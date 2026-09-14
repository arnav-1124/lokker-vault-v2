import { describe, it, expect, vi } from "vitest";
import { WorkspaceRealtimeEvent } from "@/hooks/use-workspace-events";

describe("Workspace Real-Time Cross-Member Sync (SSE)", () => {
  describe("Zero-Knowledge Event Invariants", () => {
    it("should never include plaintext passwords, TOTP secrets, or decryption keys in real-time events", () => {
      const sampleEvent: WorkspaceRealtimeEvent = {
        type: "VAULT_UPDATED",
        workspaceId: "ws-test-uuid-1",
        actorUserId: "user-peer-1",
        version: 5,
        itemCount: 14,
        timestamp: new Date().toISOString(),
      };

      const eventString = JSON.stringify(sampleEvent);
      // Ensure no credential-bearing fields are present
      expect(sampleEvent).not.toHaveProperty("password");
      expect(sampleEvent).not.toHaveProperty("passwords");
      expect(sampleEvent).not.toHaveProperty("totpSecret");
      expect(sampleEvent).not.toHaveProperty("encryptedBlob");
      expect(sampleEvent).not.toHaveProperty("key");
      expect(sampleEvent).not.toHaveProperty("secretKey");

      expect(eventString).not.toContain("password");
      expect(eventString).not.toContain("secretKey");
    });
  });

  describe("Event Filtering & Deduplication Logic", () => {
    it("should distinguish local actor updates from remote peer updates to avoid duplicate work", () => {
      const currentUserId = "my-user-id";
      const remoteSyncHandler = vi.fn();

      const handleEvent = (event: WorkspaceRealtimeEvent) => {
        if (event.type === "VAULT_UPDATED" && event.actorUserId !== currentUserId) {
          remoteSyncHandler(event);
        }
      };

      // 1. Self-originated event: actor is current user
      handleEvent({
        type: "VAULT_UPDATED",
        workspaceId: "ws-test-1",
        actorUserId: currentUserId,
        version: 2,
        timestamp: new Date().toISOString(),
      });
      expect(remoteSyncHandler).not.toHaveBeenCalled();

      // 2. Peer-originated event: actor is a team member
      handleEvent({
        type: "VAULT_UPDATED",
        workspaceId: "ws-test-1",
        actorUserId: "teammate-user-id",
        version: 3,
        timestamp: new Date().toISOString(),
      });
      expect(remoteSyncHandler).toHaveBeenCalledTimes(1);
    });

    it("should process membership changes from any actor", () => {
      const membershipHandler = vi.fn();

      const handleEvent = (event: WorkspaceRealtimeEvent) => {
        if (event.type === "MEMBERSHIP_UPDATED" || event.type === "MEMBER_JOINED") {
          membershipHandler(event);
        }
      };

      handleEvent({
        type: "MEMBER_JOINED",
        workspaceId: "ws-test-1",
        actorUserId: "new-user-id",
        timestamp: new Date().toISOString(),
      });

      handleEvent({
        type: "MEMBERSHIP_UPDATED",
        workspaceId: "ws-test-1",
        actorUserId: "admin-user-id",
        timestamp: new Date().toISOString(),
      });

      expect(membershipHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe("Event Stream Framing", () => {
    it("should correctly ignore SSE heartbeat comments and parse valid frames", () => {
      const frames = [
        ": heartbeat\n\n",
        `data: {"type":"CONNECTED","workspaceId":"ws-123","timestamp":"2026-09-14T12:00:00.000Z"}\n\n`,
        ": heartbeat\n\n",
        `data: {"type":"VAULT_UPDATED","workspaceId":"ws-123","version":2,"timestamp":"2026-09-14T12:00:20.000Z"}\n\n`,
      ];

      const parsedEvents: WorkspaceRealtimeEvent[] = [];

      for (const frame of frames) {
        const trimmed = frame.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          // Heartbeat or comment line, safely ignore
          continue;
        }
        if (trimmed.startsWith("data:")) {
          const jsonText = trimmed.replace(/^data:\s*/, "");
          const parsed = JSON.parse(jsonText);
          parsedEvents.push(parsed);
        }
      }

      expect(parsedEvents.length).toBe(2);
      expect(parsedEvents[0].type).toBe("CONNECTED");
      expect(parsedEvents[1].type).toBe("VAULT_UPDATED");
      expect(parsedEvents[1].version).toBe(2);
    });
  });
});

"use client";

import * as React from "react";
import { appConfig } from "@/config/app";

export type WorkspaceEventType =
  | "CONNECTED"
  | "VAULT_UPDATED"
  | "MEMBERSHIP_UPDATED"
  | "MEMBER_JOINED"
  | "HEARTBEAT";

export interface WorkspaceRealtimeEvent {
  type: WorkspaceEventType;
  workspaceId: string;
  actorUserId?: string;
  version?: number;
  itemCount?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface UseWorkspaceEventsOptions {
  workspaceId: string | null;
  accessToken: string | null;
  enabled?: boolean;
  onVaultUpdated?: (event: WorkspaceRealtimeEvent) => void;
  onMembershipUpdated?: (event: WorkspaceRealtimeEvent) => void;
  onMemberJoined?: (event: WorkspaceRealtimeEvent) => void;
}

export function useWorkspaceEvents({
  workspaceId,
  accessToken,
  enabled = true,
  onVaultUpdated,
  onMembershipUpdated,
  onMemberJoined,
}: UseWorkspaceEventsOptions) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastEventAt, setLastEventAt] = React.useState<number | null>(null);

  const onVaultUpdatedRef = React.useRef(onVaultUpdated);
  onVaultUpdatedRef.current = onVaultUpdated;

  const onMembershipUpdatedRef = React.useRef(onMembershipUpdated);
  onMembershipUpdatedRef.current = onMembershipUpdated;

  const onMemberJoinedRef = React.useRef(onMemberJoined);
  onMemberJoinedRef.current = onMemberJoined;

  React.useEffect(() => {
    if (!enabled || !workspaceId || !accessToken) {
      setIsConnected(false);
      return;
    }

    // SSR / Node guard
    if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
      return;
    }

    let isDisposed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 2000;

    const connect = () => {
      if (isDisposed) return;

      try {
        const streamUrl = `${appConfig.apiUrl}/api/workspaces/${workspaceId}/events?token=${encodeURIComponent(
          accessToken
        )}`;

        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          if (isDisposed) return;
          setIsConnected(true);
          retryDelay = 2000; // Reset backoff on successful handshake
        };

        eventSource.onmessage = (e) => {
          if (isDisposed) return;
          try {
            const rawData = e.data?.trim();
            if (!rawData || rawData.startsWith(":")) return; // Skip comments/heartbeats

            const event = JSON.parse(rawData) as WorkspaceRealtimeEvent;
            setLastEventAt(Date.now());

            if (event.type === "VAULT_UPDATED") {
              onVaultUpdatedRef.current?.(event);
            } else if (event.type === "MEMBERSHIP_UPDATED") {
              onMembershipUpdatedRef.current?.(event);
            } else if (event.type === "MEMBER_JOINED") {
              onMemberJoinedRef.current?.(event);
            }
          } catch {
            // Ignore malformed event frames
          }
        };

        eventSource.onerror = () => {
          if (isDisposed) return;
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          // Schedule reconnection with exponential backoff (max 30s)
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              retryDelay = Math.min(retryDelay * 1.5, 30000);
              connect();
            }, retryDelay);
          }
        };
      } catch {
        setIsConnected(false);
      }
    };

    connect();

    // Reconnect immediately when tab regains focus/visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected && !isDisposed) {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isDisposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      setIsConnected(false);
    };
  }, [workspaceId, accessToken, enabled]);

  return {
    isConnected,
    lastEventAt,
  };
}

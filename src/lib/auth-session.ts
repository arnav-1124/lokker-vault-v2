"use client";

export const CLOUD_SESSION_STORAGE_KEY = "lokker_cloud_session";
export const CLOUD_AUTH_CHANGE_EVENT = "lokker_auth_change";

export interface CloudSessionUser {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  name?: string | null;
  accessToken: string;
  refreshToken?: string | null;
}

/**
 * Retrieves the currently active cloud user session, if any.
 */
export function getCloudSession(): CloudSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLOUD_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

import { identifyPostHogUser, resetPostHogUser } from "@/components/providers/posthog-provider";
import { appConfig } from "@/config/app";

/**
 * Persists cloud user session, sets the auth cookie, and broadcasts an auth change event.
 */
export function setCloudSession(session: CloudSessionUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLOUD_SESSION_STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${CLOUD_SESSION_STORAGE_KEY}=1; path=/; max-age=604800; SameSite=Lax`;
  identifyPostHogUser(session.id);
  window.dispatchEvent(new CustomEvent(CLOUD_AUTH_CHANGE_EVENT, { detail: session }));
}

/**
 * Clears cloud user session, clears auth cookie, and broadcasts an auth change event.
 */
export function clearCloudSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLOUD_SESSION_STORAGE_KEY);
  document.cookie = `${CLOUD_SESSION_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  resetPostHogUser();
  window.dispatchEvent(new CustomEvent(CLOUD_AUTH_CHANGE_EVENT, { detail: null }));
}

/**
 * Attempts to silently refresh the access token using the stored refresh token.
 */
export async function refreshCloudSession(): Promise<CloudSessionUser | null> {
  if (typeof window === "undefined") return null;
  const current = getCloudSession();
  if (!current?.refreshToken) return null;

  try {
    const res = await fetch(`${appConfig.apiUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.accessToken) {
      const refreshed: CloudSessionUser = {
        ...current,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || current.refreshToken,
      };
      setCloudSession(refreshed);
      return refreshed;
    }
    return null;
  } catch {
    return null;
  }
}

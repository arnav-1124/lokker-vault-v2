"use client";

export const CLOUD_SESSION_STORAGE_KEY = "lokker_cloud_session";
export const CLOUD_AUTH_CHANGE_EVENT = "lokker_auth_change";

export interface CloudSessionUser {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  name?: string | null;
  accessToken: string;
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

/**
 * Persists cloud user session, sets the auth cookie, and broadcasts an auth change event.
 */
export function setCloudSession(session: CloudSessionUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLOUD_SESSION_STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${CLOUD_SESSION_STORAGE_KEY}=1; path=/; max-age=604800; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(CLOUD_AUTH_CHANGE_EVENT, { detail: session }));
}

/**
 * Clears cloud user session, clears auth cookie, and broadcasts an auth change event.
 */
export function clearCloudSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLOUD_SESSION_STORAGE_KEY);
  document.cookie = `${CLOUD_SESSION_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(CLOUD_AUTH_CHANGE_EVENT, { detail: null }));
}

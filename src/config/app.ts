/**
 * Single source of truth for product identity values used across the app.
 * Keep this file framework-free so any layer can read it.
 *
 * `NEXT_PUBLIC_APP_URL` is the only place the deployed origin is configured:
 * - Local development falls back to http://localhost:3000 (see .env.example).
 * - Production sets it in the host's environment (e.g. Vercel project settings).
 */
const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");

export const appConfig = {
  name: "Lokker",
  tagline: "Privacy-first password vault",
  description:
    "Lokker is a privacy-first, local-first password vault and browser security utility. Your secrets stay on your device.",
  url: envUrl && envUrl.length > 0 ? envUrl : "http://localhost:3000",
} as const;

export type AppConfig = typeof appConfig;

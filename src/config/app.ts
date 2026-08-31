/**
 * Single source of truth for product identity values used across the app.
 * Keep this file framework-free so any layer can read it.
 */
export const appConfig = {
  name: "Lokker",
  tagline: "Privacy-first password vault",
  description:
    "Lokker is a privacy-first, local-first password vault and browser security utility. Your secrets stay on your device.",
  url: "http://localhost:3000",
} as const;

export type AppConfig = typeof appConfig;

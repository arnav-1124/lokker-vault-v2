import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import manifest from "@/app/manifest";
import { usePWA, BeforeInstallPromptEvent } from "@/hooks/use-pwa";

describe("PWA & Offline Capability Suite", () => {
  describe("Web App Manifest (manifest.ts)", () => {
    it("exports a valid W3C Web App Manifest with standalone display and Lokker branding", () => {
      const pwaManifest = manifest();

      expect(pwaManifest.name).toBe("Lokker — Zero-Knowledge Password Vault");
      expect(pwaManifest.short_name).toBe("Lokker");
      expect(pwaManifest.start_url).toBe("/app");
      expect(pwaManifest.scope).toBe("/");
      expect(pwaManifest.display).toBe("standalone");
      expect(pwaManifest.background_color).toBe("#090d16");
      expect(pwaManifest.theme_color).toBe("#090d16");
      expect(pwaManifest.categories).toContain("security");
      expect(pwaManifest.categories).toContain("utilities");
    });

    it("declares 192x192, 512x512, maskable, and SVG icons in the manifest", () => {
      const pwaManifest = manifest();
      const icons = pwaManifest.icons || [];

      expect(icons.length).toBeGreaterThanOrEqual(4);

      const icon192 = icons.find((i) => i.sizes === "192x192");
      expect(icon192).toBeDefined();
      expect(icon192?.src).toBe("/icons/icon-192x192.png");

      const icon512 = icons.find((i) => i.sizes === "512x512" && i.purpose !== "maskable");
      expect(icon512).toBeDefined();
      expect(icon512?.src).toBe("/icons/icon-512x512.png");

      const iconMaskable = icons.find((i) => i.purpose === "maskable");
      expect(iconMaskable).toBeDefined();
      expect(iconMaskable?.src).toBe("/icons/icon-maskable-512x512.png");

      const iconSvg = icons.find((i) => i.type === "image/svg+xml");
      expect(iconSvg).toBeDefined();
    });

    it("verifies physical existence of all declared PWA icon files on disk", () => {
      const pwaManifest = manifest();
      const icons = pwaManifest.icons || [];

      for (const icon of icons) {
        const relativePath = icon.src.replace(/^\//, "");
        const absolutePath = path.resolve("public", relativePath);
        expect(fs.existsSync(absolutePath)).toBe(true);

        const stats = fs.statSync(absolutePath);
        expect(stats.size).toBeGreaterThan(100); // Verify non-empty valid image
      }
    });

    it("configures rich OS quick shortcuts to Passwords, 2FA, Generator, and Health Audit", () => {
      const pwaManifest = manifest();
      const shortcuts = pwaManifest.shortcuts || [];

      expect(shortcuts.length).toBe(4);
      expect(shortcuts.map((s) => s.url)).toEqual([
        "/app/passwords",
        "/app/totp",
        "/app/generator",
        "/app/security-audit",
      ]);
    });
  });

  describe("Production Service Worker (public/sw.js)", () => {
    const swPath = path.resolve("public/sw.js");

    it("exists and contains valid caching lifecycle declarations", () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const swCode = fs.readFileSync(swPath, "utf-8");

      expect(swCode).toContain("CACHE_NAME");
      expect(swCode).toContain("PRECACHE_ASSETS");
      expect(swCode).toContain("self.skipWaiting()");
      expect(swCode).toContain("self.clients.claim()");
    });

    it("precaches essential app shell routes and manifest", () => {
      const swCode = fs.readFileSync(swPath, "utf-8");

      expect(swCode).toContain('"/app"');
      expect(swCode).toContain('"/favicon.svg"');
      expect(swCode).toContain('"/manifest.webmanifest"');
      expect(swCode).toContain('"/icons/icon-192x192.png"');
      expect(swCode).toContain('"/icons/icon-512x512.png"');
    });

    it("strictly excludes dynamic /api/ routes and server endpoints to uphold zero-knowledge security", () => {
      const swCode = fs.readFileSync(swPath, "utf-8");

      expect(swCode).toContain("isExemptFromCache");
      expect(swCode).toContain('/api/');
      expect(swCode).toContain("lokker-server");
      expect(swCode).toContain("chrome-extension:");
    });

    it("implements network-first navigation fallback for offline access", () => {
      const swCode = fs.readFileSync(swPath, "utf-8");

      expect(swCode).toContain('request.mode === "navigate"');
      expect(swCode).toContain("caches.match");
      expect(swCode).toContain('"/app"');
    });
  });

  describe("usePWA Hook Lifecycle & State", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("tracks online and offline network events dynamically", () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        window.dispatchEvent(new Event("offline"));
      });
      expect(result.current.isOnline).toBe(false);

      // Simulate network reconnection
      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(result.current.isOnline).toBe(true);
    });

    it("captures beforeinstallprompt, marks app as installable, and triggers native prompt", async () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstallable).toBe(false);

      const promptMock = vi.fn().mockResolvedValue(undefined);
      const mockEvent = new Event("beforeinstallprompt") as unknown as BeforeInstallPromptEvent;
      Object.defineProperty(mockEvent, "prompt", { value: promptMock });
      Object.defineProperty(mockEvent, "userChoice", {
        value: Promise.resolve({ outcome: "accepted", platform: "web" }),
      });

      // Dispatch beforeinstallprompt
      act(() => {
        window.dispatchEvent(mockEvent);
      });

      expect(result.current.isInstallable).toBe(true);

      // Trigger installApp()
      let outcome = false;
      await act(async () => {
        outcome = await result.current.installApp();
      });

      expect(promptMock).toHaveBeenCalledTimes(1);
      expect(outcome).toBe(true);
      expect(result.current.isInstallable).toBe(false);
    });

    it("handles dismissed install prompt gracefully", async () => {
      const { result } = renderHook(() => usePWA());

      const promptMock = vi.fn().mockResolvedValue(undefined);
      const mockEvent = new Event("beforeinstallprompt") as unknown as BeforeInstallPromptEvent;
      Object.defineProperty(mockEvent, "prompt", { value: promptMock });
      Object.defineProperty(mockEvent, "userChoice", {
        value: Promise.resolve({ outcome: "dismissed", platform: "web" }),
      });

      act(() => {
        window.dispatchEvent(mockEvent);
      });

      expect(result.current.isInstallable).toBe(true);

      let outcome = true;
      await act(async () => {
        outcome = await result.current.installApp();
      });

      expect(promptMock).toHaveBeenCalled();
      expect(outcome).toBe(false);
    });

    it("updates standalone status upon appinstalled event", () => {
      const { result } = renderHook(() => usePWA());

      act(() => {
        window.dispatchEvent(new Event("appinstalled"));
      });

      expect(result.current.isStandalone).toBe(true);
      expect(result.current.isInstallable).toBe(false);
    });

    it("detects standalone display mode via window.matchMedia", () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => usePWA());
      expect(result.current.isStandalone).toBe(true);

      window.matchMedia = originalMatchMedia;
    });
  });

  describe("PWA UI Components", () => {
    it("renders PWA card and network status in SettingsView", async () => {
      const { render, screen } = await import("@testing-library/react");
      const { SettingsView } = await import("@/components/views/settings-view");

      const dummySettings = {
        autoLockMinutes: 15,
        requireConfirmationForAutofill: true,
        theme: "dark" as const,
        categories: [],
        trustedDomains: [],
      };

      render(
        <SettingsView
          settings={dummySettings}
          onUpdateSettings={vi.fn()}
          onExportJSON={vi.fn()}
          onExportCSV={vi.fn()}
          onImportFile={vi.fn()}
          onResetVault={vi.fn()}
          isUnlocked={true}
          onOpenExtensionGuide={vi.fn()}
        />
      );

      expect(screen.getByText("Desktop & Mobile PWA App")).toBeDefined();
      expect(screen.getByText(/Network:/)).toBeDefined();
      expect(screen.getByText(/IndexedDB Encrypted At Rest/)).toBeDefined();
    });
  });
});

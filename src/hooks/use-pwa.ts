"use client";

import * as React from "react";

// Native BeforeInstallPromptEvent type declaration
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UsePWAReturn {
  isOnline: boolean;
  isInstallable: boolean;
  isStandalone: boolean;
  isServiceWorkerSupported: boolean;
  installApp: () => Promise<boolean>;
  swRegistration: ServiceWorkerRegistration | null;
  hasUpdate: boolean;
  reloadForUpdate: () => void;
}

export function usePWA(): UsePWAReturn {
  const [isOnline, setIsOnline] = React.useState<boolean>(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      return navigator.onLine;
    }
    return true;
  });

  const [isStandalone, setIsStandalone] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(display-mode: standalone)").matches) ||
        (window.navigator as unknown as { standalone?: boolean })?.standalone === true
      );
    }
    return false;
  });

  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = React.useState<boolean>(false);
  const [swRegistration, setSwRegistration] = React.useState<ServiceWorkerRegistration | null>(null);
  const [hasUpdate, setHasUpdate] = React.useState<boolean>(false);

  // 1. Online / Offline network status listener
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2. Standalone display mode listener
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
      return () => mediaQuery.removeEventListener("change", handleDisplayModeChange);
    } else if (typeof (mediaQuery as any).addListener === "function") {
      (mediaQuery as any).addListener(handleDisplayModeChange);
      return () => (mediaQuery as any).removeListener(handleDisplayModeChange);
    }
  }, []);

  // 3. Native `beforeinstallprompt` and `appinstalled` listeners
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar prompt
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 4. Service Worker Registration and Update Tracking
  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let isMounted = true;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (!isMounted) return;
        setSwRegistration(reg);

        // Check if a new service worker is waiting
        if (reg.waiting) {
          setHasUpdate(true);
        }

        reg.addEventListener("updatefound", () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                if (isMounted) setHasUpdate(true);
              }
            });
          }
        });
      })
      .catch((err) => {
        // SW registration can fail in insecure contexts or test environments; gracefully ignore
        console.debug("[PWA] Service worker registration error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger one-click install
  const installApp = React.useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[PWA] Error during installation:", err);
      return false;
    }
  }, [deferredPrompt]);

  // Reload page to apply waiting service worker
  const reloadForUpdate = React.useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [swRegistration]);

  const isServiceWorkerSupported =
    typeof window !== "undefined" && "serviceWorker" in navigator;

  return {
    isOnline,
    isInstallable,
    isStandalone,
    isServiceWorkerSupported,
    installApp,
    swRegistration,
    hasUpdate,
    reloadForUpdate,
  };
}

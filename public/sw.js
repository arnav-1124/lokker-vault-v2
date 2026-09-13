// Lokker Production Service Worker (PWA & Offline Shell)
const CACHE_NAME = "lokker-vault-v1";

// Static assets to precache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/app",
  "/favicon.svg",
  "/icon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/manifest.webmanifest",
];

// URLs/patterns that must NEVER be cached (Zero-Knowledge and Dynamic APIs)
function isExemptFromCache(url) {
  const pathname = url.pathname;
  return (
    pathname.startsWith("/api/") ||
    url.hostname.includes("lokker-server") ||
    url.port === "8000" ||
    url.protocol === "chrome-extension:"
  );
}

// 1. Install event: Precache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn("[SW] Some precache assets failed to load:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up old caches & take immediate control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Message event: Allow clients to trigger skipWaiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 4. Fetch event: Stale-While-Revalidate for static assets, Network-First for navigations
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Strictly bypass dynamic APIs, auth endpoints, and external backend services
  if (isExemptFromCache(url)) {
    return;
  }

  // Navigation requests: Network-first, fallback to cached /app or /
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to /app shell if specific route isn't cached
          const appShell = await caches.match("/app");
          if (appShell) {
            return appShell;
          }
          return caches.match("/");
        })
    );
    return;
  }

  // Static Assets (_next/static, images, fonts, icons, etc.): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          // Return cached version immediately if present, otherwise await fetch
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});

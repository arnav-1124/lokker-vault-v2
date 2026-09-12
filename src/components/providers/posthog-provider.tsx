"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { appConfig } from "@/config/app";

export function PostHogClientInit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && appConfig.posthogKey) {
      posthog.init(appConfig.posthogKey, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // Tracked manually below for App Router accuracy
        capture_pageleave: true,
        autocapture: true,
      });
    }
  }, []);

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogClientInit />
      </Suspense>
      {children}
    </PHProvider>
  );
}

/**
 * Utility to identify user in PostHog on frontend
 */
export function identifyPostHogUser(userId: string, traits?: Record<string, any>) {
  if (typeof window !== "undefined" && posthog) {
    posthog.identify(userId, traits);
  }
}

/**
 * Utility to reset PostHog session on frontend logout
 */
export function resetPostHogUser() {
  if (typeof window !== "undefined" && posthog) {
    posthog.reset();
  }
}

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
        person_profiles: "never",
        capture_pageview: false, // Tracked manually below for App Router accuracy
        capture_pageleave: false,
        autocapture: false,
        disable_session_recording: true,
        capture_dead_clicks: false,
        disable_surveys: true,
        mask_all_text: true,
        mask_all_element_attributes: true,
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
 * Utility to identify user in PostHog on frontend.
 * Zero-PII safe: never passes user email, names, or passwords.
 */
export function identifyPostHogUser(userId: string, _traits?: Record<string, any>) {
  if (typeof window !== "undefined" && posthog) {
    posthog.identify(userId);
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

"use client";

import * as React from "react";
import { checkPasswordBreached } from "@/lib/crypto";

export type BreachStatus = "idle" | "checking" | "breached" | "clean" | "error";

export interface BreachCheckResult {
  status: BreachStatus;
  isBreached: boolean;
  count: number;
  error?: string;
  recheck: () => void;
}

// Session-level in-memory cache to prevent duplicate network requests
const breachCache = new Map<string, { breached: boolean; count: number; error?: string }>();

/**
 * Custom hook to check if a password has appeared in public dark-web data breaches
 * using HaveIBeenPwned SHA-1 k-Anonymity (5-character prefix).
 * The plaintext password NEVER leaves the client device.
 */
export function useBreachCheck(password: string, debounceMs = 400): BreachCheckResult {
  const [status, setStatus] = React.useState<BreachStatus>("idle");
  const [count, setCount] = React.useState<number>(0);
  const [error, setError] = React.useState<string | undefined>();
  const [triggerIndex, setTriggerIndex] = React.useState(0);

  const recheck = React.useCallback(() => {
    setTriggerIndex((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    if (!password || password.trim().length === 0) {
      setStatus("idle");
      setCount(0);
      setError(undefined);
      return;
    }

    // Check in-memory cache first for instant response
    const cached = breachCache.get(password);
    if (cached) {
      if (cached.error) {
        setStatus("error");
        setError(cached.error);
        setCount(0);
      } else if (cached.breached) {
        setStatus("breached");
        setCount(cached.count);
        setError(undefined);
      } else {
        setStatus("clean");
        setCount(0);
        setError(undefined);
      }
      return;
    }

    let isCancelled = false;
    setStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const res = await checkPasswordBreached(password);
        if (isCancelled) return;

        breachCache.set(password, res);

        if (res.error) {
          setStatus("error");
          setError(res.error);
          setCount(0);
        } else if (res.breached) {
          setStatus("breached");
          setCount(res.count);
          setError(undefined);
        } else {
          setStatus("clean");
          setCount(0);
          setError(undefined);
        }
      } catch (err: any) {
        if (isCancelled) return;
        setStatus("error");
        setError(err?.message || "Network error");
        setCount(0);
      }
    }, debounceMs);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [password, debounceMs, triggerIndex]);

  return {
    status,
    isBreached: status === "breached",
    count,
    error,
    recheck,
  };
}

export { breachCache };

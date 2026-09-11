"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BookOpen,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";
import { appConfig } from "@/config/app";
import { Button } from "@/components/ui/button";
import { AuthVaultAnimation } from "@/components/auth-vault-animation";

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: "login" | "signup";
}

const emptySubscribe = () => () => {};

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
      {/* 55% COLUMN: Dedicated Auth Modal Container */}
      <div className="w-full lg:w-[55%] min-h-screen flex flex-col justify-between p-6 sm:p-10 z-10">
        {/* Top bar with Brand, Docs & Theme Toggler */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            <LokkerBrandIcon size="sm" />
            <span className="font-heading font-bold text-sm tracking-tight">{appConfig.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="size-3.5" />
              <span className="hidden sm:inline">Documentation</span>
            </Link>

            {/* Theme Toggle Button */}
            {mounted ? (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="cursor-pointer size-8 rounded-lg border-border-subtle bg-surface hover:bg-surface-hover"
                title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-3.5 text-foreground" />
                ) : (
                  <Moon className="size-3.5 text-foreground" />
                )}
              </Button>
            ) : (
              <div className="size-8" />
            )}
          </div>
        </div>

        {/* Center: Auth Modal Card */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-8">
          <div className="rounded-2xl border border-border-subtle bg-surface/40 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/30">
            {children}
          </div>
        </div>

        {/* Bottom Escape Hatch & Zero-Knowledge Assurance */}
        <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="size-3.5" />
            <span>Keep Vault 100% Offline (Back to Workspace)</span>
          </Link>

          <span className="text-[11px] text-muted-foreground/80 font-mono">
            Zero-Knowledge • Optional Cloud
          </span>
        </div>
      </div>

      {/* 45% COLUMN: Pure SaaS-Level Animation (No Quotes, No Dev Words) */}
      <div className="hidden lg:flex lg:w-[45%] min-h-screen flex-col z-10">
        <AuthVaultAnimation />
      </div>
    </div>
  );
}

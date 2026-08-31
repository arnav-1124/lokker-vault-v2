"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ShieldCheck, Moon, Sun, ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/config/app";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";

const emptySubscribe = () => () => {};

export function MarketingNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/security", label: "Security" },
    { href: "/privacy", label: "Privacy" },
    { href: "/docs", label: "Docs" },
    { href: "/download", label: "Download" },
  ];

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border-subtle bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            <LokkerBrandIcon size="sm" />
            <span className="font-heading font-bold text-sm tracking-tight">{appConfig.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-label">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-foreground cursor-pointer ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/design" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-caption cursor-pointer">
              Design Preview
            </Button>
          </Link>

          {/* Theme Switcher Button */}
          {mounted ? (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Toggle Theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="cursor-pointer"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
            </Button>
          ) : (
            <div className="size-7" />
          )}

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Open Navigation Menu" className="cursor-pointer">
                  <Menu className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild className="cursor-pointer">
                    <Link href={link.href} className="w-full">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/design" className="w-full">
                    Design System
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href="/app">
            <Button size="sm" className="gap-1.5 shadow-xs cursor-pointer">
              <span>Open Vault</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

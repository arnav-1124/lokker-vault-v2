"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ShieldCheck, Moon, Sun, ArrowRight, Menu, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
              const isDocs = link.href === "/docs";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target={isDocs ? "_blank" : undefined}
                  rel={isDocs ? "noopener noreferrer" : undefined}
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
          <Link href="/features#cloud-sync" className="hidden lg:inline-flex">
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 py-0.5 px-2 gap-1.5 cursor-pointer hover:bg-primary/15 transition-colors">
              <Cloud className="size-3" />
              <span>Cloud & Teams (Coming Soon)</span>
            </Badge>
          </Link>

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
                {navLinks.map((link) => {
                  const isDocs = link.href === "/docs";
                  return (
                    <DropdownMenuItem key={link.href} asChild className="cursor-pointer">
                      <Link
                        href={link.href}
                        target={isDocs ? "_blank" : undefined}
                        rel={isDocs ? "noopener noreferrer" : undefined}
                        className="w-full"
                      >
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/design" className="w-full">
                    Design System
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/login" className="w-full">
                    Sign In
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/signup" className="w-full">
                    Sign Up (Cloud)
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground cursor-pointer hidden sm:inline-flex">
              Sign In
            </Button>
          </Link>

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

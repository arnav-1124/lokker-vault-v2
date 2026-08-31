"use client";

import { useVault } from "@/context/vault-context";
import { Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExtensionPage() {
  const vault = useVault();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-center space-y-4 shadow-xs">
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
          <Puzzle className="size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            Chrome & Edge Manifest V3 Autofill
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Enjoy real password autofill directly in website login forms across all Chromium browsers.
          </p>
        </div>
        <Button
          onClick={() => vault.setIsExtensionGuideOpen(true)}
          className="gap-2 h-9 px-6 text-xs font-medium cursor-pointer"
        >
          <Puzzle className="size-4" />
          <span>Open Setup Guide & Download</span>
        </Button>
      </div>
    </div>
  );
}

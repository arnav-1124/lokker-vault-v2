"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  FolderArchive,
  Compass,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function DownloadPage() {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = "/lokker-browser-extension-mv3.zip";
      a.download = "lokker-browser-extension-mv3.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloading(false);
    }, 300);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 text-center">
          <Badge variant="outline" className="mb-4 text-xs py-1 px-3 bg-surface border-border-subtle">
            <Compass className="size-3 text-primary mr-1.5" />
            Manifest V3 Extension Package
          </Badge>
          <h1 className="text-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Download Lokker Extension
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base text-pretty">
            Enjoy real password autofill directly in website login forms across Chrome, Edge, Brave, and Chromium browsers.
          </p>
        </section>

        {/* Download Box */}
        <section className="mx-auto max-w-4xl px-6 pb-20 space-y-12">
          <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center space-y-6">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
              <FolderArchive className="size-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-heading text-xl font-semibold">
                Chrome & Edge Real Autofill Package
              </h2>
              <p className="text-xs text-muted-foreground">
                Ready-to-load Manifest V3 zip package containing background service workers, content scripts, and Shadow DOM autofill injectors.
              </p>
            </div>

            <div className="pt-2">
              <Button
                size="lg"
                onClick={handleDownload}
                disabled={downloading}
                className="gap-2 h-11 px-6 shadow-sm cursor-pointer"
              >
                <Download className="size-4" />
                <span>{downloading ? "Preparing Package..." : "Download Extension Package (.zip)"}</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border-subtle">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-success" /> Chrome 100+
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-success" /> Edge 100+
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-success" /> Brave
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-success" /> Arc & Opera
              </span>
            </div>
          </div>

          {/* 3-Step Guide */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-semibold">3-Step Installation Guide</h3>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-2">
                <span className="size-6 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <p className="text-xs font-semibold">Extract the ZIP file</p>
                <p className="text-[11px] text-muted-foreground">
                  Extract the downloaded <code className="text-foreground font-mono">lokker-browser-extension-mv3.zip</code> to a permanent folder on your computer.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-2">
                <span className="size-6 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <p className="text-xs font-semibold">Open Extensions Page</p>
                <p className="text-[11px] text-muted-foreground">
                  Navigate to <code className="text-foreground font-mono">chrome://extensions</code> or <code className="text-foreground font-mono">edge://extensions</code> and enable <strong>Developer mode</strong> in the top right.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-2">
                <span className="size-6 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <p className="text-xs font-semibold">Load Unpacked Extension</p>
                <p className="text-[11px] text-muted-foreground">
                  Click <strong>&quot;Load unpacked&quot;</strong> and select the extracted extension directory. The Lokker shield icon will appear in your toolbar.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

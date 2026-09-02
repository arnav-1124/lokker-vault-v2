"use client";

import * as React from "react";
import { Download, Puzzle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExtensionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExtensionGuideModal({ isOpen, onClose }: ExtensionGuideModalProps) {
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-surface border-border-subtle p-6">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Puzzle className="size-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Install Browser Autofill Extension
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect Lokker to Chrome, Edge, Brave, or Chromium for 1-click password autofill.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-clip lokker-scrollbar space-y-4 pt-2 text-xs">
          <div className="p-3.5 rounded-xl border border-border-subtle bg-background flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Manifest V3 Extension Package (.zip)</p>
              <p className="text-[11px] text-muted-foreground">Shadow DOM isolation • Local sync</p>
            </div>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>{downloading ? "Downloading..." : "Download Zip"}</span>
            </Button>
          </div>

          {/* 3 Step Instructions */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground">3-Step Setup Instructions:</p>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border-subtle">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p className="leading-snug">
                  Extract the downloaded zip archive to a permanent folder on your machine.
                </p>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border-subtle">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p className="leading-snug">
                  Open <code className="text-foreground font-mono">chrome://extensions</code> or <code className="text-foreground font-mono">edge://extensions</code> and enable <strong>Developer mode</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border-subtle">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p className="leading-snug">
                  Click <strong>&quot;Load unpacked&quot;</strong> and select the extracted extension folder.
                </p>
              </div>
            </div>
          </div>

          {/* Connect the vault (after install) */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Connect the Extension to Your Vault:</p>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border-subtle">
                <span className="size-5 rounded-full bg-success/10 text-success font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <p className="leading-snug">
                  Keep this web vault tab open and <strong>unlocked</strong>. The extension syncs your encrypted vault from this page automatically.
                </p>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border-subtle">
                <span className="size-5 rounded-full bg-success/10 text-success font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  5
                </span>
                <p className="leading-snug">
                  Click the Lokker icon in your browser toolbar. The popup shows the connection status — if it says <strong>&quot;Not connected&quot;</strong>, press <strong>&quot;Sync Now&quot;</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border-subtle">
                <span className="size-5 rounded-full bg-success/10 text-success font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  6
                </span>
                <p className="leading-snug">
                  Unlock the vault in the popup with your master password once. Autofill is then available on any site you visit.
                </p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/5 border border-border-subtle text-[11px] text-muted-foreground leading-snug">
              <strong className="text-foreground">Badge behavior:</strong> by default the Lokker autofill badge appears only on sites that have matching credentials in your vault. Use <strong>&quot;Show autofill badge on every site&quot;</strong> in the extension popup if you want it on every login form.
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

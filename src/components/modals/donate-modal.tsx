"use client";

import * as React from "react";
import Image from "next/image";
import { Coffee, Copy, Check, ExternalLink, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DONATE_URL = "https://buymeacoffee.com/carbon.copy";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DONATE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = DONATE_URL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-5 bg-popover border-border-subtle shadow-overlay max-h-[90vh] overflow-y-auto lokker-scrollbar">
        <DialogHeader className="text-center space-y-2 pb-1">
          <div className="mx-auto size-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs">
            <Coffee className="size-6 text-amber-500" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
            <span>Buy Me a Coffee</span>
            <Heart className="size-4 text-rose-500 fill-rose-500" />
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            If Lokker helps keep your digital life secure and private, consider supporting my work with a coffee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* QR Code Presentation */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/25 shadow-xs text-center space-y-2.5">
            <div className="relative size-48 sm:size-52 rounded-xl overflow-hidden bg-white p-2 border border-border-subtle flex items-center justify-center">
              {/* Using standard img for local public asset */}
              <img
                src="/donate-qr.png"
                alt="Buy Me a Coffee QR Code"
                className="w-full h-full object-contain"
                width={208}
                height={208}
              />
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
              Scan with your phone camera to open instantly
            </p>
          </div>

          {/* Link Box with Copy Action */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground block">
              Direct Donation Link
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border-subtle bg-surface">
              <span className="text-xs font-mono text-foreground px-2 truncate flex-1 select-all">
                {DONATE_URL}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs gap-1 px-2.5 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-success" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Action Button: Open Link */}
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-zinc-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Coffee className="size-4 text-zinc-950" />
            <span>Open Buy Me a Coffee Page</span>
            <ExternalLink className="size-3.5 text-zinc-950/80" />
          </a>
        </div>

        <DialogFooter className="pt-2 text-center sm:justify-center border-t border-border-subtle mt-2">
          <p className="text-[11px] text-muted-foreground/80">
            Thank you deeply for supporting open, privacy-first software! ❤️
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

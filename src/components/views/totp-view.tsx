"use client";

import * as React from "react";
import {
  QrCode,
  Copy,
  Check,
  Clock,
  Search,
  Edit2,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PasswordEntry } from "@/types";
import { generateTOTPCode } from "@/lib/totp";

interface TotpViewProps {
  passwords: PasswordEntry[];
  onEditPassword?: (p: PasswordEntry) => void;
  addToast: (text: string, type?: "success" | "error" | "info") => void;
}

export function TotpView({ passwords, onEditPassword, addToast }: TotpViewProps) {
  const [totpCodes, setTotpCodes] = React.useState<Record<string, { code: string; secondsRemaining: number }>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const totpItems = React.useMemo(() => {
    return passwords.filter((p) => !!p.totpSecret && p.totpSecret.trim().length > 0);
  }, [passwords]);

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return totpItems;
    return totpItems.filter(
      (item) =>
        item.websiteName.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        (item.websiteUrl && item.websiteUrl.toLowerCase().includes(q))
    );
  }, [totpItems, searchQuery]);

  // Periodic TOTP calculation update
  React.useEffect(() => {
    let isMounted = true;

    const updateCodes = async () => {
      const results: Record<string, { code: string; secondsRemaining: number }> = {};
      for (const item of totpItems) {
        if (item.totpSecret) {
          const res = await generateTOTPCode(item.totpSecret);
          results[item.id] = res;
        }
      }
      if (isMounted) {
        setTotpCodes(results);
      }
    };

    updateCodes();
    const interval = setInterval(updateCodes, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [totpItems]);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    addToast("2FA verification code copied to clipboard.", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <QrCode className="size-4 text-primary" />
            <span>2FA TOTP Authenticator</span>
            <Badge variant="outline" className="text-xs font-mono">
              {totpItems.length}
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Standard RFC 6238 time-based verification codes with 30-second live timers
          </p>
        </div>

        {totpItems.length > 3 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search 2FA accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-surface"
            />
          </div>
        )}
      </div>

      {totpItems.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-12 text-center space-y-3">
          <div className="size-10 rounded-full bg-surface-elevated text-muted-foreground flex items-center justify-center mx-auto">
            <QrCode className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No 2FA accounts configured</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add a 2FA TOTP secret key to any credential in your password vault to start generating live verification codes.
            </p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center text-xs text-muted-foreground">
          No 2FA accounts match &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const data = totpCodes[item.id] || { code: "------", secondsRemaining: 30 };
            const isCopied = copiedId === item.id;
            const isExpiringSoon = data.secondsRemaining <= 5;
            const progressPercent = (data.secondsRemaining / 30) * 100;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3 hover:border-border-strong transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                      {item.websiteName[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.websiteName}</p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">{item.username || "Account 2FA"}</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-xs font-mono font-semibold shrink-0 ${
                      isExpiringSoon ? "text-destructive" : "text-primary"
                    }`}
                  >
                    <Clock className="size-3" />
                    <span>{data.secondsRemaining}s</span>
                  </div>
                </div>

                {/* Code display card */}
                <div className="p-3 rounded-lg bg-background border border-border-subtle flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold tracking-widest text-foreground select-all">
                    {data.code.length >= 6 ? `${data.code.slice(0, 3)} ${data.code.slice(3)}` : data.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onEditPassword && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onEditPassword(item)}
                        title="Edit credential"
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit2 className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.id, data.code)}
                      className="h-8 text-xs gap-1 cursor-pointer"
                    >
                      {isCopied ? (
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

                {/* Progress bar with dynamic urgency color */}
                <div className="w-full bg-surface-elevated h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      isExpiringSoon ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

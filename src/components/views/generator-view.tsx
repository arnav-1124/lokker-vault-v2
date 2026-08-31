"use client";

import * as React from "react";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  calculatePasswordStrength,
  generateMemorablePassphrase,
  generateSecurePassword,
} from "@/lib/crypto";

interface GeneratorViewProps {
  onCopyText: (text: string, label: string) => void;
  onSaveAsCredential?: (password: string) => void;
}

export function GeneratorView({ onCopyText, onSaveAsCredential }: GeneratorViewProps) {
  const [mode, setMode] = React.useState<"random" | "passphrase">("random");
  const [length, setLength] = React.useState(20);
  const [includeUpper, setIncludeUpper] = React.useState(true);
  const [includeLower, setIncludeLower] = React.useState(true);
  const [includeNumbers, setIncludeNumbers] = React.useState(true);
  const [includeSymbols, setIncludeSymbols] = React.useState(true);
  const [excludeSimilar, setExcludeSimilar] = React.useState(false);
  const [wordCount, setWordCount] = React.useState(4);

  const [generatedPassword, setGeneratedPassword] = React.useState(() =>
    generateSecurePassword({
      length: 20,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: false,
    })
  );
  const [copied, setCopied] = React.useState(false);

  const regenerate = (
    nextMode = mode,
    nextLength = length,
    nextUpper = includeUpper,
    nextLower = includeLower,
    nextNum = includeNumbers,
    nextSym = includeSymbols,
    nextEx = excludeSimilar,
    nextWords = wordCount
  ) => {
    if (nextMode === "passphrase") {
      setGeneratedPassword(generateMemorablePassphrase(nextWords));
    } else {
      const pwd = generateSecurePassword({
        length: nextLength,
        includeUppercase: nextUpper,
        includeLowercase: nextLower,
        includeNumbers: nextNum,
        includeSymbols: nextSym,
        excludeSimilar: nextEx,
      });
      setGeneratedPassword(pwd);
    }
  };

  const strength = calculatePasswordStrength(generatedPassword);

  const handleCopy = () => {
    onCopyText(generatedPassword, "Generated Password");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span>Standalone Password Generator</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Cryptographically random password and passphrase generator using Web Crypto
          </p>
        </div>

        {onSaveAsCredential && (
          <Button
            size="sm"
            onClick={() => onSaveAsCredential(generatedPassword)}
            className="h-8 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create Credential with Password</span>
          </Button>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("random");
            regenerate("random", length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, wordCount);
          }}
          className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            mode === "random"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface border-border-subtle text-muted-foreground hover:text-foreground"
          }`}
        >
          Random Characters
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("passphrase");
            regenerate("passphrase", length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, wordCount);
          }}
          className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            mode === "passphrase"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface border-border-subtle text-muted-foreground hover:text-foreground"
          }`}
        >
          Memorable Passphrase
        </button>
      </div>

      {/* Generated Password Card */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-background border border-border-subtle">
          <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-foreground select-all break-all">
            {generatedPassword}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => regenerate()}
              title="Generate new password"
              aria-label="Generate new password"
              className="cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Password"}</span>
            </Button>
          </div>
        </div>

        {/* Strength meter */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Strength:</span>
            <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-background">
            {mode === "passphrase" ? `${wordCount} words` : `${length} characters`}
          </Badge>
        </div>
      </div>

      {/* Options Controls */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Generation Rules
        </h3>

        {mode === "random" ? (
          <div className="space-y-5">
            {/* Length slider with shadcn Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <Label htmlFor="length-slider" className="font-medium cursor-pointer">
                  Length: {length}
                </Label>
                <span className="font-mono text-xs text-muted-foreground">{length} chars</span>
              </div>
              <Slider
                id="length-slider"
                min={8}
                max={64}
                step={1}
                value={[length]}
                onValueChange={(val) => {
                  const newLen = val[0] || 20;
                  setLength(newLen);
                  regenerate("random", newLen, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, wordCount);
                }}
              />
            </div>

            {/* Checkboxes with shadcn Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="rule-upper"
                  checked={includeUpper}
                  onCheckedChange={(checked) => {
                    const next = !!checked;
                    setIncludeUpper(next);
                    regenerate("random", length, next, includeLower, includeNumbers, includeSymbols, excludeSimilar, wordCount);
                  }}
                />
                <Label htmlFor="rule-upper" className="text-xs cursor-pointer font-normal">
                  Uppercase (A-Z)
                </Label>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="rule-lower"
                  checked={includeLower}
                  onCheckedChange={(checked) => {
                    const next = !!checked;
                    setIncludeLower(next);
                    regenerate("random", length, includeUpper, next, includeNumbers, includeSymbols, excludeSimilar, wordCount);
                  }}
                />
                <Label htmlFor="rule-lower" className="text-xs cursor-pointer font-normal">
                  Lowercase (a-z)
                </Label>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="rule-num"
                  checked={includeNumbers}
                  onCheckedChange={(checked) => {
                    const next = !!checked;
                    setIncludeNumbers(next);
                    regenerate("random", length, includeUpper, includeLower, next, includeSymbols, excludeSimilar, wordCount);
                  }}
                />
                <Label htmlFor="rule-num" className="text-xs cursor-pointer font-normal">
                  Numbers (0-9)
                </Label>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="rule-sym"
                  checked={includeSymbols}
                  onCheckedChange={(checked) => {
                    const next = !!checked;
                    setIncludeSymbols(next);
                    regenerate("random", length, includeUpper, includeLower, includeNumbers, next, excludeSimilar, wordCount);
                  }}
                />
                <Label htmlFor="rule-sym" className="text-xs cursor-pointer font-normal">
                  Symbols (!@#$%)
                </Label>
              </div>

              <div className="flex items-center gap-2.5 sm:col-span-2">
                <Checkbox
                  id="rule-ambig"
                  checked={excludeSimilar}
                  onCheckedChange={(checked) => {
                    const next = !!checked;
                    setExcludeSimilar(next);
                    regenerate("random", length, includeUpper, includeLower, includeNumbers, includeSymbols, next, wordCount);
                  }}
                />
                <Label htmlFor="rule-ambig" className="text-xs cursor-pointer font-normal">
                  Exclude ambiguous characters (I, l, 1, 0, O)
                </Label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <Label htmlFor="words-slider" className="font-medium cursor-pointer">
                  Word Count: {wordCount}
                </Label>
                <span className="font-mono text-xs text-muted-foreground">{wordCount} words</span>
              </div>
              <Slider
                id="words-slider"
                min={3}
                max={8}
                step={1}
                value={[wordCount]}
                onValueChange={(val) => {
                  const newCount = val[0] || 4;
                  setWordCount(newCount);
                  regenerate("passphrase", length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, newCount);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

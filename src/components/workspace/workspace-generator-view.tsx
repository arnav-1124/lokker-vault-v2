"use client";

import * as React from "react";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Shield,
  KeyRound,
  FileKey,
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

interface WorkspaceGeneratorViewProps {
  workspaceName?: string;
  isAdmin: boolean;
  onCopyText: (text: string, label: string) => void;
  onSaveAsCredential: (password: string) => void;
}

export function WorkspaceGeneratorView({
  workspaceName = "Workspace",
  isAdmin,
  onCopyText,
  onSaveAsCredential,
}: WorkspaceGeneratorViewProps) {
  const [mode, setMode] = React.useState<"random" | "passphrase">("random");
  const [length, setLength] = React.useState(22);
  const [includeUpper, setIncludeUpper] = React.useState(true);
  const [includeLower, setIncludeLower] = React.useState(true);
  const [includeNumbers, setIncludeNumbers] = React.useState(true);
  const [includeSymbols, setIncludeSymbols] = React.useState(true);
  const [excludeSimilar, setExcludeSimilar] = React.useState(false);
  const [wordCount, setWordCount] = React.useState(5);

  const [generatedPassword, setGeneratedPassword] = React.useState(() =>
    generateSecurePassword({
      length: 22,
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

  // Enterprise / Workspace Preset Handlers
  const applyPreset = (preset: "enterprise" | "standard" | "api" | "passphrase") => {
    if (preset === "enterprise") {
      setMode("random");
      setLength(24);
      setIncludeUpper(true);
      setIncludeLower(true);
      setIncludeNumbers(true);
      setIncludeSymbols(true);
      setExcludeSimilar(true);
      regenerate("random", 24, true, true, true, true, true, wordCount);
    } else if (preset === "standard") {
      setMode("random");
      setLength(18);
      setIncludeUpper(true);
      setIncludeLower(true);
      setIncludeNumbers(true);
      setIncludeSymbols(true);
      setExcludeSimilar(false);
      regenerate("random", 18, true, true, true, true, false, wordCount);
    } else if (preset === "api") {
      setMode("random");
      setLength(32);
      setIncludeUpper(true);
      setIncludeLower(true);
      setIncludeNumbers(true);
      setIncludeSymbols(false);
      setExcludeSimilar(true);
      regenerate("random", 32, true, true, true, false, true, wordCount);
    } else if (preset === "passphrase") {
      setMode("passphrase");
      setWordCount(5);
      regenerate("passphrase", length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, 5);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Workspace Password & Key Generator</span>
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              {workspaceName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate cryptographically secure passwords, passphrases, and shared API keys with organizational standards.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border-subtle self-start sm:self-auto">
          <button
            onClick={() => {
              setMode("random");
              regenerate("random");
            }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === "random"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => {
              setMode("passphrase");
              regenerate("passphrase");
            }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === "passphrase"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Passphrase
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-muted-foreground font-medium mr-1">Organizational Presets:</span>
        <button
          onClick={() => applyPreset("enterprise")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface border border-border-subtle hover:border-primary/40 hover:bg-surface-elevated transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Shield className="size-3 text-emerald-500" />
          <span>Enterprise (24 chars)</span>
        </button>
        <button
          onClick={() => applyPreset("standard")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface border border-border-subtle hover:border-primary/40 hover:bg-surface-elevated transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <KeyRound className="size-3 text-blue-500" />
          <span>Standard (18 chars)</span>
        </button>
        <button
          onClick={() => applyPreset("api")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface border border-border-subtle hover:border-primary/40 hover:bg-surface-elevated transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <FileKey className="size-3 text-purple-500" />
          <span>API Key (32 hex-friendly)</span>
        </button>
        <button
          onClick={() => applyPreset("passphrase")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface border border-border-subtle hover:border-primary/40 hover:bg-surface-elevated transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="size-3 text-amber-500" />
          <span>5-Word Passphrase</span>
        </button>
      </div>

      {/* Display Box */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background border border-border-subtle">
          <span className="font-mono text-base sm:text-lg break-all select-all font-semibold tracking-wide text-foreground">
            {generatedPassword}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => regenerate()}
              className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Regenerate"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {/* Strength Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Entropy Score:</span>
            <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
          </div>
          <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                strength.score <= 1
                  ? "bg-destructive w-1/4"
                  : strength.score === 2
                  ? "bg-warning w-2/4"
                  : strength.score === 3
                  ? "bg-primary w-3/4"
                  : "bg-success w-full"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-6">
        {mode === "random" ? (
          <>
            {/* Length Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-medium">Password Length</Label>
                <span className="font-mono font-bold text-sm text-foreground">{length} characters</span>
              </div>
              <Slider
                value={[length]}
                min={8}
                max={64}
                step={1}
                onValueChange={([val]) => {
                  setLength(val);
                  regenerate(mode, val);
                }}
              />
            </div>

            {/* Character Set Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-upper"
                  checked={includeUpper}
                  onCheckedChange={(c) => {
                    const val = !!c;
                    setIncludeUpper(val);
                    regenerate(mode, length, val);
                  }}
                />
                <Label htmlFor="include-upper" className="text-xs cursor-pointer">
                  Uppercase Letters (A-Z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-lower"
                  checked={includeLower}
                  onCheckedChange={(c) => {
                    const val = !!c;
                    setIncludeLower(val);
                    regenerate(mode, length, includeUpper, val);
                  }}
                />
                <Label htmlFor="include-lower" className="text-xs cursor-pointer">
                  Lowercase Letters (a-z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-numbers"
                  checked={includeNumbers}
                  onCheckedChange={(c) => {
                    const val = !!c;
                    setIncludeNumbers(val);
                    regenerate(mode, length, includeUpper, includeLower, val);
                  }}
                />
                <Label htmlFor="include-numbers" className="text-xs cursor-pointer">
                  Numbers (0-9)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-symbols"
                  checked={includeSymbols}
                  onCheckedChange={(c) => {
                    const val = !!c;
                    setIncludeSymbols(val);
                    regenerate(mode, length, includeUpper, includeLower, includeNumbers, val);
                  }}
                />
                <Label htmlFor="include-symbols" className="text-xs cursor-pointer">
                  Symbols (!@#$%^&*)
                </Label>
              </div>

              <div className="flex items-center space-x-2 sm:col-span-2">
                <Checkbox
                  id="exclude-similar"
                  checked={excludeSimilar}
                  onCheckedChange={(c) => {
                    const val = !!c;
                    setExcludeSimilar(val);
                    regenerate(mode, length, includeUpper, includeLower, includeNumbers, includeSymbols, val);
                  }}
                />
                <Label htmlFor="exclude-similar" className="text-xs cursor-pointer text-muted-foreground">
                  Exclude Ambiguous / Similar Characters (1, l, I, 0, O)
                </Label>
              </div>
            </div>
          </>
        ) : (
          /* Passphrase Controls */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-medium">Word Count</Label>
              <span className="font-mono font-bold text-sm text-foreground">{wordCount} words</span>
            </div>
            <Slider
              value={[wordCount]}
              min={3}
              max={8}
              step={1}
              onValueChange={([val]) => {
                setWordCount(val);
                regenerate(mode, length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar, val);
              }}
            />
            <p className="text-[11px] text-muted-foreground pt-1">
              Passphrases combine dictionary words with hyphens for high security and easy vocal/mobile recall.
            </p>
          </div>
        )}

        {/* Action Button: Save directly as Workspace Credential */}
        <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
          <Button
            onClick={() => onSaveAsCredential(generatedPassword)}
            disabled={!isAdmin}
            size="sm"
            className="h-9 text-xs gap-1.5 font-medium cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Save to {workspaceName}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

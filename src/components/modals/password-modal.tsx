"use client";

import * as React from "react";
import {
  KeyRound,
  CreditCard,
  FileText,
  User,
  Sparkles,
  Eye,
  EyeOff,
  QrCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, EntryType, PasswordEntry, VaultSettings } from "@/types";
import {
  calculatePasswordStrength,
  generateSecurePassword,
} from "@/lib/crypto";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: PasswordEntry) => void;
  initialEntry: PasswordEntry | null;
  categories: Category[];
  defaultCategoryId?: string;
  settings?: VaultSettings;
}

export function PasswordModal({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  categories,
  defaultCategoryId,
}: PasswordModalProps) {
  const [prevEntry, setPrevEntry] = React.useState<PasswordEntry | null>(initialEntry);
  const [entryType, setEntryType] = React.useState<EntryType>(initialEntry?.entryType || "login");
  const [websiteName, setWebsiteName] = React.useState(initialEntry?.websiteName || "");
  const [websiteUrl, setWebsiteUrl] = React.useState(initialEntry?.websiteUrl || "");
  const [username, setUsername] = React.useState(initialEntry?.username || "");
  const [password, setPassword] = React.useState(initialEntry?.password || "");
  const [notes, setNotes] = React.useState(initialEntry?.notes || "");
  const [category, setCategory] = React.useState(initialEntry?.category || defaultCategoryId || (categories[0]?.name || "General"));
  const [totpSecret, setTotpSecret] = React.useState(initialEntry?.totpSecret || "");
  const [isFavorite, setIsFavorite] = React.useState(!!initialEntry?.isFavorite);
  const [showPassword, setShowPassword] = React.useState(false);

  // Credit card specific fields
  const [cardNumber, setCardNumber] = React.useState(initialEntry?.cardDetails?.cardNumber || "");
  const [cardholderName, setCardholderName] = React.useState(initialEntry?.cardDetails?.cardholderName || "");
  const [expiryMonth, setExpiryMonth] = React.useState(initialEntry?.cardDetails?.expiryMonth || "");
  const [expiryYear, setExpiryYear] = React.useState(initialEntry?.cardDetails?.expiryYear || "");
  const [cvv, setCvv] = React.useState(initialEntry?.cardDetails?.cvv || "");

  if (prevEntry !== initialEntry) {
    setPrevEntry(initialEntry);
    if (initialEntry) {
      setEntryType(initialEntry.entryType || "login");
      setWebsiteName(initialEntry.websiteName || "");
      setWebsiteUrl(initialEntry.websiteUrl || "");
      setUsername(initialEntry.username || "");
      setPassword(initialEntry.password || "");
      setNotes(initialEntry.notes || "");
      setCategory(initialEntry.category || "General");
      setTotpSecret(initialEntry.totpSecret || "");
      setIsFavorite(!!initialEntry.isFavorite);
      if (initialEntry.cardDetails) {
        setCardNumber(initialEntry.cardDetails.cardNumber || "");
        setCardholderName(initialEntry.cardDetails.cardholderName || "");
        setExpiryMonth(initialEntry.cardDetails.expiryMonth || "");
        setExpiryYear(initialEntry.cardDetails.expiryYear || "");
        setCvv(initialEntry.cardDetails.cvv || "");
      }
    } else {
      setEntryType("login");
      setWebsiteName("");
      setWebsiteUrl("");
      setUsername("");
      setPassword("");
      setNotes("");
      setCategory(defaultCategoryId || (categories[0]?.name || "General"));
      setTotpSecret("");
      setIsFavorite(false);
      setCardNumber("");
      setCardholderName("");
      setExpiryMonth("");
      setExpiryYear("");
      setCvv("");
    }
  }

  const strength = calculatePasswordStrength(password);

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword({
      length: 18,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    setPassword(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteName.trim()) return;

    const newEntry: PasswordEntry = {
      id: initialEntry?.id || "pwd-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      websiteName: websiteName.trim(),
      websiteUrl: websiteUrl.trim(),
      username: username.trim(),
      password,
      notes: notes.trim(),
      category: category || "General",
      isFavorite,
      totpSecret: totpSecret.trim().toUpperCase(),
      entryType,
      createdAt: initialEntry?.createdAt || Date.now(),
      updatedAt: Date.now(),
      cardDetails:
        entryType === "card"
          ? {
              cardNumber: cardNumber.trim(),
              cardholderName: cardholderName.trim(),
              expiryMonth: expiryMonth.trim(),
              expiryYear: expiryYear.trim(),
              cvv: cvv.trim(),
            }
          : undefined,
    };

    onSave(newEntry);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-surface border-border-subtle p-6 max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base font-semibold">
            {initialEntry ? "Edit Credential Entry" : "Add New Credential"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto lokker-scrollbar space-y-4 pt-2">
          {/* Entry Type Selector */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setEntryType("login")}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                entryType === "login"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound className="size-4" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryType("card")}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                entryType === "card"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="size-4" />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryType("note")}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                entryType === "note"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-4" />
              <span>Secure Note</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryType("identity")}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                entryType === "identity"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="size-4" />
              <span>Identity</span>
            </button>
          </div>

          {/* Title / Name */}
          <div className="space-y-1.5">
            <Label htmlFor="item-title" className="text-xs">
              {entryType === "login"
                ? "Website / Service Name"
                : entryType === "card"
                ? "Card Nickname / Bank"
                : entryType === "note"
                ? "Note Title"
                : "Identity Name"}
            </Label>
            <Input
              id="item-title"
              required
              placeholder={entryType === "login" ? "e.g. GitHub, Google, AWS" : "Title..."}
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* URL & Category (for Logins) */}
          {entryType === "login" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="item-url" className="text-xs">
                  Website URL
                </Label>
                <Input
                  id="item-url"
                  placeholder="https://example.com/login"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-cat" className="text-xs">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="item-cat" size="sm" className="bg-background">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Login Fields */}
          {entryType === "login" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="item-user" className="text-xs">
                  Username / Email
                </Label>
                <Input
                  id="item-user"
                  placeholder="user@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="item-pass" className="text-xs">
                    Password
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGeneratePassword}
                    className="h-6 text-[11px] gap-1 text-primary hover:text-primary cursor-pointer"
                  >
                    <Sparkles className="size-3" />
                    <span>Generate</span>
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="item-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-9 h-8 text-xs font-mono bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>

                {password && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* 2FA TOTP Secret Key */}
              <div className="space-y-1.5">
                <Label htmlFor="item-totp" className="text-xs flex items-center gap-1.5">
                  <QrCode className="size-3.5 text-primary" />
                  <span>2FA TOTP Secret Key (Optional)</span>
                </Label>
                <Input
                  id="item-totp"
                  placeholder="e.g. JBSWY3DPEHPK3PXP"
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value.replace(/\s+/g, ""))}
                  className="h-8 text-xs font-mono bg-background uppercase"
                />
              </div>
            </>
          )}

          {/* Credit Card Fields */}
          {entryType === "card" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-number" className="text-xs">
                  Card Number
                </Label>
                <Input
                  id="card-number"
                  placeholder="•••• •••• •••• ••••"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-holder" className="text-xs">
                  Cardholder Name
                </Label>
                <Input
                  id="card-holder"
                  placeholder="Name on card"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="card-mm" className="text-xs">Exp Month</Label>
                  <Input
                    id="card-mm"
                    placeholder="MM"
                    maxLength={2}
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-yy" className="text-xs">Exp Year</Label>
                  <Input
                    id="card-yy"
                    placeholder="YY"
                    maxLength={2}
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-cvv" className="text-xs">CVV</Label>
                  <Input
                    id="card-cvv"
                    placeholder="123"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="item-notes" className="text-xs">
              {entryType === "note" ? "Secure Note Content" : "Encrypted Notes (Optional)"}
            </Label>
            <Textarea
              id="item-notes"
              rows={entryType === "note" ? 5 : 2}
              placeholder="Private details, backup codes, security questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="pwd-fav"
              checked={isFavorite}
              onCheckedChange={(checked) => setIsFavorite(!!checked)}
            />
            <Label htmlFor="pwd-fav" className="text-xs text-muted-foreground cursor-pointer font-normal">
              Pin to Favorites
            </Label>
          </div>

          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs font-medium cursor-pointer">
              {initialEntry ? "Update Entry" : "Save Credential"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Fingerprint,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/config/app";

const STORAGE_KEY = "lokker_cloud_session";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/app";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    try {
      const session = localStorage.getItem(STORAGE_KEY);
      if (session) {
        document.cookie = "lokker_cloud_session=1; path=/; max-age=604800; SameSite=Lax";
        router.replace("/app");
      }
    } catch {
      // Ignore during SSR
    }
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const payload: Record<string, string> = { email, password };
      if (name.trim()) payload.name = name.trim();

      const res = await fetch(`${appConfig.apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      // Store authenticated session
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name,
          accessToken: data.accessToken,
        })
      );
      document.cookie = "lokker_cloud_session=1; path=/; max-age=604800; SameSite=Lax";
      window.dispatchEvent(new Event("lokker_auth_change"));

      router.push(redirectPath);
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes("Failed to fetch")
          ? "Unable to connect to backend server at " + appConfig.apiUrl
          : err.message || "Account creation failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout mode="signup">
      <div className="space-y-6">
        {/* Heading */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
              100% Optional Cloud
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Connect optional cloud sync & team workspaces
          </p>
        </div>

        {/* Quick Social / Passkey Actions */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrorMsg("GitHub OAuth integration will be enabled in next release. Please use email & password.");
            }}
            className="w-full h-9 text-xs justify-center gap-2 border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer"
          >
            <GithubIcon className="size-3.5" />
            <span>Sign up with GitHub</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              router.push("/app/passkeys");
            }}
            className="w-full h-9 text-xs justify-center gap-2 border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer"
          >
            <Fingerprint className="size-3.5" />
            <span>Sign up with Passkey (FIDO2)</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-border-subtle" />
          <span className="bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Name (Optional)</Label>
            <Input
              type="text"
              placeholder="Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs bg-surface border-border-subtle focus-visible:border-border-strong"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Email</Label>
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-xs bg-surface border-border-subtle focus-visible:border-border-strong"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs pr-9 bg-surface border-border-subtle focus-visible:border-border-strong font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground pt-0.5 leading-normal">
              Notice: This account password is for your cloud account. Your local master encryption key remains separate and strictly offline.
            </p>
          </div>

          {/* Primary Supabase-styled Green Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-9 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <span>Create Free Account</span>
            )}
          </Button>
        </form>

        {/* Switch Link */}
        <div className="text-center text-xs text-muted-foreground pt-1">
          Already have an account?{" "}
          <Link
            href={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="text-foreground underline underline-offset-4 hover:text-primary font-medium cursor-pointer"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

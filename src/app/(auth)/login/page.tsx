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
  ArrowRight,
  Shield,
} from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/config/app";

const STORAGE_KEY = "lokker_cloud_session";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/app";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${appConfig.apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password");
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
          : err.message || "Login failed. Please verify your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="space-y-6">
        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to your Lokker Cloud account
          </p>
        </div>

        {/* Quick Social / Passkey Actions (Supabase style) */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Quick mock or passkey handshake indicator
              setErrorMsg("GitHub OAuth integration will be enabled in next release. Please use email & password.");
            }}
            className="w-full h-9 text-xs justify-center gap-2 border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer"
          >
            <GithubIcon className="size-3.5" />
            <span>Continue with GitHub</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Direct route to local passkey unlock if using local hardware
              router.push("/app/passkeys");
            }}
            className="w-full h-9 text-xs justify-center gap-2 border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer"
          >
            <Fingerprint className="size-3.5" />
            <span>Continue with Passkey (FIDO2)</span>
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
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

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
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Password</Label>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("Password recovery uses your local Master Recovery Key inside the workspace.");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
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
              <span>Sign In</span>
            )}
          </Button>
        </form>

        {/* Switch Link */}
        <div className="text-center text-xs text-muted-foreground pt-1">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="text-foreground underline underline-offset-4 hover:text-primary font-medium cursor-pointer"
          >
            Sign up
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

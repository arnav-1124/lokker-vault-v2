"use client";

import * as React from "react";
import {
  Shield,
  Lock,
  Database,
  Fingerprint,
  Cloud,
  CheckCircle2,
  KeyRound,
  Cpu,
  Zap,
  Radio,
} from "lucide-react";

export function AuthVaultAnimation() {
  // Live dynamic cipher string generator for the HUD display
  const [cipherDigest, setCipherDigest] = React.useState("9f8a3c2e71d4b60a8f9c1b3e");
  const [packetCount, setPacketCount] = React.useState(1842);
  const [latency, setLatency] = React.useState(14);

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Rotate short pseudorandom hex chunk
      const hexChars = "0123456789abcdef";
      let hex = "";
      for (let i = 0; i < 24; i++) {
        hex += hexChars[Math.floor(Math.random() * hexChars.length)];
      }
      setCipherDigest(hex);
      setPacketCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      setLatency(12 + Math.floor(Math.random() * 5));
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 sm:p-10 lg:p-12 overflow-hidden select-none bg-surface/50 border-l border-border-subtle">
      {/* Background Ambient Glows & Tech Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 dark:opacity-15 pointer-events-none" />
      <div className="absolute -top-32 -right-32 size-[420px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 size-[420px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Top Header: System Status & Protocol Telemetry */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-border-subtle text-[11px] font-mono text-muted-foreground shadow-2xs">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-foreground">RELAY ONLINE</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{latency}ms</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-border-subtle text-[11px] font-mono text-muted-foreground">
          <Radio className="size-3 text-primary animate-pulse" />
          <span>E2EE PROTOCOL V2</span>
        </div>
      </div>

      {/* Center: The Interactive SaaS Zero-Knowledge Visualizer */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4">
        {/* Visualizer Stage */}
        <div className="relative size-[360px] sm:size-[410px] xl:size-[440px] flex items-center justify-center">
          
          {/* Animated SVG Circuit Canvas */}
          <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 400 400" fill="none">
            <defs>
              <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Orbit 3 (Outer Dash Ring) */}
            <circle
              cx="200"
              cy="200"
              r="175"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="6 12"
              className="text-border-subtle/70 animate-[spin_60s_linear_infinite]"
            />

            {/* Orbit 2 (Middle Solid/Dash Ring) */}
            <circle
              cx="200"
              cy="200"
              r="125"
              stroke="url(#orbitGrad)"
              strokeWidth="1.5"
              strokeDasharray="14 10"
              className="animate-[spin_35s_linear_infinite_reverse]"
            />

            {/* Orbit 1 (Inner Ring) */}
            <circle
              cx="200"
              cy="200"
              r="75"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              className="text-border-strong animate-[spin_20s_linear_infinite]"
            />

            {/* Connecting Circuit Traces */}
            <path
              d="M 90 90 L 160 160 M 310 90 L 240 160 M 200 320 L 200 250"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              className="text-primary/30"
            />
          </svg>

          {/* Sweeping Radar Scanner Line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-[350px] rounded-full border border-primary/10 relative animate-[spin_8s_linear_infinite]">
              <div className="absolute top-1/2 left-1/2 w-1/2 h-[1px] bg-gradient-to-r from-emerald-500/80 via-primary/40 to-transparent origin-left" />
            </div>
          </div>

          {/* Central Holographic Vault Core */}
          <div className="relative group cursor-default">
            {/* Pulsing Backlight Halo */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/30 to-emerald-500/30 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />

            <div className="relative size-20 rounded-2xl bg-gradient-to-b from-background via-surface-elevated to-surface border border-border-strong shadow-2xl flex flex-col items-center justify-center p-3 text-foreground transition-transform duration-500 group-hover:scale-105">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-1">
                <Lock className="size-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                VAULT
              </span>
            </div>
          </div>

          {/* Node 1: Local Device (Top Left) */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col items-center">
            <div className="size-12 rounded-xl bg-background/80 backdrop-blur-md border border-border-subtle shadow-lg flex items-center justify-center text-primary hover:border-primary/50 transition-colors">
              <Database className="size-5" />
            </div>
            <span className="mt-1.5 text-[10px] font-mono font-medium text-foreground bg-background/70 px-2 py-0.5 rounded border border-border-subtle">
              IndexedDB
            </span>
            <span className="text-[9px] font-mono text-emerald-500 font-semibold mt-0.5">
              LOCAL
            </span>
          </div>

          {/* Node 2: Neon Cloud Relay (Top Right) */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-center">
            <div className="size-12 rounded-xl bg-background/80 backdrop-blur-md border border-border-subtle shadow-lg flex items-center justify-center text-emerald-500 hover:border-emerald-500/50 transition-colors">
              <Cloud className="size-5" />
            </div>
            <span className="mt-1.5 text-[10px] font-mono font-medium text-foreground bg-background/70 px-2 py-0.5 rounded border border-border-subtle">
              Neon Cloud
            </span>
            <span className="text-[9px] font-mono text-primary font-semibold mt-0.5">
              RELAY
            </span>
          </div>

          {/* Node 3: Passkey / Hardware FIDO2 (Bottom Center) */}
          <div className="absolute bottom-2 sm:bottom-4 flex flex-col items-center">
            <div className="size-12 rounded-xl bg-background/80 backdrop-blur-md border border-border-subtle shadow-lg flex items-center justify-center text-indigo-400 hover:border-indigo-400/50 transition-colors">
              <Fingerprint className="size-5" />
            </div>
            <span className="mt-1.5 text-[10px] font-mono font-medium text-foreground bg-background/70 px-2 py-0.5 rounded border border-border-subtle">
              FIDO2 / PRF
            </span>
            <span className="text-[9px] font-mono text-muted-foreground mt-0.5">
              HARDWARE
            </span>
          </div>
        </div>

        {/* Live Cryptographic HUD Cards */}
        <div className="w-full max-w-md mt-6 space-y-3">
          {/* HUD Card 1: Dynamic Cipher Stream */}
          <div className="p-3 rounded-xl bg-background/60 backdrop-blur-md border border-border-subtle shadow-md">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Cpu className="size-3 text-primary" />
                <span>AES-256-GCM ENVELOPE</span>
              </span>
              <span className="text-emerald-500 font-bold">CLIENT SIGNED</span>
            </div>
            <div className="font-mono text-[11px] text-foreground/80 tracking-wider bg-surface/80 px-2 py-1 rounded border border-border-subtle truncate">
              {cipherDigest}
            </div>
          </div>

          {/* HUD Card 2: Security Matrix Badges */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-background/50 backdrop-blur-md border border-border-subtle flex items-center gap-2">
              <Shield className="size-3.5 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-foreground truncate">Zero-Knowledge</div>
                <div className="text-[9px] font-mono text-muted-foreground truncate">No Plaintext Sent</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-background/50 backdrop-blur-md border border-border-subtle flex items-center gap-2">
              <Zap className="size-3.5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-foreground truncate">Argon2id + KDF</div>
                <div className="text-[9px] font-mono text-muted-foreground truncate">64MB Memory Cost</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Real-Time Stream Counters */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border-subtle text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span>Packets Processed:</span>
          <span className="text-foreground font-semibold font-mono">{packetCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-500 font-semibold">
          <CheckCircle2 className="size-3" />
          <span>100% Client-Side Privacy</span>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { appConfig } from "@/config/app";
import { LokkerBrandIcon } from "@/components/lokker-brand-icon";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle bg-surface/30 py-12 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 pb-12 border-b border-border-subtle">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-foreground">
              <LokkerBrandIcon size="sm" />
              <span className="font-heading">{appConfig.name}</span>
            </Link>
            <p className="text-caption max-w-sm text-pretty">
              Local-first personal security and digital-utility workspace. Encrypted locally with standard 256-bit AES-GCM and zero cloud custody.
            </p>
            <div className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-success"></span>
              <span>100% Local · No Telemetry</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Product</p>
            <ul className="space-y-1.5 text-caption">
              <li>
                <Link href="/app" className="hover:text-foreground transition-colors">
                  Web Vault App
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors">
                  Feature Matrix
                </Link>
              </li>
              <li>
                <Link href="/download" className="hover:text-foreground transition-colors">
                  Browser Extension
                </Link>
              </li>
              <li>
                <Link href="/design" className="hover:text-foreground transition-colors">
                  Design System
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Tech Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Security</p>
            <ul className="space-y-1.5 text-caption">
              <li>
                <Link href="/security" className="hover:text-foreground transition-colors">
                  Threat Model & VEK/KEK
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground transition-colors">
                  Technical Docs
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Architecture */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Open Source</p>
            <ul className="space-y-1.5 text-caption">
              <li>
                <a
                  href="https://github.com/arnav-1124/lokker-vault-v2"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <span className="text-muted-foreground/60">AGPLv3 License</span>
              </li>
              <li>
                <span className="text-muted-foreground/60">Client Web Crypto</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption">
          <p>© {new Date().getFullYear()} Lokker. Your vault. Your device. Your keys.</p>
          <p className="font-mono text-xs">Zero plaintext authority.</p>
        </div>
      </div>
    </footer>
  );
}

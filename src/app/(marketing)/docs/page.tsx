import Link from "next/link";
import {
  BookOpen,
  KeyRound,
  FileKey,
  Fingerprint,
  Compass,
  Database,
  ArrowRight,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function DocsPage() {
  const docSections = [
    {
      id: "vault-encryption",
      icon: KeyRound,
      title: "1. Vault Encryption & Master Password",
      content: (
        <>
          <p>
            When initializing Lokker, you choose a Master Password. Your Master Password derives a Password KEK via PBKDF2 (100,000 iterations, SHA-256) to unwrap your 256-bit Vault Encryption Key (VEK).
          </p>
          <p>
            The VEK encrypts all vault payload items using AES-GCM 256-bit authenticated encryption. Plaintext passwords never leave browser ephemeral memory.
          </p>
        </>
      ),
    },
    {
      id: "recovery-key",
      icon: FileKey,
      title: "2. Emergency Recovery Key",
      content: (
        <>
          <p>
            During vault setup, Lokker generates a 256-bit Emergency Recovery Key formatted as <code className="font-mono text-foreground">XXXX-XXXX-XXXX-XXXX-...</code>.
          </p>
          <p>
            Store this key in a secure offline location (e.g. printed paper or an offline USB drive). If you forget your Master Password, click &quot;Recovery Key Unlock&quot; on the vault unlock modal to restore access without data loss.
          </p>
        </>
      ),
    },
    {
      id: "webauthn-prf",
      icon: Fingerprint,
      title: "3. WebAuthn PRF Biometric Unlock",
      content: (
        <>
          <p>
            Lokker leverages the WebAuthn PRF (Pseudo-Random Function) extension. Biometric authenticators (Touch ID, Windows Hello, YubiKey) derive a symmetric key to unwrap your VEK directly.
          </p>
          <p>
            Your master password is never cached in permanent storage, ensuring full zero-knowledge hardware backing.
          </p>
        </>
      ),
    },
    {
      id: "extension-sync",
      icon: Compass,
      title: "4. Browser Extension Synchronization",
      content: (
        <>
          <p>
            Opening your Lokker Web Vault tab synchronizes your encrypted vault payload to your local extension storage via secure postMessage.
          </p>
          <p>
            The extension operates 100% offline even when the web vault tab is closed.
          </p>
        </>
      ),
    },
    {
      id: "import-export",
      icon: Database,
      title: "5. Multi-Format Import & Export",
      content: (
        <>
          <p>
            Lokker includes a client-side parser supporting Chrome CSV, Bitwarden JSON/CSV, 1Password CSV, and Firefox CSV.
          </p>
          <p>
            The pre-import preview modal allows validating duplicates, selecting categories, and resolving conflicts prior to encryption. Full encrypted backup exports allow 1-click vault restoration.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 text-center">
          <Badge variant="outline" className="mb-4 text-xs py-1 px-3 bg-surface border-border-subtle">
            <BookOpen className="size-3 text-primary mr-1.5" />
            Lokker Documentation
          </Badge>
          <h1 className="text-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            User & Technical Guide
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base text-pretty">
            Complete architectural and user guide to master passwords, emergency recovery keys, WebAuthn passkeys, and extension autofill.
          </p>
        </section>

        {/* Documentation Sections */}
        <section className="mx-auto max-w-4xl px-6 pb-20 space-y-8">
          {docSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                id={sec.id}
                className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-3 scroll-mt-20"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="size-4" />
                  </div>
                  <h2 className="text-heading text-lg sm:text-xl font-semibold">{sec.title}</h2>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2 pt-1">
                  {sec.content}
                </div>
              </div>
            );
          })}
        </section>

        {/* CTA */}
        <section className="border-t border-border-subtle bg-surface/40 py-16 text-center">
          <div className="mx-auto max-w-3xl px-6 space-y-4">
            <h2 className="text-heading text-2xl font-semibold">
              Ready to initialize your vault?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Launch the workspace to set up your master password and emergency recovery key.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/app">
                <Button size="sm" className="gap-1.5">
                  <span>Open Lokker Vault</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

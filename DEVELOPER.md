# DEVELOPER.md — Lokker

A developer who has never seen this repository should be able to understand
the architecture, the design system, and the workflow after reading this file.

Status markers are used throughout: **IMPLEMENTED** (exists, described as it
is), **PLANNED** (next moves), **FUTURE** (reserved boundary, not built).
Documentation must always describe reality — update this file when the
architecture changes.

## 1. Project overview

Lokker is a local-first personal security and digital-utility workspace —
credentials, bookmarks, authentication utilities, privacy utilities, secure
personal data, and security health, managed locally on the user's device.
The password vault is the security core, but the product is broader than a
password manager. See PRODUCT.md for the why. This file is the how.

## 2. Technology stack (IMPLEMENTED)

| Concern | Choice | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.3.3 |
| Language | TypeScript | 6.x (.ts / .tsx throughout) |
| UI runtime | React | 19.2.8 |
| Styling | Tailwind CSS | v4 (CSS-first config, no tailwind.config) |
| Components | shadcn/ui (`radix-nova` style, Radix base) | CLI 4.x |
| Icons | lucide-react | 1.x |
| Theming | CSS variables + next-themes (class strategy) | 0.4.x |
| Testing | Vitest + Testing Library (jsdom) | 4.x |
| Linting | ESLint 9 (`eslint-config-next`) | 9.x |

Import alias: `@/*` → `src/*` (tsconfig.json).

## 3. Folder architecture (IMPLEMENTED)

```
src/
├── app/                  # Next.js App Router
│   ├── (marketing)/      # Public site boundary (/, /features, /security, /privacy, /docs, /download)
│   ├── (app)/app/        # Product workspace under /app (passwords, bookmarks, totp, files, settings)
│   ├── globals.css       # Design tokens + theme definitions
│   └── layout.tsx        # Root layout: fonts, ThemeProvider, metadata
├── components/
│   ├── modals/           # App modals (import-backup-modal, add-password, add-file, etc.)
│   ├── views/            # Workspace views (passwords, bookmarks, totp, security, files, settings, import-export)
│   ├── ui/               # shadcn primitives in TypeScript
│   └── theme-provider.tsx
├── lib/                  # Native Web Crypto, IndexedDB, Backup engine, CSV/JSON Importers, TOTP
├── types.ts              # Canonical domain models (Passwords, Bookmarks, Backup, Files, Settings)
└── test/                 # Test suites (crypto, totp, backup, extension, importers, foundations)
public/
└── extension/            # Manifest V3 browser extension (background, content, popup, vault)
```

Conventions:
- All identifiers (entries, bookmarks, files, categories, toasts, sync/import IDs) are
  generated through `src/lib/id.ts`: `generateId(prefix)` (crypto.randomUUID) and
  `randomHex(length)`. `Date.now()`/`Math.random()` identifiers are forbidden.

## 4. Design system (IMPLEMENTED)

### 4.1 Token architecture

All tokens live in `src/app/globals.css` in four layers:

1. **Primitives** — oklch color values per theme in `:root` / `.dark`.
2. **Semantic Lokker tokens** — `--surface`, `--surface-elevated`,
   `--surface-overlay`, `--surface-hover`, `--surface-active`,
   `--border-subtle`, `--border-strong`, `--success/-foreground`,
   `--warning/-foreground`, `--info/-foreground`, `--inset-highlight`,
   `--duration-fast/normal/slow`, `--z-base/dropdown/sticky/modal/toast`.
3. **shadcn mapping** — `--background`, `--card`, `--popover`, `--primary`,
   `--ring`, etc. so shadcn primitives style themselves from our tokens.
4. **Tailwind `@theme inline`** — exposes utilities: `bg-surface`,
   `border-border-subtle`, `text-success`, `text-display`, `text-heading`,
   `text-label`, `text-caption`, `ease-standard`, `ease-emphasized`,
   `shadow-xs…overlay`, `inset-shadow-highlight`, `rounded-sm…4xl`.

## 5. Security & Cryptographic Architecture (IMPLEMENTED)

Lokker implements a local-first **3-Tier Envelope Encryption Architecture** using native Web Crypto API:

1. **Vault Encryption Key (VEK):**
   - A cryptographically random 256-bit AES-GCM symmetric key (`crypto.subtle.generateKey`).
   - Used directly for encrypting/decrypting the entire vault payload (`PasswordEntry[]`) and stored file attachments in the File Vault.
   - Each encryption operation generates a unique, cryptographically random 12-byte initialization vector (IV).

2. **Key Encryption Keys (KEKs) & Key Wrapping:**
   - **Password KEK:** Derived from the user's Master Password + 16-byte random salt using PBKDF2 (SHA-256, 100,000 iterations). Wraps the VEK using AES-GCM (`wrappedVekByPassword`).
   - **Recovery KEK:** Derived from the 32-character hexadecimal Emergency Recovery Key + 16-byte random recovery salt using PBKDF2 (SHA-256, 100,000 iterations). Wraps the SAME VEK using AES-GCM (`wrappedVekByRecoveryKey`).
   - **Password Rotation:** Re-wrapping the existing VEK under a new Password KEK allows changing the master password without re-encrypting the underlying vault payload or invalidating the Emergency Recovery Key.
   - **Recovery Key Unlock:** The emergency recovery key derives the Recovery KEK, unwraps the VEK, and restores vault access without requiring server assistance.

3. **Full Encrypted Vault Backup Engine (`src/lib/backup.ts`):**
   - Bundles all vault collections (passwords, bookmarks, categories, files, settings, and envelope metadata) into a versioned container (`lokker-encrypted-backup`, v2).
   - Encrypts the JSON payload with a fresh random salt and 12-byte IV using PBKDF2 (100,000 iterations SHA-256) + AES-GCM-256.
   - Safe inspection mechanism parses non-secret summary headers before prompting for decryption.
   - Provides safe Merge (non-destructive URL/username deduplication) and Fresh Replace restore strategies.

4. **Browser Extension Architecture (`public/extension/`):**
   - Manifest V3 extension communicating securely with the web app via `window.postMessage` handshake.
   - Background service worker maintains session lock state in `chrome.storage.session`.
   - Content script inspects inputs for username/password fields and queries the background service worker using active tab domain.
   - Strict domain matching prevents squatting and subdomain spoofing (rejects `evil-example.com` or `example.com.phishing.org`).
   - Content scripts only receive domain-filtered matching credentials (least privilege).
   - Vault sync messages are accepted only from an exact origin allowlist enforced in
     `content/trusted-origins.js`, sourced from the extension environment file `config.js`
     (see §8). Plain http is trusted only for hardcoded local dev hosts; hostname
     substring matching is forbidden.
   - Autofill badge visibility (`chrome.storage.local.badgeAllSites`, default `false`):
     badge renders only when the vault is unlocked and the page has matching
     credentials; `badgeAllSites: true` restores badge-on-every-login-form. The popup
     exposes the toggle plus a connection status line and a "Sync Now" control.

5. **WebAuthn PRF Passkey Unlock (IMPLEMENTED, authenticator-dependent):**
   - The VEK is wrapped under a KEK derived from the WebAuthn PRF extension output,
     so no key material is ever stored. Registration asks for PRF evaluation at
     credential creation; if the authenticator only supports PRF during assertions
     (`prf.enabled === false`), a follow-up assertion derives the key.
   - Authenticators WITHOUT PRF support (Windows Hello, Touch ID / iCloud Keychain,
     most built-in browser passkeys) fail registration with explicit guidance.
     PRF-capable: FIDO2 security keys with PRF (YubiKey 5.3+), passkey providers
     that implement PRF (e.g. 1Password), Chrome on Android (Google Password Manager).
   - No `authenticatorAttachment` or `transports` restriction is imposed, so roaming
     security keys (USB/NFC/BLE) can register and assert. All failures throw
     `AppError` and surface `userMessage` in the unlock modal / Settings.

6. **Storage & Memory Hygiene:**
   - Sensitive keys exist only in ephemeral client memory during an active unlocked session.
   - The master password is never kept in React state or long-lived memory: it exists only
     inside the unlock/setup handler scope, and backup export re-collects it through
     `BackupPasswordModal` (verified via the stored verifier) at export time.
   - Auto-lock timer clears decrypted vault arrays and unloads crypto keys.
   - Dark web breach checks use SHA-1 k-Anonymity (5-character prefix search with `Add-Padding: true`).

## 7. Testing (IMPLEMENTED)

Vitest 4 + Testing Library, jsdom environment. Config: `vitest.config.mjs`.

- `src/test/crypto.test.ts`: 12 tests verifying VEK derivation, key wrapping, password rotation, emergency recovery unlock, file encryption, and tampering authentication.
- `src/test/totp.test.ts`: 10 tests verifying RFC 6238 test vectors, base32 decoding, and fail-closed error behavior.
- `src/test/backup.test.ts`: 8 composite tests covering 24 backup/restore requirements (export, encryption, inspection, schema validation, merge deduplication, tampering rejection).
- `src/test/extension.test.ts`: 11 tests verifying the trusted-origin allowlist, URL domain extraction, strict domain matching against squatting attacks, credential filtering, and V2 VEK unwrapping.
- `src/test/importers.test.ts`: 6 tests verifying Chrome, Bitwarden, and 1Password CSV/JSON parsing and field mapping.
- `src/test/product.test.ts`: 5 tests verifying password generator modes, entropy calculation, nested category parent mappings, and bidirectional credential/bookmark synchronization.
- `src/test/foundations.test.ts`: 8 tests verifying design token foundations, theme switching, app configuration, and the ID/random helpers.

All 60 tests pass cleanly.

## 8. Commands

```bash
npm install        # install dependencies
npm run dev        # dev server on 0.0.0.0:3000 (Turbopack)
npm run lint       # ESLint check
npm test           # Run all unit tests
npm run build      # Production build
npm start          # Serve production build
```

## 9. Configuration & Environments (IMPLEMENTED)

Environment-specific values (URLs, origins) live in exactly two places — one per runtime:

1. **Web app — `NEXT_PUBLIC_APP_URL` (.env):**
   - Read only through `src/config/app.ts` (`appConfig.url`), with an `http://localhost:3000` fallback.
   - Local development: copy `.env.example` to `.env.local` (`.env*` is gitignored).
   - Production: set `NEXT_PUBLIC_APP_URL` in the Vercel project environment settings
     (current deployment origin: `https://lokker-vault.vercel.app`).
2. **Browser extension — `public/extension/config.js`:**
   - The extension ships without a build step, so this file is its environment:
     `appOrigin` (the vault the popup opens) and the trusted vault-sync hosts/suffixes.
   - It is loaded before `popup.js` (popup.html) and injected first into every
     content script (manifest.json). Content scripts run in Chrome's isolated
     world, so page scripts cannot override these values.

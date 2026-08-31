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
└── test/                 # Test suites (crypto, backup, extension, importers, foundations)
public/
└── extension/            # Manifest V3 browser extension (background, content, popup, vault)
```

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

5. **Storage & Memory Hygiene:**
   - Sensitive keys exist only in ephemeral client memory during an active unlocked session.
   - Auto-lock timer clears decrypted vault arrays and unloads crypto keys.
   - Dark web breach checks use SHA-1 k-Anonymity (5-character prefix search with `Add-Padding: true`).

## 6. Testing (IMPLEMENTED)

Vitest 4 + Testing Library, jsdom environment. Config: `vitest.config.mjs`.

- `src/test/crypto.test.ts`: 12 tests verifying VEK derivation, key wrapping, password rotation, emergency recovery unlock, file encryption, and tampering authentication.
- `src/test/backup.test.ts`: 8 composite tests covering 24 backup/restore requirements (export, encryption, inspection, schema validation, merge deduplication, tampering rejection).
- `src/test/extension.test.ts`: 7 tests verifying URL domain extraction, strict domain matching against squatting attacks, credential filtering, and V2 VEK unwrapping.
- `src/test/importers.test.ts`: 6 tests verifying Chrome, Bitwarden, and 1Password CSV/JSON parsing and field mapping.
- `src/test/product.test.ts`: 5 tests verifying password generator modes, entropy calculation, nested category parent mappings, and bidirectional credential/bookmark synchronization.
- `src/test/foundations.test.ts`: 3 tests verifying design token foundations and theme switching.

All 41 tests pass cleanly.

## 7. Commands

```bash
npm install        # install dependencies
npm run dev        # dev server on 0.0.0.0:3000 (Turbopack)
npm run lint       # ESLint check
npm test           # Run all 41 unit tests
npm run build      # Production build
npm start          # Serve production build
```

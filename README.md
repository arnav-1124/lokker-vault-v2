# Lokker — Local-First Zero-Knowledge Password Vault & Security Workspace

> **Your vault. Your device. Your keys. Your data. Your control.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-62%20passed-success?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Production](https://img.shields.io/badge/Production-Live%20on%20Vercel-blueviolet?style=flat-square)](https://lokker-vault.vercel.app)

**Lokker** is a local-first personal security and digital-utility workspace built for privacy-conscious users, developers, and professionals. It brings credential management, bookmarks, RFC 6238 time-based two-factor authentication (TOTP), an encrypted file vault, deep security health audits, and browser autofill into a single coherent local application running directly on your device.

**Production Deployment:** [https://lokker-vault.vercel.app](https://lokker-vault.vercel.app)

---

## Key Highlights

- **Local-First Zero-Knowledge Architecture**: The browser is your data authority. Credentials and encryption keys never leave your device unencrypted.
- **3-Tier Envelope Encryption**: Native Web Crypto API utilizing 256-bit AES-GCM Vault Encryption Keys (VEK) wrapped by PBKDF2-derived Key Encryption Keys (KEK).
- **Emergency Recovery Key**: Instant offline 32-character hexadecimal emergency recovery key allowing self-sovereign vault recovery if master password is forgotten.
- **RFC 6238 TOTP Authenticator**: Native 2FA generator with real-time 30-second countdown dials, Base32 key validation, and 1-click clipboard copying.
- **Encrypted File Vault**: Client-side AES-GCM 256-bit encrypted file storage for sensitive documents, identity records, and seed phrases.
- **Full Portability & Backup Engine**: Encrypted container backups (`.lokker` format) with pre-restore summary inspection, merge deduplication, and external imports (Chrome, Bitwarden, 1Password).
- **Security Health & Dark Web Auditor**: Local password entropy rating, reused/weak password analysis, and Have I Been Pwned checks using privacy-preserving SHA-1 k-anonymity (`Add-Padding: true`).
- **Manifest V3 Browser Extension**: Contextual login field detection, strict anti-phishing domain allowlists, and real-time handshake with the web vault.
- **Modern Design System**: Built with Tailwind CSS v4, shadcn/ui primitives, tactile glassmorphism surfaces, and dark/light theme support.

---

## Cryptographic Architecture

Lokker uses standard, audited Web Crypto APIs natively implemented in modern browsers:

```
+-------------------------------------------------------------------------+
|                       Master Password / Recovery Key                    |
+-------------------------------------------------------------------------+
                                    |
                                    v (PBKDF2 SHA-256, 100k iterations)
+-------------------------------------------------------------------------+
|                  Key Encryption Key (KEK: Password / Recovery)          |
+-------------------------------------------------------------------------+
                                    |
                                    v (AES-GCM 256-bit Key Unwrap)
+-------------------------------------------------------------------------+
|                     Vault Encryption Key (VEK: AES-GCM 256)             |
+-------------------------------------------------------------------------+
           |                                             |
           v (AES-GCM-256, 12-byte IV)                   v (AES-GCM-256, 12-byte IV)
+------------------------------------+       +------------------------------------+
|  Encrypted Vault (Credentials)     |       |  Encrypted File Vault (Documents)  |
+------------------------------------+       +------------------------------------+
```

1. **Vault Encryption Key (VEK)**: A cryptographically random 256-bit AES-GCM symmetric key generated via `crypto.subtle.generateKey`.
2. **Key Encryption Keys (KEKs)**: Derived from either the Master Password or the Emergency Recovery Key using PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt).
3. **In-Place Rotation**: Rotating the Master Password or Emergency Recovery Key re-wraps the existing VEK in-place without re-encrypting the underlying database.
4. **Memory Hygiene**: Secret keys exist only in ephemeral client memory during an active unlocked session and are purged upon inactivity or lock.

---

## Tech Stack

- **Framework**: [Next.js 16.3.3](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript 6.0](https://www.typescriptlang.org/)
- **UI Runtime**: [React 19.2.8](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first token architecture)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Local Storage**: IndexedDB (`LokkerLocalVaultDB`)
- **Testing**: [Vitest 4.1](https://vitest.dev/) with `@testing-library/react` and `jsdom`
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Project Structure

```
lokker-vault/
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Public static routes (/, /features, /security, /privacy, /docs, /download)
│   │   ├── (app)/app/             # Local-first application workspace (/app, /passwords, /totp, /files, etc.)
│   │   ├── globals.css            # 4-layer design token system
│   │   └── layout.tsx             # Root HTML layout and font loading
│   ├── components/
│   │   ├── modals/                # Unlock, Setup, Backup, and Entry modals
│   │   ├── views/                 # Domain views (Passwords, Bookmarks, TOTP, Security, Files, Settings)
│   │   └── ui/                    # shadcn/ui components
│   ├── context/                   # Decomposed vault context providers (UI, Nav, Security, Data, Backup)
│   ├── lib/                       # Web Crypto, IndexedDB, TOTP, Importers, ID generator
│   ├── types.ts                   # Canonical TypeScript domain types
│   └── test/                      # Vitest test suites (62 unit tests)
├── public/
│   ├── extension/                 # Manifest V3 browser extension source
│   └── favicon.svg                # Application branding
├── PRODUCT.md                     # Product philosophy, mission, and scope boundaries
├── DEVELOPER.md                   # Comprehensive technical and architectural guide
└── AGENTS.md                      # Operational rulebook for coding assistants
```

---

## Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm, pnpm, or bun

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arnav-1124/lokker-vault-v2.git
   cd lokker-vault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the application.

5. **Run test suite:**
   ```bash
   npm test
   ```

6. **Run linter:**
   ```bash
   npm run lint
   ```

7. **Build for production:**
   ```bash
   npm run build
   ```

---

## Installing the Browser Extension

Lokker includes a Manifest V3 browser extension for one-click autofill:

1. Open your Chromium-based browser (Chrome, Brave, Edge).
2. Navigate to `chrome://extensions/` and enable **Developer mode** (top right toggle).
3. Click **Load unpacked**.
4. Select the `public/extension` folder from this repository.
5. The extension will automatically detect login forms and connect securely via `window.postMessage` to `https://lokker-vault.vercel.app` (or your local dev instance on `localhost:3000`).

---

## Documentation

- **[PRODUCT.md](PRODUCT.md)**: Product identity, vision, core principles, and scope boundaries.
- **[DEVELOPER.md](DEVELOPER.md)**: Cryptographic deep-dive, token system, architecture, and developer guidelines.
- **[AGENTS.md](AGENTS.md)**: Strict operational constraints for automated agents and contributors.

---

## License

Private / Proprietary. All rights reserved.

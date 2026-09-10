# INTERNAL_DEV_GUIDE.md — Lokker Deployment & Maintenance Guide

> **Internal Developer Reference**  
> Target Audience: Developers, DevOps, and Maintainers of Lokker Vault.  
> Purpose: Step-by-step instructions for deploying, configuring, maintaining, and scaling Lokker Vault in simple, practical terms.

---

## 1. Product & Architecture Overview

Lokker is a **local-first, zero-knowledge password vault and personal security workspace**.

- **Frontend Framework**: Next.js 16.3.3 (App Router, Turbopack), React 19, TypeScript 6.
- **Styling**: Tailwind CSS v4 (CSS-first token architecture in `src/app/globals.css`), shadcn/ui.
- **Client-side Storage**: IndexedDB database (`LokkerLocalVaultDB`) in the user's browser.
- **Cryptographic Primitives**: Native browser `crypto.subtle` (AES-GCM 256-bit, PBKDF2 SHA-256 100,000 iterations).
- **Browser Extension**: Manifest V3 extension in `public/extension/`.
- **Live Production URL**: [https://lokker-vault.vercel.app](https://lokker-vault.vercel.app)

---

## 2. Environment Variables Reference

Lokker requires **only one environment variable** for standard operation because all data encryption and storage occurs client-side on the user's device.

| Variable Name | Required? | Default Fallback | Purpose & Origin |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | **Yes (in prod)** | `http://localhost:3000` | The public URL of the deployed web application (e.g. `https://lokker-vault.vercel.app`). Used for canonical links, absolute asset URLs, and extension postMessage security allowlists. |

### Why is it prefixed with `NEXT_PUBLIC_`?
In Next.js, variables without the `NEXT_PUBLIC_` prefix are only accessible on the server. Because Lokker runs client-side components and browser extension communication bridges in the user's browser, the public deployment origin must be readable by the browser runtime.

### Where is it read in the codebase?
It is parsed exclusively through a single configuration file:
- [`src/config/app.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/lokker-vault/src/config/app.ts):
  ```typescript
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  export const appConfig = {
    name: "Lokker",
    url: envUrl && envUrl.length > 0 ? envUrl : "http://localhost:3000",
  };
  ```

### Browser Extension Environment
The browser extension does not run a Next.js build step. Its deployment origin is defined in:
- [`public/extension/config.js`](file:///c:/Users/Arnav112/OneDrive/Desktop/lokker-vault/public/extension/config.js):
  ```javascript
  const appOrigin = 'https://lokker-vault.vercel.app';
  const trustedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'lokker-vault.vercel.app'];
  ```
  *(Update this file whenever deploying to a custom domain so the extension content script accepts vault sync handshakes from your custom domain).*

---

## 3. Step-by-Step Deployment Guide

### Option A: Deploying to Vercel (Recommended)

Vercel is the primary host for Lokker because of native Turbopack and App Router edge support.

#### Step 1: Push Code to GitHub
Ensure your repository is hosted on GitHub (e.g., `https://github.com/arnav-1124/lokker-vault-v2`).

#### Step 2: Create a New Project on Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select and import the `lokker-vault-v2` repository.

#### Step 3: Configure Build Settings
Vercel automatically detects Next.js. Verify the following:
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Step 4: Add Environment Variables
Under the **Environment Variables** section:
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://lokker-vault.vercel.app` (or your custom domain)
- **Environments**: Check all: `Production`, `Preview`, and `Development`.

#### Step 5: Click Deploy
Vercel will run `npm install`, compile the static routes, and deploy the application in ~1 minute.

---

### Option B: Adding a Custom Domain

1. Go to your Project on Vercel → **Settings** → **Domains**.
2. Enter your domain (e.g. `vault.yourdomain.com` or `yourdomain.com`).
3. In your DNS provider (Cloudflare, Namecheap, GoDaddy, Route53), add the DNS records prompted by Vercel:
   - For an apex domain (`yourdomain.com`): Add an **A** record pointing to `76.76.21.21`.
   - For a subdomain (`vault.yourdomain.com`): Add a **CNAME** record pointing to `cname.vercel-dns.com`.
4. Update `NEXT_PUBLIC_APP_URL` in Vercel settings to match the new domain.
5. In `public/extension/config.js`, add your new domain to `appOrigin` and `trustedHosts`.

---

### Option C: Browser Extension Distribution

1. **Testing Locally**:
   - Open Chrome / Brave / Edge and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in top-right corner).
   - Click **Load unpacked** and select the `public/extension` folder.
2. **Publishing to Chrome Web Store**:
   - Compress the contents of `public/extension/` into a `.zip` archive (do not zip the parent folder; zip the files inside).
   - Log in to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devpanel).
   - Pay the one-time $5 Google Developer registration fee.
   - Click **New Item**, upload the `.zip`, fill out description, privacy disclosures (stating no personal data is collected or transmitted to external servers), and submit for review.

---

## 4. Maintenance & Operations Runbook

### Routine Commands
Run these commands locally before committing or deploying any code changes:

```bash
# 1. Start local dev server (0.0.0.0:3000)
npm run dev

# 2. Run unit tests with Vitest (62 tests must pass)
npm test

# 3. Check for code syntax and styling issues
npm run lint

# 4. Compile optimized production build locally to verify no type/route errors
npm run build
```

### IndexedDB Schema Migrations
The local vault uses IndexedDB defined in [`src/lib/db.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/lokker-vault/src/lib/db.ts).
- Current database version: `DB_VERSION = 2`.
- Active Object Stores: `bookmarks`, `categories`, `vault_meta`, `settings`, `encrypted_files`.
- **Rule for modifying stores**: If you add, delete, or rename an object store in IndexedDB, increment `DB_VERSION` (e.g. to `3`) and add the upgrade migration logic inside `request.onupgradeneeded` in `src/lib/db.ts`.

### Cryptographic Invariants (DO NOT BREAK)
1. **Zero-Knowledge**: Never transmit the master password or unencrypted credentials over network requests.
2. **Key Derivation**: Always use PBKDF2 with SHA-256 and at least 100,000 iterations for master password hashing and key derivation.
3. **Randomness**: Always use `crypto.getRandomValues()` for salts, IVs, and keys. Never use `Math.random()`.
4. **Memory Hygiene**: Do not hold the master password in React state or long-term browser storage. Only keep the derived `CryptoKey` in active ephemeral memory during an unlocked session.

---

## 5. Future External Services & Subscriptions to Maintain

When transitioning from the current local-first standalone model to an **optional zero-knowledge cloud sync & team collaboration backend**, you will need to set up and maintain the following external services:

```
+----------------------------------------------------------------------------------------------------+
|                                    FUTURE BACKEND ARCHITECTURE                                     |
|                                                                                                    |
|   [Client: Web / Extension]                                                                        |
|       |                                                                                            |
|       | (Encrypted Blobs Only / Zero-Knowledge Payload)                                            |
|       v                                                                                            |
|   [API Gateway / Serverless] ------> [Database: PostgreSQL]                                        |
|   (Vercel / Supabase / Fly.io)       (Stores User Accounts, Encrypted Vault Blobs, Wrapped CEKs)   |
|       |                                                                                            |
|       +----------------------------> [Transactional Email: Resend / Postmark]                      |
|                                      (Invites, Magic Links, Security Notifications)                |
+----------------------------------------------------------------------------------------------------+
```

### 1. Database & Cloud Backend Hosting
- **Recommended Providers**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage), [Neon](https://neon.tech/), or [Cloudflare D1 / Workers](https://workers.cloudflare.com/).
- **What it stores**: Encrypted ciphertext blobs, user public keys, wrapped Collection Encryption Keys (CEKs), billing status. The backend **never** has access to plaintext secrets or master passwords.
- **Subscription Cost**:
  - **Free Tier**: $0/mo (good for MVP, up to 500MB database, 50,000 monthly active users on Supabase).
  - **Pro Tier**: ~$25/mo per project when moving to production with automated backups and no project pausing.

### 2. Transactional Email Service
- **Recommended Providers**: [Resend](https://resend.com/) or [Postmark](https://postmarkapp.com/).
- **What it is used for**: Team invitation emails, password reset alerts, account verification codes.
- **Subscription Cost**:
  - **Free Tier**: $0/mo (Resend gives 3,000 emails/month free).
  - **Pro Tier**: ~$20/mo for 50,000 emails/month.

### 3. Domain & DNS Management
- **Recommended Providers**: [Cloudflare](https://www.cloudflare.com/) (recommended for free DDoS mitigation, SSL, and DNS management) or Namecheap/Porkbun.
- **Subscription Cost**:
  - Domain registration (`lokker.io`, `lokkervault.com`): ~$10 - $30 / year.
  - Cloudflare DNS & SSL: Free.

### 4. Commercial Dark Web Breach Monitoring (Optional)
- **Provider**: [Have I Been Pwned API](https://haveibeenpwned.com/API/v3).
- **Current Status**: Lokker currently queries `api.pwnedpasswords.com/range/{prefix}` using SHA-1 k-anonymity, which is **100% free and requires no API key**.
- **Future Commercial Use**: If you add domain-wide email monitoring ("notify me if any employee's email appears in a breach"), an HIBP subscription is required:
  - **Subscription Cost**: ~$3.50/month per API key.

### 5. App Store & Extension Developer Accounts
- **Google Chrome Web Store**: $5 one-time developer registration fee.
- **Apple Developer Program** (if building Safari extension or macOS app): $99 / year.
- **Microsoft Edge Add-ons**: Free / $19 one-time registration.

### 6. Application Monitoring & Error Tracking
- **Recommended Providers**: [Sentry](https://sentry.io/) or self-hosted GlitchTip.
- **Privacy Rule**: Configure Sentry to **sanitize all request bodies, URLs, and state objects** so no vault ciphertext, salts, or passwords are ever captured in error traces.
- **Subscription Cost**: Free Developer tier (up to 5,000 errors/month); Team plan starts at $26/month.

---

## 6. Quick Troubleshooting Guide

| Issue | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **Extension popup shows "Not connected"** | Web vault tab is not open or domain mismatch. | Ensure `https://lokker-vault.vercel.app` or `http://localhost:3000` is open in an active tab and unlocked. Verify `appOrigin` in `public/extension/config.js`. |
| **WebAuthn fails during setup** | The authenticator lacks WebAuthn PRF extension support. | Explain to the user that standard Windows Hello or Touch ID lacks PRF. Use a YubiKey (firmware 5.3+), 1Password passkey, or unlock via Master Password. |
| **Changes not showing on Vercel deployment** | Build cache or failed build. | Check Vercel deployment logs; ensure `npm run build` succeeds locally first. |
| **Vault data reset or missing** | Browser site data was wiped. | Restore vault using the latest `.lokker` encrypted backup file or external import (Chrome/Bitwarden CSV) via `/app/import-export`. |

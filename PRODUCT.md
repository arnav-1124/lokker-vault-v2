# PRODUCT.md — Lokker

Single source of truth for **what Lokker is, why it exists, and how far its
scope reaches**. If product scope changes, update this file in the same change.

## 1. Product identity

**Lokker is a local-first personal security and digital-utility workspace**
that lets users manage credentials, bookmarks, authentication codes, privacy
utilities, secure personal data, and security health directly on their device.

The password vault is the security core, but Lokker is **not merely a
password manager**. It brings credentials, bookmarks, authentication
utilities, privacy utilities, security health, migration/portability, browser
integration, and secure personal data into one coherent local-first product.

**Positioning:** *Your vault. Your device. Your keys. Your data. Your control.*

Privacy is not a marketing claim — it is a core architectural principle.
Lokker is designed so the user's sensitive data never depends on a centralized
cloud credential authority. Any future backend is an **optional** encrypted
synchronization/coordination layer, never the plaintext authority over the
user's vault.

## 2. Vision

Create a private digital workspace where people can manage the credentials,
websites, authentication codes, sensitive information, and security tools
they rely on every day — without surrendering control of that information to
a centralized cloud provider.

## 3. Mission

Make secure digital habits easier: reduce credential friction, keep sensitive
information under the user's control, combine security and utility into one
coherent experience, and provide strong security without unnecessary
complexity — all while remaining useful without requiring users to surrender
their data to a cloud provider.

## 4. Core product principles

1. Meaningful user value over feature count.
2. Privacy is the product.
3. Security is architecture, not a bolted-on feature.
4. Local-first by default.
5. User data ownership and portability.
6. Calm and trustworthy UX; minimal friction in daily workflows.
7. No unnecessary cloud dependency. No dark patterns.
8. No feature exists merely to make the product look larger.
9. Established standards and mature technologies.
10. **Stop when the product reaches industry/enterprise-standard quality** —
    deliver a trustworthy, useful, maintainable product and ship. Avoid
    endless hardening, speculative abstractions, premature optimization,
    and feature creep.

## 5. Product areas

### A. Credential management (IMPLEMENTED)

- Password vault: logins, secure notes, personal identities, TOTP secrets where applicable
- Password generation with multiple strategies (passphrases, character-based, patterned)
- Password history, favorites, search, categories with nesting
- Categories are a cross-product organizational primitive (§7), not a password-only concept

### B. Bookmark management (IMPLEMENTED)

A proper bookmark manager: save, organize, nested categories, favorites,
search, website metadata.

**Product principle — manage a website once.** Credentials and bookmarks
maintain an integrated relationship across the workspace.

### C. Authentication utilities (IMPLEMENTED)

- TOTP / 2FA authenticator with RFC 6238 time-based one-time code generation,
  real-time countdown timers, and one-click copying
- Emergency recovery key unlock mechanism (32-character hexadecimal)
- WebAuthn / passkey unlock (FUTURE boundary)

### D. Security health (IMPLEMENTED)

Continuous, actionable insight into the security state of stored credentials:
- Weak, reused, and missing password detection with live password strength entropy metrics
- Credential-level findings and security health overview score
- Have I Been Pwned dark web checks via privacy-preserving SHA-1 k-anonymity (5-char prefix search)
- Direct remediation workflows

### E. Privacy utilities (FUTURE, carefully bounded)

- Masked email / privacy-friendly email workflows

### F. Secure personal data & File Vault (IMPLEMENTED)

Encrypted File Vault preserving sensitive documents, credentials, and notes. Files
are encrypted at rest using AES-GCM 256-bit with random 12-byte IVs derived from
the active Vault Encryption Key (VEK).

### G. Full Backup & Portability Engine (IMPLEMENTED)

Portability is first-class and independent of browser/machine state:
- **Full Encrypted Lokker Backup (`.lokker`):** Exports the ENTIRE vault (passwords,
  bookmarks, categories, nested hierarchies, TOTP secrets, favorites, settings,
  encrypted file attachments, and envelope metadata) inside a PBKDF2 (100k iterations)
  + AES-GCM-256 encrypted envelope.
- **Safe Restore Flow:** Non-secret pre-restore summary inspection (passwords,
  bookmarks, categories, nested tags, TOTP codes, encrypted files), password
  decryption challenge, and selection between:
  1. **Safe Merge & Synchronize:** Adds non-duplicate records while preserving local items.
  2. **Complete Fresh Restore:** Replaces local vault state with the backup snapshot.
- **External Password Manager Imports:** Dedicated parsers for Chrome, Bitwarden,
  and 1Password CSV/JSON exports with conflict preview and deduplication.
- **Unencrypted JSON Export:** Available only as an explicit, high-friction,
  warning-guarded operation for manual interoperability.

### H. Browser Extension & Autofill (IMPLEMENTED)

Manifest V3 browser extension with local-first secure communication:
- Contextual login field detection and one-click autofill overlay.
- Badge appears by default only on sites with vault-matching credentials; a popup
  toggle ("Show autofill badge on every site") opts into badge-on-every-login-form.
- Real-time postMessage handshake between Web Vault and background service worker,
  with explicit connection status and a "Sync Now" control in the popup.
- Strict origin/domain validation: Rejects squatting attacks (e.g. `evil-github.com`
  or `github.com.attacker.com` never match `github.com`).
- Least-privilege architecture: Content scripts receive only domain-filtered matching
  credentials, never raw vault keys or raw ciphertext arrays.
- Automatic session locking and synchronization with web vault state.

### I. Dashboard (IMPLEMENTED)

Interactive dashboard answering *"What is the state of my digital security and vault right now?"*
— live counts, health score breakdown, category distribution, recent activity, and quick actions.

## 6. Local-first principle (fundamental)

- The user's device is the primary data authority.
- Sensitive data stays local whenever possible.
- The architecture never requires users to trust Lokker with plaintext
  credentials.
- Future cloud functionality is designed around encrypted data and
  zero-knowledge principles; the backend is optional infrastructure for
  encrypted synchronization — never the authority over plaintext credentials.

## 7. Cross-product concepts

- **Categories:** nested, usable across credentials, bookmarks, notes, and
  other vault objects; integrated with search/filters; favorites where
  appropriate.
- **Favorites:** a cross-entity concept, not per-feature ad-hoc.

## 8. Information surfaces (do not merge)

**A. Marketing / landing experience** — attracts and builds trust: why
Lokker exists, philosophy, high-level privacy/security architecture,
capability demonstrations.

**B. Feature guide / product documentation** — teaches: what each feature
does, workflows, security behavior, imports/exports, extension behavior,
recovery, privacy architecture.

Marketing attracts. The Feature Guide teaches. They are distinct surfaces.

**Routing boundary:** public marketing routes live at the root
(`/`, `/features`, `/security`, `/privacy`, `/docs`, `/download`)
under the `(marketing)` route group; the product workspace lives under `/app`
under the `(app)/app` route-group structure.

## 9. Product scope boundary

The boundary is: **personal security, credential management, privacy
utilities, secure personal data, and browser productivity.**

Good future features strengthen one or more of these areas. Features that
are unrelated are rejected, even when technically possible. Lokker must not
become an arbitrary utility platform or an "everything app."

## 10. Target users

People who want serious, local control over their digital security without
handing their data to a cloud provider: privacy-conscious individuals,
technical users, and professionals who care where their data lives.

## 11. Design language (summary)

Full tokens: `src/app/globals.css`; rules: AGENTS.md; details: DEVELOPER.md §4.

- **Dark-first.** Very dark slate/charcoal with subtly separated surface
  levels; never pure black. An independently designed light theme shares the
  same semantic token names.
- **Trust blue** accent; restrained, accessible semantic status colors.
- **Tactile, not decorative:** depth from surface hierarchy, 1px borders,
  inset highlights, restrained shadows, hover/pressed states, spacing.
- **shadcn/ui is the component foundation.**
- **Motion is functional** (~120/180/280 ms), always respecting
  `prefers-reduced-motion`.

## 12. Current development stage

**Full Application Workspace + Complete Portability & Extension Engine (IMPLEMENTED).**
The full interactive local-first workspace `/app`, 3-tier VEK/KEK envelope
encryption, emergency recovery key unlock, full `.lokker` encrypted backup/restore,
Manifest V3 browser extension autofill, encrypted file vault, RFC 6238
TOTP authenticator, password generator, bookmarks manager, and marketing
suite exist and operate locally in the browser with IndexedDB persistence.

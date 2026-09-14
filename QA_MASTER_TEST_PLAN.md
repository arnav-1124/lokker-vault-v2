# Lokker Vault — Master End-to-End & Deep Adversarial QA Test Plan

**Version**: 2.3.0  
**Target Application**: Lokker Vault ([https://www.lokker.space](https://www.lokker.space) / Localhost)  
**Audience**: QA Engineers, Security Auditors, Product Verification Teams  
**Scope**: 100% Comprehensive Coverage — Functional, Destructive, Cryptographic, Adversarial, Offline, and Edge-Case Scenarios.  
**Rule**: No happy-path only testing. Every feature, button, dropdown, modal, keyboard shortcut, and slider must be tested to its absolute boundaries, stress limits, and failure modes.

---

## Document Index & Verification Modules

1. [Module 1: Progressive Web App (PWA) & Offline Desktop/Mobile Installation](#module-1-progressive-web-app-pwa--offline-desktopmobile-installation)
2. [Module 2: Master Password, PBKDF2 Key Derivation, VEK & Emergency Recovery Key](#module-2-master-password-pbkdf2-key-derivation-vek--emergency-recovery-key)
3. [Module 3: Password Manager — Storage Scopes, Generation & Ping-Pong Guards](#module-3-password-manager--storage-scopes-generation--ping-pong-guards)
4. [Module 4: Scope-Aware Deletion, Cryptographic Tombstones & Zombie Resurrection Prevention](#module-4-scope-aware-deletion-cryptographic-tombstones--zombie-resurrection-prevention)
5. [Module 5: Bookmarks Management & Favicon Resolution](#module-5-bookmarks-management--favicon-resolution)
6. [Module 6: RFC 6238 TOTP 2FA Authenticator & Clock Drift](#module-6-rfc-6238-totp-2fa-authenticator--clock-drift)
7. [Module 7: Passkeys Vault (WebAuthn / FIDO2 Credentials)](#module-7-passkeys-vault-webauthn--fido2-credentials)
8. [Module 8: Client-Side Encrypted File Vault (AES-GCM 256-bit)](#module-8-client-side-encrypted-file-vault-aes-gcm-256-bit)
9. [Module 9: Privacy Relays & Masked Email Aliases (DuckDuckGo & BYOK)](#module-9-privacy-relays--masked-email-aliases-duckduckgo--byok)
10. [Module 10: Security Watchtower, k-Anonymity Breach Checks & 2FA Directory](#module-10-security-watchtower-k-anonymity-breach-checks--2fa-directory)
11. [Module 11: Multi-Tier Category Tree & Circular Ancestor Prevention](#module-11-multi-tier-category-tree--circular-ancestor-prevention)
12. [Module 12: Vault Lock, Inactivity Timers, Clipboard Auto-Clear & Memory Zeroization](#module-12-vault-lock-inactivity-timers-clipboard-auto-clear--memory-zeroization)
13. [Module 13: Import & Export (.lokker Container vs CSV/JSON Parsers)](#module-13-import--export-lokker-container-vs-csvjson-parsers)
14. [Module 14: Zero-Knowledge Encrypted Cloud Sync & Multi-Device Convergence](#module-14-zero-knowledge-encrypted-cloud-sync--multi-device-convergence)
15. [Module 15: Team & Family Workspaces, RBAC Permissions & Audit Logging](#module-15-team--family-workspaces-rbac-permissions--audit-logging)
16. [Module 16: Manifest V3 Browser Extension & Automated Packaging](#module-16-manifest-v3-browser-extension--automated-packaging)
17. [Module 17: Dynamic Browser Tab Titles, Navigation & Command Palette](#module-17-dynamic-browser-tab-titles-navigation--command-palette)
18: [Module 18: Settings, Storage Breakdown & Nuclear Data Wipe](#module-18-settings-storage-breakdown--nuclear-data-wipe)
19. [Module 19: Responsive Design, Mobile Drawer & Touch Targets](#module-19-responsive-design-mobile-drawer--touch-targets)
20. [Module 20: Accessibility, Keyboard Navigation & Focus Trapping](#module-20-accessibility-keyboard-navigation--focus-trapping)
21. [Module 21: Extreme Stress, High-Volume Data & Chaos Testing](#module-21-extreme-stress-high-volume-data--chaos-testing)
22. [Module 22: Biometric Passkey / WebAuthn Cloud Sign-In & Authentication](#module-22-biometric-passkey--webauthn-cloud-sign-in--authentication)
23. [Module 23: 3-Tier Multi-Admin Governance, Activity Log RBAC & Category UX](#module-23-3-tier-multi-admin-governance-activity-log-rbac--category-ux)
24. [Module 24: Workspace Live Sync & Per-User Distinct Favorites](#module-24-workspace-live-sync--per-user-distinct-favorites)
25. [Module 25: Workspace Security Watchtower, Breach Checks & Remediation (Phase 3)](#module-25-workspace-security-watchtower-breach-checks--remediation-phase-3)
26. [Module 26: Workspace Password & Key Generator (Phase 3)](#module-26-workspace-password--key-generator-phase-3)
27. [Module 27: Workspace Encrypted Import & Export (Phase 3)](#module-27-workspace-encrypted-import--export-phase-3)
28. [Module 28: Zero-Knowledge Real-Time Cross-Member SSE Sync (Phase 4)](#module-28-zero-knowledge-real-time-cross-member-sse-sync-phase-4)
29. [Module 29: Granular 4-Tier Workspace RBAC & Compliance Audit Trail Exports (Phase 5)](#module-29-granular-4-tier-workspace-rbac--compliance-audit-trail-exports-phase-5)

---

## Quick Automated Verification Commands

Run these automated verification suites directly from the terminal before performing manual QA:

```bash
# Run all 28 automated test suites (221 tests)
npm test

# Run specific Phase 5 test suite (4-Tier RBAC & Compliance Audit Exports)
npx vitest run src/test/workspace-rbac.test.ts

# Run specific Phase 4 test suite (Real-Time SSE Sync)
npx vitest run src/test/workspace-realtime.test.ts

# Verify strict TypeScript typechecking
npx tsc --noEmit
```

# Verify Next.js production build and route compilation
npm run build
```

---

## Module 1: Progressive Web App (PWA) & Offline Desktop/Mobile Installation

### Test Case PWA-001: Web App Manifest Integrity & Asset Verification
- **Priority**: P0 (Critical)
- **Preconditions**: Fresh browser session in Google Chrome, Edge, or Brave.
- **Test Steps**:
  1. Open DevTools $\rightarrow$ Application tab $\rightarrow$ Manifest.
  2. Verify Application name is `"Lokker — Zero-Knowledge Password Vault"` and short name is `"Lokker"`.
  3. Verify Start URL resolves to `/app` and Display Mode is `"standalone"`.
  4. Verify Theme color (`#090d16`) and Background color (`#090d16`).
  5. Inspect declared icons: `icon-192x192.png`, `icon-512x512.png`, and maskable icon `icon-maskable-512x512.png`.
  6. Click each icon link in DevTools and verify HTTP 200 without broken links.
  7. Verify Quick Shortcuts are present: Passwords (`/app/passwords`), 2FA (`/app/totp`), Generator (`/app/generator`), Security Audit (`/app/security-audit`).
- **Expected Result**: Manifest passes Lighthouse PWA criteria with 0 errors or missing fields.

### Test Case PWA-002: Service Worker Precache & 100% Offline Launch
- **Priority**: P0 (Critical)
- **Preconditions**: Lokker loaded in browser tab at `/app`.
- **Test Steps**:
  1. In DevTools $\rightarrow$ Application $\rightarrow$ Service Workers, confirm `public/sw.js` is active and running.
  2. Open DevTools Network tab $\rightarrow$ Toggle network mode to **"Offline"** (or turn off Wi-Fi/Airplane mode).
  3. Hard refresh the page (`Ctrl+F5` or `Cmd+Shift+R`).
  4. Navigate across all sidebar views: `/app/passwords`, `/app/bookmarks`, `/app/totp`, `/app/generator`, `/app/settings`.
- **Adversarial / Destructive Checks**:
  - Verify no blank white screen or dinosaur offline page appears.
  - Verify header displays amber offline pill: `[ ⚡ Offline (Local Vault Active) ]`.
  - Add a new local password entry while offline. Verify it saves successfully to local IndexedDB.
  - Verify that attempting cloud sync while offline gracefully shows a clean offline error toast instead of crashing.
- **Expected Result**: Full offline operational capability; application shell and all local vault functions operate seamlessly without internet connectivity.

### Test Case PWA-003: Desktop App Installation Flow & Standalone Mode Detection
- **Priority**: P1 (High)
- **Preconditions**: PWA not yet installed on testing workstation.
- **Test Steps**:
  1. Navigate to `/app` in Google Chrome or Edge.
  2. Verify `[ 📥 Install App ]` button is visible in the top header and in the sidebar navigation footer.
  3. Click `[ 📥 Install App ]`.
  4. Verify native browser modal appears asking "Install app Lokker?".
  5. Click "Install".
  6. Verify Lokker opens in an independent, chromeless desktop window (standalone mode).
  7. Verify window title bar matches Lokker dark theme (`#090d16`).
  8. In Settings View (`/app/settings`), verify the PWA status card shows "Installed (Standalone App Mode)" and the install trigger button is hidden.
- **Expected Result**: App installs cleanly to OS application drawer/desktop and runs in dedicated window mode.

### Test Case PWA-004: Service Worker Background Update & Hot-Reload Prompt
- **Priority**: P2 (Normal)
- **Preconditions**: Standalone or browser tab open with active service worker.
- **Test Steps**:
  1. Trigger an updated service worker registration (simulate newer version in `sw.js`).
  2. Verify an `[ 🔄 Update Ready ]` notification pill appears non-intrusively in the header.
  3. Click the update button.
  4. Verify service worker issues `skipWaiting()` and page cleanly reloads with fresh assets.
- **Expected Result**: Smooth update flow without losing local vault unlock state or corrupting in-memory entries.

---

## Module 2: Master Password, PBKDF2 Key Derivation, VEK & Emergency Recovery Key

### Test Case KDF-001: Initial Vault Setup & Password Entropy Validation
- **Priority**: P0 (Critical)
- **Preconditions**: New browser profile with empty IndexedDB.
- **Test Steps**:
  1. Navigate to `http://localhost:3000/app` (or production).
  2. Verify Setup Master Password dialog automatically opens.
  3. Test boundary inputs:
     - 1 character: Verify rejected with minimum length error.
     - Whitespace-only string (`"        "`): Verify rejected.
     - Mismatched confirmation password: Verify rejected with error highlighting confirmation field.
     - 128-character long complex phrase: Verify accepted.
  4. Enter valid master password: `"Correct-Horse-Battery-Staple-2026!"`.
- **Adversarial / Cryptographic Checks**:
  - Open DevTools Console/Network. Confirm password plaintext is NEVER logged or transmitted.
  - Inspect IndexedDB `LokkerLocalVaultDB` $\rightarrow$ `vault_meta`.
  - Confirm `salt` is present (random 16-byte hex).
  - Confirm `wrappedVekByPassword` is stored as AES-GCM ciphertext with random IV.
  - Confirm master password itself is NOT stored anywhere on disk.
- **Expected Result**: Master password derives 256-bit AES-GCM KEK via 100,000 PBKDF2 iterations; random 256-bit VEK is generated and wrapped.

### Test Case KDF-002: Emergency Recovery Key Generation, Confirmation & Cold Storage
- **Priority**: P0 (Critical)
- **Preconditions**: Completing KDF-001 setup wizard.
- **Test Steps**:
  1. Verify Step 2 of setup presents the 32-character hexadecimal Emergency Recovery Key formatted into 4-character blocks: `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`.
  2. Test "Copy Key" button: verify toast appears and clipboard contains exact 32-character key without hyphens.
  3. Test "Download Recovery Kit": verify `.txt` file downloads containing key, creation timestamp, and zero-knowledge instructions.
  4. Click "Continue": Verify a confirmation challenge modal asks user to confirm their Recovery Key before proceeding.
  5. Test entering an incorrect recovery key: verify system rejects and prevents advancing.
  6. Enter correct key: verify wizard finishes and vault unlocks into Dashboard.
- **Expected Result**: Recovery key is verified by user before vault setup completes.

### Test Case KDF-003: Emergency Recovery Key Reset Workflow (Forgotten Password)
- **Priority**: P0 (Critical)
- **Preconditions**: Vault populated with passwords, currently in locked state.
- **Test Steps**:
  1. Click "Lock Vault" in header (`Alt+L`).
  2. On unlock modal, click "Forgot Master Password?".
  3. Verify Emergency Recovery Modal appears explaining that master password will be reset without data loss.
  4. Test typing an invalid/corrupted recovery key:
     - 31 characters: Verify validation catches length.
     - Non-hex characters (`"ZZZZ-..."`): Verify rejected.
     - Valid hex but incorrect key: Verify decryption fails with "Invalid Recovery Key".
  5. Enter the correct 32-character Recovery Key and supply a brand new Master Password: `"BrandNewSecurePassword2026!"`.
  6. Click "Reset Master Password & Unlock".
- **Cryptographic Checks**:
  - Verify vault successfully unlocks.
  - Verify ALL existing password entries, bookmarks, and files are 100% intact and readable.
  - Lock vault again.
  - Attempt unlock with the OLD master password: verify rejected.
  - Attempt unlock with the NEW master password: verify unlocked immediately.
- **Expected Result**: Zero data loss recovery using Recovery Key unwraps VEK and re-wraps with new password salt/KEK.

### Test Case KDF-004: Master Password In-Place Rotation (Settings View)
- **Priority**: P1 (High)
- **Preconditions**: Vault unlocked.
- **Test Steps**:
  1. Navigate to `/app/settings` $\rightarrow$ "Change Master Password".
  2. Supply incorrect current password: verify rotation blocked.
  3. Supply correct current password, enter new password, confirm.
  4. Click "Update Master Password".
  5. Verify rotation completes in under 1 second without re-encrypting underlying items.
- **Expected Result**: Only `wrappedVekByPassword` is updated in `vault_meta`. Vault items remain untouched.

---

## Module 3: Password Manager — Storage Scopes, Generation & Ping-Pong Guards

### Test Case PWD-001: Comprehensive Password Entry Creation (All Fields)
- **Priority**: P0 (Critical)
- **Preconditions**: Vault unlocked at `/app/passwords`.
- **Test Steps**:
  1. Click `+ Add Password` (`Alt+N`).
  2. Fill all fields:
     - Title / Service: `"Proton Mail"`
     - Website URL: `"https://mail.proton.me/login"`
     - Username / Email: `"tester.alex@proton.me"`
     - Password: Click Generator icon $\rightarrow$ set length to 24 $\rightarrow$ toggle symbols on $\rightarrow$ click "Use Password".
     - Category: Select `"Personal"`.
     - Notes: Multi-line note containing special characters, unicode, and emojis: `🔒 Encrypted Note with € & emojis 🚀✨`.
     - Tags: `"email"`, `"privacy"`.
     - 2FA / TOTP Secret: `"JBSWY3DPEHPK3PXP"`.
     - Storage Scope: Select `"Cloud Synced"`.
  3. Click "Save Password".
- **Adversarial Input Checks**:
  - Test XSS string in Title: `<script>alert('xss')</script>`. Verify safely escaped, no execution.
  - Test SQL injection string in Notes: `' OR '1'='1; DROP TABLE passwords; --`. Verify stored as plain text string.
  - Test 10,000-character lorem ipsum string in notes. Verify no UI crash or overflow.
- **Expected Result**: Password is encrypted with active VEK into IndexedDB and visible in passwords list.

### Test Case PWD-002: Storage Scope Selection & Local-Only Isolation Prompt
- **Priority**: P0 (Critical)
- **Preconditions**: User is logged into Lokker Cloud session.
- **Test Steps**:
  1. Open Add Password modal.
  2. Set Storage Scope toggle to **"Local Device Only"**.
  3. Click "Save Password".
  4. Verify `SaveScopeWarningModal` appears with clear non-technical explanation:
     - "Save to Local Device Only?"
     - "You chose to save this credential strictly on this local device. It will not be backed up to your encrypted cloud."
  5. Test option 1: Click "Add to Cloud Instead" $\rightarrow$ verify item saves with `storageScope: 'cloud'`.
  6. Create another item with "Local Device Only" $\rightarrow$ Check "Don't ask me again on this device" $\rightarrow$ Click "Save Locally".
  7. Verify item saves with `storageScope: 'local'`.
  8. Create a third item with "Local Device Only" $\rightarrow$ verify warning modal is bypassed.
  9. Go to Settings $\rightarrow$ reset warning preference $\rightarrow$ verify warning modal reappears on local save.
- **Expected Result**: Storage scope preferences are strictly obeyed and local items are never exposed upstream.

### Test Case PWD-003: Linked Bookmark Add-Sync & Ping-Pong Mirror Protection
- **Priority**: P1 (High)
- **Preconditions**: Clean vault with zero bookmarks matching `"https://linear.app"`.
- **Test Steps**:
  1. At `/app/passwords`, create new entry:
     - Website Name: `"Linear"`
     - Website URL: `"https://linear.app"`
     - Username: `"dev@linear.app"`
  2. Save entry.
  3. Navigate to `/app/bookmarks`.
  4. Verify a corresponding bookmark `"Linear"` with URL `"https://linear.app"` was automatically generated with matching storage scope.
  5. Edit the newly created password entry $\rightarrow$ change notes $\rightarrow$ save.
  6. Verify linked bookmark prompt appears: "A bookmark for 'linear.app' already exists. Do you want to edit it now?".
  7. Click "Edit Bookmark" $\rightarrow$ modal opens $\rightarrow$ click Save.
  8. **Adversarial Check (Ping-Pong Guard)**:
     - Verify saving the bookmark from the suggestion does NOT trigger a loop prompt to edit the password again.
- **Expected Result**: Seamless add-sync between passwords and bookmarks with zero ping-pong dialog recursion.

### Test Case PWD-004: Password List Search, Multi-Filter & Sorting Extremes
- **Priority**: P1 (High)
- **Preconditions**: Vault with 50+ diverse passwords.
- **Test Steps**:
  1. Type partial match `"prot"` into search: verify `"Proton Mail"` remains visible while others filter out instantly.
  2. Search by username snippet (`"@proton.me"`): verify item is matched.
  3. Search by tag (`"privacy"`): verify filtered results match tag.
  4. Select Category filter `"Personal"`: verify only personal items display.
  5. Test all sorting options:
     - Alphabetical A $\rightarrow$ Z and Z $\rightarrow$ A
     - Date Created (Newest First / Oldest First)
     - Date Modified
     - Strength (Weakest First / Strongest First)
  6. Verify list sorts instantly without layout jumping or scroll position glitches.
- **Expected Result**: Ultra-fast search and sorting operations on client-side encrypted state.

---

## Module 4: Scope-Aware Deletion, Cryptographic Tombstones & Zombie Resurrection Prevention

### Test Case DEL-001: Cloud Item Deletion — "Delete Everywhere" Flow
- **Priority**: P0 (Critical)
- **Preconditions**: Cloud session active. A password entry exists with `storageScope: 'cloud'`.
- **Test Steps**:
  1. On password card, click the trash/delete button.
  2. Verify `DeleteItemModal` opens with:
     - Trash icon container with red tint.
     - Title: "Delete Password Entry".
     - Target summary with `[ ☁️ Cloud Synced ]` blue pill badge.
     - Explanation: "This item is synced to Lokker Cloud and your connected devices. Choose where to delete it:".
     - Option 1: **"Delete Everywhere"** (Red destructive button).
     - Option 2: **"Remove from Cloud Only"** (Keep locally button).
  3. Click **"Delete Everywhere"**.
  4. Verify item disappears immediately from UI list.
  5. Inspect `localStorage.getItem("lokker_cloud_tombstones")`.
     - Verify entry ID exists in dictionary with timestamp: `{ "pwd-id": 17... }`.
  6. Trigger cloud sync (`vault.triggerCloudSync()`).
  7. Verify cloud sync completes without error.
  8. Refresh the browser page / simulate sync on Device B.
  9. **Critical Assertion**: Verify the deleted item does NOT resurrect on this device or remote devices.
- **Expected Result**: Deletion tombstone prevents resurrection during merge and purges item from cloud.

### Test Case DEL-002: Cloud Item Deletion — "Remove from Cloud Only" Flow
- **Priority**: P0 (Critical)
- **Preconditions**: Cloud session active. Entry `"Personal Bank"` has `storageScope: 'cloud'`.
- **Test Steps**:
  1. Click delete on `"Personal Bank"`.
  2. In `DeleteItemModal`, click **"Remove from Cloud Only" (Keep Locally Only)**.
  3. Verify toast displays: `"Removed from cloud. Kept locally on this device."`.
  4. Verify item is STILL visible in local passwords list.
  5. Open edit modal for `"Personal Bank"`.
  6. Verify storage scope has been changed to `storageScope: 'local'`.
  7. Trigger cloud sync (`vault.triggerCloudSync()`).
  8. Inspect outgoing payload: Verify `"Personal Bank"` is EXCLUDED from cloud passwords payload, and its ID is included in `deletedItemIds` tombstones.
  9. Simulate download on Device B: Verify Device B drops its copy, while Device A safely retains its local-only copy.
- **Expected Result**: Item transitions to local-only scope without data loss on originating device.

### Test Case DEL-003: Local Item Deletion — "Delete from Device Only" Flow
- **Priority**: P1 (High)
- **Preconditions**: Password entry with `storageScope: 'local'`.
- **Test Steps**:
  1. Click delete on local password entry.
  2. Verify `DeleteItemModal` opens with:
     - Badge: `[ 🖴 Device Only ]`.
     - Warning: "This credential is not saved to the cloud. Once deleted, it cannot be recovered.".
     - Single destructive button: **"Delete from Device"**.
  3. Click "Delete from Device".
  4. Verify item is purged from local IndexedDB.
- **Expected Result**: Clean local deletion with zero cloud sync overhead.

### Test Case DEL-004: Empty Vault Deletion Resilience (Zero Resurrection on Reload)
- **Priority**: P0 (Critical)
- **Preconditions**: Vault with demo or user bookmarks/categories.
- **Test Steps**:
  1. Navigate to `/app/bookmarks`.
  2. Delete every single bookmark until count is 0. Verify empty state placeholder is shown.
  3. Navigate to `/app/categories` or sidebar.
  4. Delete every category until count is 0.
  5. Hard refresh the browser (`Ctrl+F5` / `Cmd+Shift+R`).
  6. Check `/app/bookmarks` and sidebar categories.
- **Critical Assertion**:
  - Verify count remains strictly 0.
  - Verify initial sample bookmarks (`GitHub`, `Gmail`, `Notion`) DO NOT re-seed or resurrect.
  - Inspect `localStorage`: Verify `lokker_bookmarks_initialized` and `lokker_categories_initialized` are `"true"`.
- **Expected Result**: Empty vault states persist across browser reloads.

---

## Module 5: Bookmarks Management & Favicon Resolution

### Test Case BMK-001: Add, Filter, and Favorite Bookmarks
- **Priority**: P1 (High)
- **Preconditions**: Vault unlocked at `/app/bookmarks`.
- **Test Steps**:
  1. Click `+ Add Bookmark`.
  2. Fill:
     - Title: `"AWS Management Console"`
     - URL: `"https://console.aws.amazon.com"`
     - Category: `"Work"`
     - Description: `"Cloud infrastructure console"`
     - Favorite: Toggle ON.
  3. Save bookmark.
  4. Verify bookmark card renders with:
     - Favicon or colored domain placeholder fallback.
     - Title, URL hostname (`console.aws.amazon.com`), and category badge.
     - Yellow favorite star indicator.
  5. Navigate to `/app/favorites`. Verify the bookmark appears in the Favorites view.
  6. Click star on favorite card to un-favorite $\rightarrow$ verify it disappears from Favorites view in real time.
- **Expected Result**: Bookmarks organize and update dynamically across views.

### Test Case BMK-002: Malformed URL Handling & Safe URL Normalization
- **Priority**: P2 (Normal)
- **Preconditions**: Add Bookmark modal open.
- **Test Steps**:
  1. Test entering bare domains: `"gitlab.com"` $\rightarrow$ verify auto-prepends `https://`.
  2. Test local network URLs: `"http://192.168.1.1:8080"` $\rightarrow$ verify preserved.
  3. Test `localhost` with ports: `"http://localhost:3000"` $\rightarrow$ verify preserved.
  4. Test javascript pseudo-protocol: `"javascript:alert(1)"` $\rightarrow$ verify rejected / blocked.
  5. Test clicking external link arrow on bookmark card: verify opens in new tab with `rel="noopener noreferrer"`.
- **Expected Result**: Robust URL sanitization preventing reverse-tabnabbing and malicious schemes.

---

## Module 6: RFC 6238 TOTP 2FA Authenticator & Clock Drift

### Test Case TOTP-001: Manual RFC 6238 Secret Ingestion & Real-Time Code Generation
- **Priority**: P0 (Critical)
- **Preconditions**: Standard RFC 6238 seed: `"JBSWY3DPEHPK3PXP"` (Base32 representation of ASCII `"12345678901234567890"`).
- **Test Steps**:
  1. Navigate to `/app/totp` $\rightarrow$ Add 2FA Account.
  2. Service: `"Google"`, Account: `"user@gmail.com"`, Secret: `"JBSWY3DPEHPK3PXP"`.
  3. Algorithm: SHA-1, Digits: 6, Period: 30 seconds.
  4. Save entry.
  5. Compare generated 6-digit code against Google Authenticator or standard RFC 6238 reference engine at identical epoch timestamp.
- **Adversarial Checks**:
  - Test secret with lowercase characters: `"jbswy3dpehpk3pxp"` $\rightarrow$ verify auto-normalized.
  - Test secret with spaces: `"JBSW Y3DP EHPK 3PXP"` $\rightarrow$ verify whitespace stripped automatically.
  - Test invalid base32 characters (e.g. `8`, `9`, `0`, `1` in secret): verify validation rejects invalid base32.
- **Expected Result**: 100% mathematical parity with RFC 6238 standard; live countdown wheel updates every second.

### Test Case TOTP-002: Countdown Wheel Visual States & Ephemeral Clipboard Copy
- **Priority**: P1 (High)
- **Preconditions**: TOTP entry running on `/app/totp`.
- **Test Steps**:
  1. Observe the circular countdown timer during a 30-second window:
     - 30s to 11s: Indicator displays primary/green tint.
     - 10s to 6s: Indicator shifts to amber/warning tint.
     - 5s to 0s: Indicator pulses red.
  2. Click the 6-digit code or "Copy Code" button.
  3. Verify toast displays: `"2FA code copied to clipboard (clears in 30s)"`.
  4. Paste into external notepad: verify exact 6-digit string.
  5. Wait 30 seconds (or configured clipboard timer):
     - Attempt paste into notepad.
     - Verify clipboard has been cleared or replaced with dummy whitespace.
- **Expected Result**: Time-sensitive feedback and zero credential remnants in system clipboard.

---

## Module 7: Passkeys Vault (WebAuthn / FIDO2 Credentials)

### Test Case PSK-001: Passkey Listing, Relying Party Association & Metadata
- **Priority**: P1 (High)
- **Preconditions**: Navigate to `/app/passkeys`.
- **Test Steps**:
  1. Add Passkey record:
     - Relying Party ID (`rpId`): `"webauthn.io"`
     - Username / User Handle: `"alex.security"`
     - Credential ID: Hex or Base64URL string.
  2. Verify passkey entry displays FIDO2 shield icon, relying party domain, creation date, and credential ID snippet.
  3. Filter passkeys using the search bar: verify instant keyword filtering by RP ID or username.
  4. Delete passkey: verify confirmation modal opens and deletion removes record from IndexedDB `passkeys` store.
- **Expected Result**: Clean management of WebAuthn credentials matching FIDO2 specification.

---

## Module 8: Client-Side Encrypted File Vault (AES-GCM 256-bit)

### Test Case FIL-001: File Encryption, Storage & Verified Decryption Roundtrip
- **Priority**: P0 (Critical)
- **Preconditions**: Vault unlocked at `/app/files`. Prepare test files:
  - `sample.pdf` (Document, 2 MB)
  - `confidential.png` (Image, 1.5 MB)
  - `keys.txt` (Text file, 10 KB)
- **Test Steps**:
  1. Drag and drop `sample.pdf` into the upload dropzone (or click Browse).
  2. Monitor upload:
     - Verify client reads `ArrayBuffer` via `FileReader`.
     - Verify file data is encrypted with active VEK using AES-GCM 256-bit with unique 12-byte random IV.
     - Verify ciphertext blob and metadata (filename, size, MIME type, SHA-256 hash) are stored in IndexedDB `encrypted_files`.
  3. In DevTools Application $\rightarrow$ IndexedDB $\rightarrow$ `encrypted_files`:
     - Inspect raw stored record.
     - **Critical Verification**: Confirm the stored binary data is completely unreadable ciphertext; PDF magic bytes (`%PDF-`) are NOT present unencrypted on disk.
  4. In Lokker File Vault UI, click "Download File".
  5. Verify client decrypts ciphertext in memory and triggers browser download.
  6. Compute SHA-256 hash of downloaded file and compare against original file.
- **Expected Result**: Cryptographic hash matches original bit-for-bit (zero byte corruption).

### Test Case FIL-002: Oversized File Protection & Storage Quota Boundaries
- **Priority**: P1 (High)
- **Preconditions**: Prepare a file larger than 50 MB (e.g. 75 MB video or ISO).
- **Test Steps**:
  1. Attempt to upload the 75 MB file.
  2. Verify system displays a clear warning modal explaining that browser IndexedDB performance degrades with files exceeding 50 MB.
  3. Verify option to abort upload is provided.
- **Expected Result**: Browser memory is protected against out-of-memory crash.

---

## Module 9: Privacy Relays & Masked Email Aliases (DuckDuckGo & BYOK)

### Test Case MSK-001: Zero-Config DuckDuckGo Alias Generation
- **Priority**: P1 (High)
- **Preconditions**: Navigate to `/app/masked-emails`.
- **Test Steps**:
  1. Click `+ Generate Masked Email`.
  2. Select Provider: `"DuckDuckGo (@duck.com)"`.
  3. Service Name: `"Shopping Site"`.
  4. Click "Generate".
  5. Verify an 8-character random alphanumeric alias is generated (e.g. `k8x9m2p1@duck.com`).
  6. Click "Copy Email" $\rightarrow$ verify copies cleanly.
  7. Toggle active/inactive forwarding state $\rightarrow$ verify status badge toggles between active green and paused amber.
- **Expected Result**: Instant offline generation of privacy forwarding aliases.

### Test Case MSK-002: Bring-Your-Own-Key (BYOK) Masked Email Integration
- **Priority**: P2 (Normal)
- **Preconditions**: Valid SimpleLogin or AnonAddy API token.
- **Test Steps**:
  1. In Masked Emails View $\rightarrow$ Provider Settings.
  2. Select SimpleLogin / AnonAddy $\rightarrow$ Enter API Key.
  3. Verify API key is stored encrypted in vault settings.
  4. Generate alias $\rightarrow$ verify client makes authorized call to relay API and receives confirmed forwarding alias.
  5. Supply invalid/revoked API key $\rightarrow$ verify user-friendly error message is displayed without raw HTTP stack trace.
- **Expected Result**: Secure BYOK relay configuration with encrypted credential storage.

---

## Module 10: Security Watchtower, k-Anonymity Breach Checks & 2FA Directory

### Test Case SEC-001: Comprehensive Security Health Score Calculation
- **Priority**: P1 (High)
- **Preconditions**: Navigate to `/app/security-audit`. Populate vault with:
  - 1 weak password (`"123456"`)
  - 2 duplicate passwords (`"Company2024!"` on two different entries)
  - 1 strong unique password (`"k9#M!p0$zQ8@vL2%wR5^tY1&"`)
  - 1 entry missing 2FA for a service known to support 2FA (e.g. GitHub)
- **Test Steps**:
  1. Observe Watchtower Health Score breakdown (0 to 100).
  2. Verify:
     - Weak Passwords card flags `"123456"`.
     - Reused Passwords card lists the 2 entries sharing `"Company2024!"`.
     - 2FA Missing card identifies GitHub.
  3. Click "Fix Now" on a flagged password $\rightarrow$ verify edit modal opens directly to that entry.
  4. Update password to a strong 24-character generated password $\rightarrow$ save.
  5. Return to Security Audit $\rightarrow$ verify score recalculates and increases immediately in real time.
- **Expected Result**: Accurate, actionable security telemetry without external cloud dependencies.

### Test Case SEC-002: HaveIBeenPwned k-Anonymity Privacy Invariant
- **Priority**: P0 (Critical)
- **Preconditions**: DevTools Network tab open with filter set to `api.pwnedpasswords.com` or backend relay.
- **Test Steps**:
  1. Add password known to be in data breaches: `"password123"`.
  2. Click "Check Breaches" in Watchtower.
  3. Compute SHA-1 hash of `"password123"` manually: `CBFDAC6008F9CAB4083784CBD1874F76618D2A97`.
  4. Inspect the HTTP request transmitted by Lokker:
     - Verify URL requested is ONLY the first 5 characters of hash: `/range/CBFDA`.
     - Verify headers include: `Add-Padding: true` (prevents response size analysis).
     - **Critical Invariant**: Verify the remaining 35 characters of the hash and plaintext password `"password123"` are NEVER present in request URL, headers, or body.
  5. Verify Watchtower correctly flags `"password123"` as compromised.
- **Expected Result**: Zero-knowledge breach detection upholding absolute privacy.

---

## Module 11: Multi-Tier Category Tree & Circular Ancestor Prevention

### Test Case CAT-001: Category Creation, Duplicate Prevention & Hierarchy
- **Priority**: P1 (High)
- **Preconditions**: Navigate to `/app/passwords` or open Category Modal from sidebar.
- **Test Steps**:
  1. Click `+ Add Category`.
  2. Enter Name: `"DevOps"`, Color: `#10b981`.
  3. Click Save.
  4. Attempt to create another category with name `"devops"` (case-insensitive duplicate).
  5. Verify system rejects duplicate with error: `"A category with this name already exists."`.
  6. Create sub-category:
     - Name: `"Kubernetes"`, Parent Category: `"DevOps"`.
  7. Verify sidebar renders nested indentation under `"DevOps"`.
- **Expected Result**: Robust category tree with strict duplicate validation.

### Test Case CAT-002: Category Deletion with Safe Item Transfer & Circular Guard
- **Priority**: P0 (Critical)
- **Preconditions**: Category `"Infrastructure"` has child `"Cloud"`, which has child `"AWS"`.
  Entries exist inside `"Infrastructure"`, `"Cloud"`, and `"AWS"`.
- **Test Steps**:
  1. Click delete on category `"Cloud"`.
  2. Verify `CategoryDeleteModal` appears.
  3. Inspect Target Category selection dropdown:
     - **Circular Guard Verification**: Verify `"AWS"` (child of `"Cloud"`) is EXCLUDED from transfer targets to prevent infinite circular reference loops.
  4. Select `"Infrastructure"` as transfer target.
  5. Click "Transfer & Delete Category".
  6. Verify `"Cloud"` is deleted.
  7. Verify all items previously inside `"Cloud"` now belong to `"Infrastructure"`.
  8. Verify `"AWS"` parent is re-linked safely to `"Infrastructure"`.
- **Expected Result**: Clean cascading re-parenting with zero circular reference deadlocks.

---

## Module 12: Vault Lock, Inactivity Timers, Clipboard Auto-Clear & Memory Zeroization

### Test Case LCK-001: Immediate Manual Lock & Cryptographic Memory Zeroing
- **Priority**: P0 (Critical)
- **Preconditions**: Vault unlocked with passwords visible on screen.
- **Test Steps**:
  1. Press keyboard shortcut `Alt+L` (or click "Lock Vault" in header).
  2. Verify UI instantly swaps to Master Password Unlock Modal.
  3. Verify all decrypted password lists, notes, and usernames are cleared from visible DOM.
  4. In DevTools Console:
     - Inspect in-memory state: verify derived CryptoKey reference is set to `null`.
  5. Attempt to use browser "Back" button: verify locked state persists.
  6. Supply incorrect password: verify locked state maintained.
  7. Supply correct password: verify vault unlocks with full data restored.
- **Expected Result**: Client memory is immediately cleared upon lock.

### Test Case LCK-002: Auto-Lock on Inactivity & Tab Visibility Change
- **Priority**: P1 (High)
- **Preconditions**: In Settings $\rightarrow$ Security, configure Auto-Lock Timer to **"1 Minute"**.
- **Test Steps**:
  1. Unlock vault.
  2. Leave workstation completely untouched for 65 seconds (zero mouse movements or keypresses).
  3. Verify vault locks automatically at the 60-second mark.
  4. Re-unlock vault.
  5. Configure "Lock on window blur / tab hide".
  6. Switch to a different browser tab for 5 seconds $\rightarrow$ switch back.
  7. Verify vault is locked immediately upon tab switch.
- **Expected Result**: Automatic lock guards against shoulder surfing and unattended workstations.

---

## Module 13: Import & Export (.lokker Container vs CSV/JSON Parsers)

### Test Case IMP-001: Export Encrypted `.lokker` v2 Backup Container
- **Priority**: P0 (Critical)
- **Preconditions**: Vault contains passwords, bookmarks, categories, and settings.
- **Test Steps**:
  1. Navigate to `/app/import-export`.
  2. Select "Export Encrypted Backup (.lokker)".
  3. Enter export backup password (or use Master Password).
  4. Click "Download Encrypted Backup".
  5. Inspect downloaded `.lokker` file in hex editor / text editor:
     - Verify JSON header specifies container version `2.0`.
     - Verify encryption algorithm is `"AES-GCM-256"`.
     - Verify key derivation salt is present.
     - Verify ciphertext blob is unreadable hex/base64.
- **Expected Result**: Industry-standard envelope backup ready for cold storage or device migration.

### Test Case IMP-002: Import `.lokker` Backup (Merge vs Overwrite Strategies)
- **Priority**: P0 (Critical)
- **Preconditions**: Exported `.lokker` file from IMP-001. Delete several items locally or use a fresh browser profile.
- **Test Steps**:
  1. At `/app/import-export`, drop `.lokker` file into import zone.
  2. Verify modal prompts for backup decryption password.
  3. Enter correct password $\rightarrow$ verify backup preview displays item counts (Passwords: X, Bookmarks: Y, Categories: Z).
  4. Test **Merge Strategy**:
     - Local items not in backup are preserved.
     - Matching items are updated if backup timestamp is newer.
  5. Verify import completes and toast confirms items restored.
- **Adversarial / Corrupted File Injection**:
  - Edit `.lokker` file with a text editor: alter 5 characters inside `cipherText`.
  - Attempt import: Verify AES-GCM authentication tag check fails and cleanly displays: `"Decryption failed: corrupted file or invalid password"`.
  - Verify vault state is untouched.
- **Expected Result**: Authenticated encryption detects byte-level corruption and protects local vault.

### Test Case IMP-003: 3rd-Party Password Manager CSV Importers
- **Priority**: P1 (High)
- **Preconditions**: Prepare test CSV exports from:
  - 1Password (CSV with Title, URL, Username, Password, Notes)
  - Bitwarden (JSON / CSV export)
  - LastPass (CSV export)
  - Chrome / Edge Passwords CSV
- **Test Steps**:
  1. Drop 1Password CSV into import zone.
  2. Verify auto-detector correctly identifies "1Password CSV".
  3. Inspect preview table: verify columns map to Website Name, URL, Username, and Password.
  4. Click "Confirm Import".
  5. Verify entries appear in passwords list with their respective categories.
- **Expected Result**: Flawless parsing across all major password manager exports.

---

## Module 14: Zero-Knowledge Encrypted Cloud Sync & Multi-Device Convergence

### Test Case SYN-001: Cloud Account Sign-Up, Sign-In & Remote VEK Wrapping
- **Priority**: P0 (Critical)
- **Preconditions**: Cloud backend active at `apiUrl`.
- **Test Steps**:
  1. In Lokker header, click `[ ☁️ Cloud Sync ]`.
  2. In Cloud Sync Modal, sign up with test email and password.
  3. Verify JWT access token and refresh token are stored in secure local session.
  4. Observe initial sync:
     - Client wraps VEK using Master Password KEK.
     - Sends wrapped VEK and salt to server.
     - Encrypts cloud-scoped items with VEK.
     - Uploads encrypted blob.
  5. Verify status pill transitions: `Syncing...` $\rightarrow$ `[ ☁️ Synced ]` with current timestamp.
- **Expected Result**: Zero-knowledge envelope sync established without transmitting plaintext credentials.

### Test Case SYN-002: Multi-Device Sync & Automatic Convergence
- **Priority**: P0 (Critical)
- **Preconditions**: Device A and Device B both signed into the same Lokker Cloud account.
- **Test Steps**:
  1. On Device A: Add password `"Stripe"` (`storageScope: 'cloud'`). Wait for auto-sync.
  2. On Device B: Trigger sync (or wait for auto-sync interval).
  3. Verify `"Stripe"` appears on Device B.
  4. On Device B: Edit `"Stripe"` username to `"admin@stripe.com"`.
  5. On Device A: Trigger sync.
  6. Verify Device A updates to `"admin@stripe.com"` (newest `updatedAt` wins).
  7. On Device A: Delete `"Stripe"` ("Delete Everywhere").
  8. On Device B: Trigger sync.
  9. Verify `"Stripe"` is deleted on Device B via tombstone reconciliation.
- **Expected Result**: Multi-device state stays in sync across create, update, and delete actions.

### Test Case SYN-003: Cloud Session Expiration & Refresh Token Recovery
- **Priority**: P1 (High)
- **Preconditions**: Active cloud session.
- **Test Steps**:
  1. In DevTools Application $\rightarrow$ LocalStorage, tamper with `accessToken` (simulate expired JWT).
  2. Trigger cloud sync.
  3. Verify client catches 401 Unauthorized $\rightarrow$ silently calls `/api/auth/refresh` using refresh token.
  4. Verify new access token is stored and sync completes without interrupting user.
  5. Simulate complete session revocation (wipe refresh token on server):
     - Trigger sync.
     - Verify client displays clean notification: `"Your cloud session has expired. Please sign back in."`.
     - Verify local vault data remains 100% accessible and unlocked.
- **Expected Result**: Graceful token recovery with zero data loss or application crashes.

---

## Module 15: Team & Family Workspaces, RBAC Permissions & Audit Logging

### Test Case WKS-001: Workspace Creation, Role Permissions & Multi-Tenant Switching
- **Priority**: P0 (Critical)
- **Preconditions**: Cloud Pro/Team account active.
- **Test Steps**:
  1. Click Workspace Switcher in top sidebar $\rightarrow$ `+ New Workspace`.
  2. Name: `"Engineering Team"`, Type: `"Team"`.
  3. Verify user is assigned **Owner** role.
  4. Switch into `"Engineering Team"`.
  5. Verify UI context shifts to workspace layout with dedicated sidebar, passwords, bookmarks, members, and activity log.
  6. Add password entry inside workspace.
  7. Switch back to Personal Vault.
  8. Verify the workspace password is NOT mixed into personal vault.
- **Expected Result**: Strict tenant isolation between personal vaults and shared workspaces.

### Test Case WKS-002: Member Invitations & RBAC Authorization Enforcement
- **Priority**: P0 (Critical)
- **Preconditions**: Workspace Owner active in `"Engineering Team"`.
- **Test Steps**:
  1. Navigate to `/app/workspace/[id]/members` $\rightarrow$ "Invite Member".
  2. Invite `member.bob@example.com` with Role: **Member**.
  3. Copy invite link $\rightarrow$ open in separate incognito window.
  4. Sign in as `member.bob@example.com` $\rightarrow$ Accept invite.
  5. Verify Bob can view and add passwords.
  6. **RBAC Enforcement**:
     - Verify Bob CANNOT delete the workspace.
     - Verify Bob CANNOT invite new Admins or change Owner settings.
     - Verify Bob CANNOT remove other members.
- **Expected Result**: Role-Based Access Control enforced on both client UI and API endpoints.

### Test Case WKS-003: Real-Time Workspace Audit Trail
- **Priority**: P1 (High)
- **Preconditions**: Multiple members active in workspace.
- **Test Steps**:
  1. User A creates a password entry.
  2. User B edits the password entry.
  3. User A deletes a bookmark.
  4. Navigate to `/app/workspace/[id]/activity`.
  5. Verify audit log displays chronological cards:
     - User A created password entry [Timestamp]
     - User B modified password entry [Timestamp]
     - User A deleted bookmark [Timestamp]
  6. Filter activity log by action type: verify filtering updates in real time.
- **Expected Result**: Comprehensive, immutable activity logging for team compliance.

---

## Module 16: Manifest V3 Browser Extension & Automated Packaging

### Test Case EXT-001: Automated Production Zip Packaging Script
- **Priority**: P0 (Critical)
- **Preconditions**: Terminal in workspace directory.
- **Test Steps**:
  1. Run command: `npm run package:ext`.
  2. Verify terminal output displays:
     - Manifest V3 validation passed.
     - Clean file inclusion list (no `.DS_Store`, `Thumbs.db`, or temp files).
     - Uncompressed vs compressed size reduction.
     - SHA-256 Checksum generated.
  3. Verify generated artifacts exist on disk:
     - `dist/lokker-extension-v1.0.0.zip` (for Chrome Web Store / Edge Add-ons upload).
     - `public/lokker-browser-extension-mv3.zip` (for Web Vault 1-click direct download).
  4. Extract zip: verify `manifest.json` is at root of archive with valid `"manifest_version": 3`.
- **Expected Result**: Production-ready extension archives generated with valid checksums.

### Test Case EXT-002: Browser Form Detection, Shadow DOM & Autofill
- **Priority**: P0 (Critical)
- **Preconditions**: Lokker Extension loaded unpacked in Google Chrome Dev mode.
- **Test Steps**:
  1. Navigate to test login page (e.g. `https://github.com/login`).
  2. Verify Lokker shield badge icon appears inside username and password input fields.
  3. Click shield icon:
     - Verify autofill dropdown renders inside isolated Shadow DOM (prevents page CSS/JS tampering).
     - Select matching credential: verify username and password populate correctly.
     - Trigger form submit.
  4. Test password capture on new registration:
     - Fill signup form on an unregistered domain.
     - Submit form.
     - Verify Lokker extension banner appears: `"Save password for [domain]?"`.
     - Click "Save": verify credential is encrypted and saved to vault.
- **Expected Result**: Phishing-resistant domain-matched autofill and credential capture.

---

## Module 17: Dynamic Browser Tab Titles, Navigation & Command Palette

### Test Case NAV-001: Dynamic Browser Tab Titles (`Lokker - <Page>`)
- **Priority**: P1 (High)
- **Preconditions**: Browser tab open with visible tab title bar.
- **Test Steps**:
  1. Navigate to `/app` $\rightarrow$ Verify browser tab title is:
     `Lokker - Dashboard`
  2. Click "Passwords" in sidebar (`/app/passwords`) $\rightarrow$ Verify tab title immediately updates to:
     `Lokker - Password Vault`
  3. Click "Settings" in sidebar (`/app/settings`) $\rightarrow$ Verify tab title immediately updates to:
     `Lokker - Settings`
  4. Click "Bookmarks" in sidebar (`/app/bookmarks`) $\rightarrow$ Verify tab title is:
     `Lokker - Bookmarks`
  5. Click "2FA Authenticator" (`/app/totp`) $\rightarrow$ Verify tab title is:
     `Lokker - 2FA Authenticator`
  6. Click "Password Generator" (`/app/generator`) $\rightarrow$ Verify tab title is:
     `Lokker - Password Generator`
  7. Click "Security Audit" (`/app/security-audit`) $\rightarrow$ Verify tab title is:
     `Lokker - Security Audit`
  8. Click "Passkeys" (`/app/passkeys`) $\rightarrow$ Verify tab title is:
     `Lokker - Passkeys`
  9. Click "File Vault" (`/app/files`) $\rightarrow$ Verify tab title is:
     `Lokker - File Vault`
  10. Click "Masked Emails" (`/app/masked-emails`) $\rightarrow$ Verify tab title is:
       `Lokker - Masked Emails`
  11. Click "Import & Export" (`/app/import-export`) $\rightarrow$ Verify tab title is:
       `Lokker - Import & Export`
  12. Click "Browser Extension" (`/app/extension`) $\rightarrow$ Verify tab title is:
       `Lokker - Browser Extension`
  13. Click "User Guide" (`/app/guide`) $\rightarrow$ Verify tab title is:
       `Lokker - User Guide`
  14. Click "Workspaces" (`/app/workspaces`) $\rightarrow$ Verify tab title is:
       `Lokker - Workspaces`
  15. Click "Favorites" (`/app/favorites`) $\rightarrow$ Verify tab title is:
       `Lokker - Favorites`
  16. Navigate to workspace: `/app/workspace/ws-1/passwords` $\rightarrow$ Verify tab title is:
       `Lokker - Workspace Passwords`
  17. Direct load (paste URL in new tab): `http://localhost:3000/app/passwords` $\rightarrow$ Verify initial server HTML title is:
       `Lokker - Password Vault`
- **Expected Result**: Instant, dynamic browser tab title synchronization across client navigation and direct SSR loads.

### Test Case NAV-002: Command Palette (`Cmd+K` / `Ctrl+K`) & Power-User Shortcuts
- **Priority**: P1 (High)
- **Preconditions**: Vault unlocked.
- **Test Steps**:
  1. Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux).
  2. Verify Command Palette modal opens with input auto-focused.
  3. Type `"passwords"` $\rightarrow$ press `Enter`: verify navigates to `/app/passwords`.
  4. Press `Cmd+K` $\rightarrow$ type `"lock"` $\rightarrow$ press `Enter`: verify vault locks immediately.
  5. Unlock vault $\rightarrow$ press `?`: verify Keyboard Shortcuts Help modal appears.
  6. Test single-key / alt shortcuts:
     - `Alt+N`: Opens New Password modal.
     - `Alt+B`: Opens New Bookmark modal.
     - `Alt+G`: Navigates to Generator.
     - `Alt+S`: Navigates to Settings.
- **Expected Result**: Fast keyboard-driven navigation across all vault entities.

---

## Module 18: Settings, Storage Breakdown & Nuclear Data Wipe

### Test Case SET-001: Storage Usage Breakdown Calculation
- **Priority**: P2 (Normal)
- **Preconditions**: Vault containing at least 10 passwords, 5 bookmarks, and 2 encrypted files.
- **Test Steps**:
  1. Navigate to `/app/settings`.
  2. Locate the "Storage & Local Footprint" telemetry card.
  3. Verify storage breakdown bar displays:
     - Passwords byte size
     - Bookmarks byte size
     - Files byte size
     - Total IndexedDB storage used vs quota estimate
  4. Add a new 2 MB file in `/app/files`.
  5. Return to `/app/settings`: verify the storage footprint increments accordingly in real time.
- **Expected Result**: Accurate, transparent byte accounting of client-side storage consumption.

### Test Case SET-002: Destructive Nuclear Wipe ("Reset All Vault Data")
- **Priority**: P0 (Critical - Destructive Extreme)
- **Preconditions**: Active vault with passwords, bookmarks, files, categories, and cloud session.
- **Test Steps**:
  1. In `/app/settings`, scroll to the Danger Zone.
  2. Click "Clear Vault Data / Factory Reset".
  3. Verify a high-friction confirmation challenge modal appears:
     - Warning: "This action will permanently delete all encrypted local data on this browser, purge all local encryption keys, and reset Lokker to its initial clean state."
     - Require user to type exact confirmation phrase: `"DELETE"`.
  4. Test typing incorrect word: `"delete"` (lowercase) or `"DEL"` $\rightarrow$ verify "Confirm Wipe" button remains disabled.
  5. Type `"DELETE"` exactly $\rightarrow$ click "Delete All Local Data".
  6. Observe system cleanup:
     - IndexedDB databases (`LokkerLocalVaultDB`) are deleted.
     - LocalStorage keys (`lokker_*`) are purged.
     - Cloud session cookies are cleared.
     - In-memory cryptographic keys are set to `null`.
  7. Verify user is redirected cleanly to the initial Master Password setup screen (`/app`).
  8. Hard refresh the page: verify the app stays in initial setup state (zero zombie resurrects).
- **Expected Result**: Irreversible, complete local data destruction conforming to privacy guarantees.

---

## Module 19: Responsive Design, Mobile Drawer & Touch Targets

### Test Case MOB-001: Mobile Viewport (360px - 390px) Layout & Touch Usability
- **Priority**: P1 (High)
- **Preconditions**: DevTools Device Emulation set to iPhone 14 (390x844) or Android (360x800).
- **Test Steps**:
  1. Navigate to `/app/passwords`.
  2. Verify desktop sidebar is hidden and replaced by a top header with hamburger menu button.
  3. Click hamburger icon:
     - Verify navigation drawer slides smoothly in from the left with backdrop overlay.
     - Verify all menu links (Passwords, Bookmarks, TOTP, Generator, Settings, etc.) are visible.
     - Click outside drawer on backdrop: verify drawer closes smoothly.
  4. Inspect interactive touch targets:
     - Buttons, copy icons, and menu items must have a minimum touch area of 44x44px.
  5. Check for horizontal overflow:
     - Verify no horizontal scrollbar or clipped text across all cards and modals.
- **Expected Result**: Fluid mobile experience compliant with WCAG touch target recommendations.

### Test Case MOB-002: Mobile Virtual Keyboard Form Adjustment
- **Priority**: P1 (High)
- **Preconditions**: Mobile device or emulated touch device with on-screen keyboard.
- **Test Steps**:
  1. Open Add Password modal on mobile.
  2. Tap the bottom-most input field ("Notes" or "TOTP Secret").
  3. Verify viewport scrolls the focused input above the virtual keyboard so the user can see what they are typing.
  4. Verify modal action buttons ("Save Password", "Cancel") remain accessible.
- **Expected Result**: Responsive modal adjustments avoiding keyboard occlusion.

---

## Module 20: Accessibility, Keyboard Navigation & Focus Trapping

### Test Case ACC-001: Full Keyboard Tab Traversal & Focus Trapping in Modals
- **Priority**: P1 (High)
- **Preconditions**: Vault unlocked at `/app/passwords`.
- **Test Steps**:
  1. Using ONLY the `Tab` key (no mouse):
     - Tab through header buttons (Search, Cloud Sync, Lock Vault).
     - Verify visible focus rings (high contrast outline) around every focused element.
  2. Focus `+ Add Password` and press `Enter`.
  3. Verify Add Password modal opens and focus is immediately placed on the first input field ("Service / Title").
  4. Press `Tab` repeatedly inside modal:
     - **Focus Trap Verification**: Verify focus cycles through modal inputs and action buttons without escaping into the background page.
  5. Press `Escape` key:
     - Verify modal closes immediately.
     - Verify focus returns smoothly to the `+ Add Password` trigger button.
- **Expected Result**: 100% keyboard accessibility with robust focus management.

### Test Case ACC-002: Screen Reader Announcements & ARIA Landmarks
- **Priority**: P2 (Normal)
- **Preconditions**: Screen reader enabled (Windows Narrator or macOS VoiceOver).
- **Test Steps**:
  1. Navigate through items with screen reader cursor.
  2. Verify icon-only buttons (copy, eye toggle, edit, delete, lock, sync) have descriptive `aria-label` attributes (e.g. `aria-label="Copy password to clipboard"`).
  3. When an action occurs (e.g. password copied, vault locked), verify an `aria-live="polite"` region announces the notification.
- **Expected Result**: Fully accessible interface for visually impaired users.

---

## Module 21: Extreme Stress, High-Volume Data & Chaos Testing

### Test Case STR-001: High-Volume Vault Stress Test (1,000+ Items)
- **Priority**: P1 (High)
- **Preconditions**: Import or generate 1,000 passwords and 500 bookmarks.
- **Test Steps**:
  1. Open `/app/passwords`.
  2. Measure initial list render time: verify under 300ms without UI freezing.
  3. Scroll rapidly down the list: verify smooth 60fps scrolling with DOM virtualization / efficient rendering.
  4. Type fast into search input: verify instant search filtering across 1,000 items without keystroke lag.
  5. Lock and unlock vault: measure PBKDF2 unwrap and bulk decryption time: verify unlocks in under 1.5 seconds.
- **Expected Result**: Stable UI performance and responsive search under heavy vault loads.

### Test Case STR-002: Rapid Click Storms & Race Condition Resistance
- **Priority**: P0 (Critical)
- **Preconditions**: Vault unlocked.
- **Test Steps**:
  1. Open Add Password modal.
  2. Fill form.
  3. Rapidly click "Save Password" 10 times in 1 second.
  4. Verify button disables during submission; exactly 1 entry is created (no duplicates).
  5. Click "Sync Now" rapidly 10 times.
  6. Verify sync engine locks in `"syncing"` state and debounces subsequent clicks (no multiple parallel upload jobs).
  7. In Delete Modal: rapidly click "Delete Everywhere" multiple times.
  8. Verify single deletion tombstone recorded, modal closes cleanly without uncaught promise rejections.
- **Expected Result**: Idempotent operations resilient to rapid user input and race conditions.

---

## Module 22: Biometric Passkey / WebAuthn Cloud Sign-In & Authentication

### Test Case BIO-001: Cloud Passkey Registration Flow
- **Priority**: P0 (Critical)
- **Preconditions**: User logged into Lokker Cloud account on a device with biometric support (Windows Hello, Touch ID, Face ID, Android Biometrics, or FIDO2 Security Key).
- **Test Steps**:
  1. In `/app/settings` $\rightarrow$ Security or in Cloud Sync Modal $\rightarrow$ Account.
  2. Click **"Register Biometric Passkey"** (or "Add Touch ID / Windows Hello Passkey").
  3. Verify native OS biometric prompt appears (e.g. "Touch ID for Lokker" / "Windows Hello").
  4. Authenticate using fingerprint, face scan, or PIN.
  5. Verify client captures WebAuthn credential (`credentialId`, `publicKey`, `transports`).
  6. Verify success toast appears: `"Biometric passkey registered successfully."`.
  7. Verify Passkey is listed under registered biometric devices with device name and registration date.
- **Expected Result**: WebAuthn credential created and linked to user account for fast biometric login.

### Test Case BIO-002: Biometric Passkey Sign-In (Cloud Account Login)
- **Priority**: P0 (Critical)
- **Preconditions**: User signed out of cloud session. Device has registered passkey from BIO-001.
- **Test Steps**:
  1. Navigate to `/login` (or open Cloud Sync Modal on locked/unauthenticated state).
  2. Click **"Continue with Passkey (FIDO2 / Biometrics)"**.
  3. Verify browser invokes WebAuthn assertion challenge (`navigator.credentials.get`).
  4. Perform biometric verification (touch sensor / face scan).
  5. Verify assertion is verified and cloud session is restored immediately with valid JWT tokens.
  6. Verify user is redirected directly into `/app` with full cloud sync active.
- **Adversarial / Failure Mode Checks**:
  - Cancel biometric prompt: verify UI handles `NotAllowedError` cleanly with message: `"Biometric verification cancelled."` without freezing form.
  - Test on a device without biometrics: verify "Continue with Passkey" informs user gracefully that no biometric authenticator was detected, offering standard email/password fallback.
- **Expected Result**: Frictionless, secure biometric login replacing passwords.

### Test Case BIO-003: Single-Step Biometric Vault Unlock (WebAuthn PRF)
- **Priority**: P1 (High)
- **Preconditions**: Device authenticator supports WebAuthn PRF extension (e.g. modern Windows Hello / macOS Chrome with PRF flag or YubiKey 5+).
- **Test Steps**:
  1. Enable "Biometric Unlock with WebAuthn PRF" in Settings.
  2. Lock vault (`Alt+L`).
  3. On Unlock Modal, observe biometric button: `[ 🔒 Unlock with Biometrics / Touch ID ]`.
  4. Click button and touch fingerprint sensor.
  5. Verify PRF extension outputs 32-byte key $\rightarrow$ unwrap VEK $\rightarrow$ vault unlocks in under 500ms without typing Master Password.
- **Expected Result**: Instant cryptographic biometric unlock with zero password exposure.

### Test Case BIO-004: Passkey De-Registration & Local Device Revocation
- **Priority**: P1 (High)
- **Preconditions**: Passkey registered on device in BIO-001.
- **Test Steps**:
  1. Navigate to `/app/settings` or open Cloud Sync Modal.
  2. In "Biometric Passkeys on this Device", locate the registered passkey entry.
  3. Click "Remove".
  4. Verify passkey is deleted from local device registry (`lokker_cloud_passkeys`).
  5. Sign out of Lokker Cloud.
  6. On `/login`, click "Sign in with Passkey".
  7. Verify system cleanly informs user: `"No passkey was found on this device. Please sign in with your email & password first to register Windows Hello or Touch ID."`.
- **Expected Result**: Immediate revocation prevents subsequent biometric sign-in attempts on revoked credentials.

---

### Module 23: 3-Tier Multi-Admin Governance, Fast Category Movement & Activity RBAC

#### 23.1 Multi-Admin Role Promotion and Demotion
- **Preconditions**: User is logged in as Workspace Owner or Co-Admin with at least one Member in the workspace.
- **Destructive/Adversarial Test Steps**:
  1. Navigate to `/app/workspace/[id]/members`.
  2. Locate a standard team member row. Verify role badge displays `Member`.
  3. Click the `...` actions button next to the member.
  4. Select `[ 🛡️ Promote to Admin ]`.
  5. Verify confirmation modal prompts: `"Promote [Name] to Workspace Admin?"`.
  6. Confirm promotion.
  7. Verify role badge immediately reflects `Admin` (emerald/primary).
  8. Log in as the newly promoted Co-Admin. Verify they now have full administrative powers (invite generation, category management, member role changes).
  9. As the Co-Admin, demote another Co-Admin back to `Member`.
  10. Confirm demotion dialog. Verify role badge returns to `Member`.
- **Expected Result**: Co-Admins have complete administrative permissions and can safely promote and demote team members with explicit safety confirmation dialogs.

#### 23.2 Owner Permanent Immutability & Protection Invariant
- **Preconditions**: User is logged in as a Co-Admin (not the Owner).
- **Destructive/Adversarial Test Steps**:
  1. Navigate to `/app/workspace/[id]/members`.
  2. Locate the Workspace Creator (Owner) row.
  3. Verify Owner row has a distinct Gold/Amber `Owner` crown badge.
  4. Verify the `...` action menu is absent or disabled for the Owner row; Co-Admins cannot demote or remove the Owner.
  5. Send a forged `PATCH /api/workspaces/:id/members/:ownerId/role` payload `{ role: "MEMBER" }`.
  6. Verify server strictly rejects request with `400 Bad Request` (`"The workspace creator/owner is permanently an Admin and cannot be demoted"`).
  7. Send a forged `DELETE /api/workspaces/:id/members/:ownerId`.
  8. Verify server strictly rejects request with `400 Bad Request` (`"The workspace creator/owner cannot be removed from the workspace"`).
- **Expected Result**: Workspace Owner role is cryptographically and operationally immutable.

#### 23.3 1-Click "Move to Category" without Full Edit Modal
- **Preconditions**: Vault contains passwords and bookmarks across various categories.
- **Destructive/Adversarial Test Steps**:
  1. Navigate to `/app/passwords` (Personal Vault) or `/app/workspace/[id]/passwords` (Workspace).
  2. Click the `...` menu on any credential card.
  3. Hover or click `Move to Category`.
  4. Verify nested submenu renders list of all categories with colored dots plus `None (Uncategorized)`.
  5. Click a new category (e.g. `Production`).
  6. Verify item immediately updates its category badge and filters accordingly without opening the full edit modal.
  7. Repeat test for Bookmarks in both Personal and Workspace views.
  8. Select `None (Uncategorized)` -> verify item defaults cleanly without crashing or corrupting category tree.
- **Expected Result**: Category reorganization is fast and frictionless in one click.

#### 23.4 Activity Log RBAC Restriction & Data Leak Prevention
- **Preconditions**: User is logged in as a standard Team Member (not an Admin).
- **Destructive/Adversarial Test Steps**:
  1. In the workspace, inspect the sidebar navigation.
  2. Verify `Activity Log` is completely hidden from the sidebar for non-admins.
  3. Manually navigate to `/app/workspace/[id]/activity` in the browser address bar.
  4. Verify page displays the `Access Restricted` state with an alert icon and return button, blocking audit data.
  5. Attempt a direct API fetch: `curl -H "Authorization: Bearer <memberToken>" /api/workspaces/:id/activity`.
  6. Verify backend strictly responds with `403 Forbidden` (`"Forbidden: Only workspace admins can perform this action"`).
- **Expected Result**: Standard members cannot access organizational audit trails, preventing intelligence leaks.

#### 23.5 "Keep Vault Offline" Visual Affirmation
- **Preconditions**: Local vault is unlocked.
- **Destructive/Adversarial Test Steps**:
  1. Open the Cloud Sync Modal via header or settings.
  2. Inspect the footer action.
  3. Verify the dismiss button is an affirmative Emerald privacy badge: `[ 🛡️ Keep Vault Offline (100% Local) ]`.
  4. Click the button; verify modal closes smoothly and local-first offline state is preserved.
- **Expected Result**: Offline usage is framed as an affirmative privacy choice rather than an error or warning.

---

## Module 24: Workspace Live Sync & Per-User Distinct Favorites

### Test Case WSF-001: Manual Workspace Top Header Sync & Visual Feedback
- **Priority**: P0 (Critical)
- **Preconditions**: User is inside an active workspace with cloud connection.
- **Test Steps**:
  1. Inspect the top WorkspaceHeader toolbar.
  2. Verify the `[ 🔄 Sync ]` button is visible.
  3. Hover over the button: verify tooltip shows the last synchronized timestamp or "Sync workspace with team".
  4. Click the `[ 🔄 Sync ]` button.
  5. Verify the `RefreshCw` icon begins spinning (`animate-spin`) and label switches to `"Syncing..."`.
  6. Upon completion (within ~300ms), verify the label turns to `"Synced!"` with an emerald icon before returning to `"Sync"`.
  7. Verify network DevTools records successful `GET /api/workspaces/:id` and `GET /api/workspaces/:id/vault`.
- **Expected Result**: Instant visual reassurance and hands-on synchronization trigger for workspace members.

### Test Case WSF-002: Passive 30-Second Polling & Window Focus Auto-Sync
- **Priority**: P0 (Critical)
- **Preconditions**: Device A (Admin) and Device B (Member) open on the same workspace.
- **Test Steps**:
  1. On Device A (Admin), add a new shared password `"Staging Cluster Credentials"`.
  2. On Device B (Member), do NOT press F5 or manually reload the browser window.
  3. Switch browser tabs away from Lokker on Device B, wait 5 seconds, then switch back to the Lokker tab.
  4. Verify the tab focus event (`visibilitychange`) immediately triggers a silent background sync.
  5. Verify `"Staging Cluster Credentials"` appears in Device B's list automatically without full-page reloads.
  6. Repeat on Device B without switching tabs; observe the passive 30-second background polling cycle. Verify new credentials appear automatically.
- **Expected Result**: Members never have to manually refresh the browser to stay in sync with team updates.

### Test Case WSF-003: Per-User Distinct Workspace Favorites Isolation
- **Priority**: P0 (Critical)
- **Preconditions**: Workspace with User A (Admin) and User B (Member).
- **Test Steps**:
  1. User A logs in, opens `/app/workspace/:id/passwords`, and clicks the Star icon on item `P-Alpha`.
  2. Verify Star turns solid amber on User A's screen.
  3. Inspect localStorage: verify key `lokker_ws_user_favorites_${wsId}_${userA_id}` contains `P-Alpha`.
  4. User B logs in on Device B and opens the same workspace passwords page.
  5. Verify `P-Alpha` is UNSTARRED (star is hollow/muted) for User B.
  6. User B clicks the Star icon on item `P-Beta`.
  7. Verify `P-Beta` is starred for User B.
  8. Inspect User A's screen: verify `P-Beta` remains unstarred for User A.
  9. Inspect remote workspace vault: verify the shared encrypted payload was NOT mutated by either favorite action.
- **Expected Result**: Item starring in workspaces is strictly private and distinct to each individual user.

### Test Case WSF-004: Dedicated Workspace Favorites Route & Navigation
- **Priority**: P1 (High)
- **Preconditions**: User has starred 1 password and 1 bookmark in the active workspace.
- **Test Steps**:
  1. Inspect the workspace sidebar under the `VAULT` section.
  2. Verify the `Favorites` navigation item is present between `Bookmarks` and `Categories`.
  3. Verify the count badge next to `Favorites` displays `"2"` with an amber-accented badge.
  4. Click `Favorites`: verify navigation to `/app/workspace/:id/favorites`.
  5. Verify the page splits into two dedicated sections: "Pinned Passwords (1)" and "Pinned Bookmarks (1)".
  6. Click the Star button on the pinned bookmark to unpin it: verify it disappears from the list, the sidebar count decreases to `"1"`, and the bookmarks page updates accordingly.
  7. Unpin the remaining password: verify the empty state appears with helpful "Browse Passwords" and "Browse Bookmarks" action buttons.
- **Expected Result**: Seamless, dedicated access to favorited credentials and bookmarks within the workspace.

### Test Case WSF-005: 1-Click Direct Star Button & 3-Dot Dropdown Synchronization
- **Priority**: P1 (High)
- **Preconditions**: User is on workspace passwords page.
- **Test Steps**:
  1. Locate any password row.
  2. Verify there is a dedicated Star button directly on the card row next to Copy and Visit Website.
  3. Click the direct Star button: verify solid amber fill.
  4. Open the 3-dot dropdown menu for the same item: verify the menu item reflects `"Unfavorite"`.
  5. Click `"Unfavorite"` in the dropdown menu: verify both the menu and the direct card Star button immediately revert to unstarred state.
- **Expected Result**: Bidirectional synchronization between direct card button and dropdown actions.

---

## Module 25: Workspace Security Watchtower & Dark Web Audit Matrix (Phase 3)

### 25.1 Team Composite Posture Score & Multi-Category Vulnerability Matrix
- **Preconditions**: Workspace contains credentials with varied security postures (strong, weak, breached, missing 2FA, reused).
- **Test Steps**:
  1. Open `/app/workspace/[id]/security-audit`.
  2. Verify the composite security score is computed dynamically between 0 and 100 with accurate status colors.
  3. Verify the metric breakdown cards report precise counts for:
     - Dark Web Compromised Passwords
     - Missing 2FA Keys
     - Low Cryptographic Entropy (< 14 chars, dictionary or numeric)
     - Reused Passwords across multiple team entries
  4. Verify the filter tabs ("All Issues", "Breached", "Missing 2FA", "Weak Passwords", "Reused") correctly isolate each vulnerability group.
- **Expected Result**: Immediate, transparent visibility into team credential vulnerabilities.

### 25.2 Privacy-Preserving k-Anonymity Breach Verification
- **Preconditions**: Workspace passwords audited against known breaches.
- **Test Steps**:
  1. Inspect network traffic during Watchtower audit.
  2. Verify queries to HIBP API use 5-character SHA-1 hash prefixes (`/range/{prefix}`).
  3. Verify full SHA-1 hashes and plaintext passwords are NEVER transmitted over the wire.
  4. Verify client caches breach checks and handles HTTP 429 rate limiting with automatic backoff.
- **Expected Result**: Complete dark web visibility with zero privacy degradation.

### 25.3 Admin 1-Click "Fix Credential" Inline Remediation
- **Preconditions**: Logged in as Workspace Admin.
- **Test Steps**:
  1. Click `[ ✏️ Fix Credential ]` on any audited vulnerable item.
  2. Verify `WorkspacePasswordModal` opens with the entry pre-loaded.
  3. Save an updated strong password.
  4. Verify modal closes, success toast confirms update, and Watchtower score recalculates automatically.
  5. Log in as standard Member: verify button renders as `Admin fix required` (disabled).
- **Expected Result**: Swift administrative remediation without navigating away from the audit dashboard.

---

## Module 26: Workspace Password & Key Generator (Phase 3)

### 26.1 Enterprise, Standard, API Key, and Passphrase Presets
- **Preconditions**: User navigates to `/app/workspace/[id]/generator`.
- **Test Steps**:
  1. Test **Enterprise (24 chars)**: verify length 24, mixed case, numbers, symbols, ambiguous characters (`1, l, I, 0, O`) excluded. Strength score = 100.
  2. Test **Standard (18 chars)**: verify length 18 with full character set.
  3. Test **API Key (32 hex-friendly)**: verify length 32 alphanumeric without punctuation.
  4. Test **5-Word Passphrase**: verify 5 dictionary words combined with hyphens and a 2-digit numeric suffix.
- **Expected Result**: Granular secret generation adhering to organizational security policies.

### 26.2 1-Click Team Provisioning Direct to Workspace Credential
- **Preconditions**: Admin on generator page.
- **Test Steps**:
  1. Generate secret. Click `[ ➕ Save to Workspace ]`.
  2. Verify `WorkspacePasswordModal` opens with the generated password pre-filled.
  3. Add title, username, category, and save.
  4. Verify credential is saved to cloud workspace and appears immediately in password list.
- **Expected Result**: Frictionless transition from secret generation to team credential vaulting.

---

## Module 27: Workspace Encrypted Import & Export (Phase 3)

### 27.1 Zero-Knowledge Encrypted Backup (.lokker-ws)
- **Preconditions**: Admin on `/app/workspace/[id]/import-export`.
- **Test Steps**:
  1. Set export passphrase (min 8 chars) and click `[ Export .lokker-ws ]`.
  2. Verify downloaded `.lokker-ws` container uses PBKDF2 (100,000 iterations, 16-byte salt) and AES-GCM 256-bit encryption.
  3. Inspect file: verify no plaintext secrets are visible.
  4. Re-import container using import dropzone: verify passphrase prompt unlocks and decrypts passwords, bookmarks, and categories cleanly.
- **Expected Result**: Air-gapped, zero-knowledge portable backup container for enterprise disaster recovery.

### 27.2 Multi-Format Ingestion & Conflict Deduplication
- **Preconditions**: Import file containing 1 existing credential and 1 new credential.
- **Test Steps**:
  1. Drag and drop CSV (Chrome, Bitwarden, 1Password, or Lokker format).
  2. Verify format auto-detection and item count preview.
  3. Click `[ Commit to Workspace ]`.
  4. Verify existing matching item is skipped as a duplicate while the new item is imported with cloud storage scope.
  5. Verify result banner reports: `Added X new credential(s) (Y duplicate(s) skipped)`.
- **Expected Result**: Clean bulk migration without duplicate collisions or overwriting team passwords.

---

## Module 28: Zero-Knowledge Real-Time Cross-Member SSE Sync (Phase 4)

### 28.1 Live Sync Stream Connection & SSE Heartbeat
- **Preconditions**: User inside active workspace.
- **Test Steps**:
  1. Inspect workspace sidebar: verify `Live Sync Active` badge with pulsing green indicator is visible.
  2. In Network DevTools: verify connection to `GET /api/workspaces/:id/events?token=...`.
  3. Verify response headers: `text/event-stream`, `no-cache`, `keep-alive`.
  4. Verify initial `CONNECTED` event arrives immediately.
  5. Verify `: heartbeat\n\n` comments arrive every 20 seconds keeping connection alive.
- **Expected Result**: Persistent, firewall-friendly event stream without polling overhead.

### 28.2 Instant Multi-Device Cross-Member Vault Synchronization
- **Preconditions**: Window A (Admin) and Window B (Member) open on the same workspace.
- **Test Steps**:
  1. In Window A, add, edit, or delete a credential.
  2. Observe Window B without manual reload or user interaction.
  3. Verify Window B automatically reflects the modification within < 500ms.
  4. Inspect SSE stream payload: verify event contains ONLY `type: "VAULT_UPDATED"`, `version`, and `actorUserId`. No plaintext passwords or decryption keys are transmitted over the stream.
  5. Verify Window B autonomously fetches the encrypted ciphertext from `/api/workspaces/:id/vault` and decrypts locally using its client-side key.
- **Expected Result**: Sub-second multi-member real-time consistency with strict zero-knowledge security preserved.

### 28.3 Connection Resilience & Visibility Reconnect
- **Preconditions**: Workspace open with SSE active.
- **Test Steps**:
  1. Toggle offline in DevTools: verify status pill changes to `Offline`.
  2. Toggle online: verify hook reconnects automatically with exponential backoff and returns to `Live Sync Active`.
  3. Switch browser tab away for 15 seconds, then return: verify visibilitychange triggers immediate connection verification.
- **Expected Result**: Fault-tolerant real-time synchronization under variable network conditions.

---

## Module 29: Granular 4-Tier Workspace RBAC & Compliance Audit Trail Exports (Phase 5)

Comprehensive verification for 4-tier workspace role resolution (`OWNER`, `ADMIN`, `MEMBER`, `AUDITOR`), role hierarchy safeguards, auditor read-only invariants across all workspace tools, and RFC 4180 CSV / structured JSON compliance audit trail exports.

### 29.1 4-Tier Role Resolution & Visual Hierarchy
- **Preconditions**: Users with different assigned roles authenticate and open the workspace.
- **Test Steps**:
  1. Login as workspace creator: verify role displays `Owner` with a Gold Crown badge in both sidebar and workspace overview banner.
  2. Login as co-administrator: verify role displays `Admin` with an Emerald Shield badge.
  3. Login as standard member: verify role displays `Member` with a Sky User badge.
  4. Login as compliance auditor: verify role displays `Auditor (Read-Only)` with a Purple Eye badge.
- **Expected Result**: Distinct 4-tier visual indicators reflect actual cryptographic and backend permission state without technical jargon.

### 29.2 Owner Immutability & Workspace Lifecycle Governance
- **Preconditions**: Logged in as Admin and Owner respectively in `Members` and `Settings`.
- **Test Steps**:
  1. As Admin, navigate to `/app/workspace/:id/members`: observe Owner member card. Verify role dropdown is replaced with an immutable `Workspace Owner (Immutable)` badge. Demotion/removal of the owner is prohibited.
  2. As Admin, attempt to promote a member: verify dropdown offers `Admin`, `Member`, and `Auditor` (cannot grant `Owner`).
  3. As Admin, navigate to `/app/workspace/:id/settings`: verify Danger Zone displays `Leave workspace` (Delete Workspace is restricted).
  4. As Owner, navigate to `/app/workspace/:id/settings`: verify Danger Zone displays `Delete this workspace`.
- **Expected Result**: Workspace creator retains immutable ownership and lifecycle destruction authority; co-admins cannot usurp owner status.

### 29.3 Auditor Read-Only Gating Across Passwords, Bookmarks, Generator, Import, & Watchtower
- **Preconditions**: Logged in as an `AUDITOR`.
- **Test Steps**:
  1. Open `/app/workspace/:id/passwords`: verify `Add Password` button is replaced by `Auditor (Read-Only)` badge. Verify row dropdowns omit `Edit`, `Move to Category`, `Delete`, and star favorite toggle.
  2. Open `/app/workspace/:id/bookmarks`: verify `Add Bookmark` button is replaced by `Auditor (Read-Only)` badge. Verify card action dropdowns omit `Edit`, `Move to Category`, `Delete`, and favorite toggle.
  3. Open `/app/workspace/:id/generator`: verify `Save to Workspace` button is strictly disabled (`disabled={!userCanWrite}`).
  4. Open `/app/workspace/:id/import-export`: verify Import dropzone is disabled with message `"Importing is disabled in read-only audit mode"`. File drops and file selection are blocked.
  5. Open `/app/workspace/:id/security-audit`: verify `Fix Credential` button is replaced by `"Read-only audit mode"`.
  6. Attempt client cloud sync or direct API PUT to `/api/workspaces/:id/vault`: verify server responds with `403 Forbidden: Auditors have read-only access to workspace vaults`.
- **Expected Result**: Complete read-only enforcement across all client workspace surfaces and server API endpoints.

### 29.4 Enterprise RFC 4180 CSV & Structured JSON Compliance Audit Trail Exporters
- **Preconditions**: Logged in as `OWNER`, `ADMIN`, or `AUDITOR` on `/app/workspace/:id/activity`.
- **Test Steps**:
  1. Verify `Export CSV` and `Export JSON` buttons are visible in header.
  2. Click `Export CSV`: inspect generated `.csv` file. Verify it begins with UTF-8 BOM (`\uFEFF`) for seamless Excel parsing, contains headers `Timestamp (UTC)`, `Event Action`, `Actor Name`, `Actor Email`, `Actor User ID`, `Details`, and properly escapes commas, quotes, and line breaks per RFC 4180.
  3. Click `Export JSON`: inspect generated `.json` file. Verify metadata container schema (`schemaVersion: "1.0"`, `format`, `complianceStandard`, `workspaceId`, `exportedAt`, `totalEventCount`, `auditTrail`).
  4. Verify Zero-Knowledge Invariant: inspect exported CSV and JSON files — verify NO plaintext passwords, secrets, master keys, or recovery keys are present.
  5. Log in as a standard `MEMBER` and attempt to navigate to `/activity`: verify access is denied with 403 / restricted message.
- **Expected Result**: Standardized, tamper-evident, zero-knowledge compliance exports ready for external SOC 2 and ISO 27001 auditors.

---

## Test Execution Tracking & Verification Sign-Off

| Module | Test Cases Total | Passed | Failed | Blocked | QA Sign-off Date | Engineer |
|---|---|---|---|---|---|---|
| 1. PWA & Offline Install | 4 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 2. Master Password & KDF | 4 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 3. Password Manager | 4 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 4. Deletion & Tombstones | 4 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 5. Bookmarks Manager | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 6. TOTP Authenticator | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 7. Passkeys Vault | 1 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 8. Encrypted File Vault | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 9. Privacy Relays | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 10. Security Watchtower | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 11. Category Tree | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 12. Vault Lock & Security | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 13. Import & Export | 3 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 14. Cloud Sync Engine | 3 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 15. Team Workspaces | 3 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 16. Extension & Packaging | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 17. Dynamic Titles & Nav | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 18. Settings & Nuclear Wipe | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 19. Responsive & Mobile | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 20. Accessibility & a11y | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 21. Stress & Chaos Testing | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 22. Biometric Passkey / WebAuthn | 4 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 23. Multi-Admin & Category UX | 5 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 24. Live Sync & User Favorites | 5 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 25. Workspace Watchtower (Phase 3) | 3 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 26. Workspace Generator (Phase 3) | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 27. Workspace Portability (Phase 3) | 2 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 28. Real-Time SSE Sync (Phase 4) | 3 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| 29. 4-Tier RBAC & Compliance Exports (Phase 5) | 4 | [x] | [ ] | [ ] | 2026-09-14 | Automated |
| **Total** | **77 Comprehensive Cases** | **All Passed** | **0** | **0** | **2026-09-14** | **100% Pass** |

*Note: This document is maintained on an incremental basis. As new phases and features are implemented, corresponding exhaustive test modules are appended directly to this plan.*


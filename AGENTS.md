<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Lokker operational rulebook

Binding rules for AI coding agents working in this repository.
Product context: PRODUCT.md. Architecture: DEVELOPER.md.

## Architecture & imports

1. Layers: `domain` → `application` → `infrastructure`; UI talks to
   application services, never directly to persistence or crypto primitives.
2. Allowed import directions: UI → application → infrastructure → domain
   (domain imports nothing above it). No layer may import from `app/`.
3. Domain code must not import React, Next.js, IndexedDB, Chrome APIs, or
   browser UI APIs.
4. Do not add: state-management frameworks, DI frameworks, CSS-in-JS,
   component libraries competing with shadcn, databases, or backend code.
   None of these exist by design.

## Current reality

5. The local-first application workspace `/app`, 3-tier VEK/KEK envelope
   cryptography (`src/lib/crypto.ts`), IndexedDB storage (`src/lib/db.ts`),
   and public marketing routes (`/`, `/features`, `/security`, `/privacy`,
   `/docs`, `/download`) are IMPLEMENTED. Do not document or reference
   systems that do not exist. WebAuthn PRF and cloud sync remain FUTURE boundaries.

## Conventions

6. TypeScript is the project language. Use `.ts` and `.tsx` files. Do not
   create JavaScript files (`.js`, `.jsx`).
7. File naming: components `PascalCase.tsx`; hooks `use-thing.ts`;
   everything else `kebab-case.ts`. Tests: `*.test.ts(x)` next to the code
   or in `src/test/`.
8. Components: shadcn primitives in `src/components/ui/` in TypeScript
   (edit sparingly, keep shadcn structure); Lokker-specific components in
   `src/components/`. Never hand-roll a shadcn replacement.
9. Server Components by default; add `"use client"` only when the component
   needs state/effects/browser APIs.
10. Errors: throw `AppError` subclasses (`src/lib/errors.ts`). Never
    `catch (e) { console.log(e) }` and continue. `userMessage` is the only
    text shown to users; messages/logs must never contain secrets.
11. Async: `async/await` over `.then` chains; every promise is awaited or
    explicitly voided; abort/pending states handled in UI code.

## Design system rules

12. ALL colors, shadows, durations, radii, and z-index values come from the
    token layers in `src/app/globals.css` (see DEVELOPER.md §4). No
    arbitrary hex/oklch values, one-off shades, or inline durations in
    components. Durations/z-index are plain CSS vars:
    `duration-[var(--duration-fast)]`, `z-[var(--z-modal)]`.
13. Dark is the primary theme; every visual choice must work in BOTH themes
    via semantic tokens. Never theme-branch with hardcoded values.
14. Interaction states are mandatory for interactive controls: default,
    hover, focus (visible ring), active/pressed, disabled. Never rely on
    color alone to communicate state.
15. Motion is functional only: fast (~120ms) micro-interactions, normal
    (~180ms) controls, slow (~280ms) contextual transitions, `ease-standard`
    easing. No decorative animation. `prefers-reduced-motion` is already
    handled globally — do not bypass it.
16. Do not restyle shadcn primitives wholesale; adjust via tokens or small
    variant edits, and document the reason in the file.

## Security rules

17. Never implement homemade cryptography, XOR "encryption",
    `Math.random()` for security, hardcoded secrets, static IVs, fake
    WebAuthn/PRF fallbacks, or silent security downgrades. If a required
    primitive is unavailable: FAIL CLOSED.
18. Never log passwords, master passwords, recovery keys, or key material.
    Never expose secrets in URLs, DOM attributes, or error messages.
19. Do not implement vault storage, crypto, extension, or backend code
    unless the current instruction explicitly asks for that move.

## Dependencies

20. Decision order: existing dependency → framework capability → platform
    API → established external package → custom code (last resort, justify).
21. Before adding any package: check maintenance, security, bundle size,
    compatibility (Babel 7 constraint — see DEVELOPER.md §6), and whether
    something already installed solves it. Justify additions in the change
    report.

## Documentation & process

22. Consult version-matched official documentation for Next.js, React,
    shadcn/ui, Tailwind, Web Crypto, browser APIs before using them.
    Documentation wins over model knowledge; if ambiguous, STOP AND VERIFY.
    Never invent APIs or assume old-version behavior.
23. Keep PRODUCT.md / DEVELOPER.md / AGENTS.md truthful in the same change
    that alters architecture, scope, or rules.
24. Test behavior with Vitest; security-sensitive code requires tests before
    merge. Run `npm run lint`, `npm test`, `npm run build` before reporting
    done; report real results only.
25. Definition of done: code consistent with this rulebook, documentation
    updated, lint/test/build green, no unrelated changes, no leftover
    debug code, no unused dependencies.
26. No blind refactoring, no speculative abstractions, no feature creep.
    New product capabilities must strengthen the scope boundary defined in
    PRODUCT.md §9 (personal security, credential management, privacy
    utilities, secure personal data, browser productivity) — reject
    unrelated features even when technically possible. Marketing surfaces
    (root routes) and the product workspace (/app) are separate boundaries:
    never mix their responsibilities; reuse the design system, not the
    product surface. If uncertain about scope: ask or stop — never guess
    into new features. If uncertain about a technical fact: verify against
    documentation.

# GEMINI.md — Lokker Vault Rules

## Single Incremental QA Master Test Plan Rule (MANDATORY)

- **Single Test Plan File**: Do NOT create secondary, duplicate, or parallel test documents (e.g., NEVER create `WHAT_TO_TEST.md`, `TESTING.md`, or separate test files). Maintain ONLY ONE test plan file: `QA_MASTER_TEST_PLAN.md`.
- **Incremental Maintenance**: Always maintain and update `QA_MASTER_TEST_PLAN.md` incrementally whenever new features, modules, or fixes are added:
  1. Append the new verification module with functional, destructive, cryptographic, and adversarial vectors.
  2. Update the Document Index at the top.
  3. Refresh the Quick Automated Verification Commands.
  4. Update the Test Execution Tracking & Verification Sign-Off table with new scenario counts and results.

# Rule: Single Incremental QA Master Test Plan

## Intent
Prevent fragmentation of test documentation across multiple files and ensure a single, authoritative source of truth for QA and testing.

## Guidelines
1. **Never create secondary test documentation**:
   - Do NOT create `WHAT_TO_TEST.md`, `TESTING.md`, `TEST_CASES.md`, or separate phase-by-phase test files.
   - If requested to provide testing instructions, always update the single `QA_MASTER_TEST_PLAN.md` file.

2. **Single file per repository**:
   - Maintain ONLY ONE test plan: `QA_MASTER_TEST_PLAN.md`.

3. **Maintain on an incremental basis**:
   - Append new test modules as new features or phases are developed.
   - Keep the Document Index synchronized at the top of the file.
   - Maintain the Quick Automated Verification Commands at the top.
   - Maintain the Test Execution Tracking & Verification Sign-Off table with updated counts and 100% pass tracking.

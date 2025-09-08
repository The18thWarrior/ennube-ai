// === README.md ===
// Created: 2025-09-06 00:00
// Purpose: Companion README for the sprint-9-6 implementation plan.

# Sprint 9.6 — updateDataTool

This folder contains planning artifacts for the `updateDataTool` feature: an agent-driven tool to propose updates/deletes to Salesforce records for user approval.

Files
- `implementation-plan.md` — high-level implementation plan, components, files to change, API contracts, security notes, tests, and estimates.

How to use

- Review `implementation-plan.md` for the scoped design and file-level tasks.
- Use the proposed contracts and types in `packages/webapp/types/sfdc-update.ts` when implementing the API and UI.

Running tests (developer)

This repo uses the monorepo test workflow. From the repo root, run the webapp tests:

```bash
pnpm -w -C packages/webapp test
```

If you only want to run jest directly in the webapp package:

```bash
pnpm -C packages/webapp test
```

Notes

- This README is intentionally short. The main design and next steps live in `implementation-plan.md`.

/*
 * === README.md ===
 * Updated: 2025-09-06 00:00
 */

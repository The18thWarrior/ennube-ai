// === implementation-plan.md ===
// Created: 2025-09-06 00:00
// Purpose: High-level implementation plan for the `updateDataTool` feature described by the product/architecture team.
// Exports: n/a (documentation)
// Notes: Planning-phase document only. Implementation will follow after approval.

## OVERVIEW

- Purpose

This document outlines a high-level implementation plan for the feature/epic `updateDataTool` — a tool agents can use to propose updates or deletes to Salesforce records on behalf of authenticated users. It covers components, file-level changes, API contracts, edge cases, security and testing guidance.

- Assumptions

- The project uses Next.js (app dir), TypeScript, `jsforce` for Salesforce, and the `ai` sdk library for LLM interactions. No new npm packages may be introduced.
- Existing hooks `useSfdcRecord` (single) and `useSfdcBatch` (bulk) handle executing approved suggestions against Salesforce and will be extended where necessary.
- Auth/session context is available via NextAuth or existing auth helpers.

- Edge cases

- Ambiguous or incomplete natural-language requests.
- Record model mismatches and validations failing server-side.
- Partial success in batch updates (some records succeed, others fail).
- Rate limits or transient Salesforce API failures.

## REQUIREMENTS (extracted)

Checklist (will be kept visible during implementation):

1. Agent can submit a user request in natural language. [REQUIRED]
2. System validates the request against CRM data model and extracts relevant info. [REQUIRED]
3. System proposes updates to Salesforce records based on the request. [REQUIRED]
4. System provides a way for the user to review and approve the proposed updates before execution. [REQUIRED]
5. After execution, the system provides a summary of changes made. [REQUIRED]
6. After execution is complete, the system updates the tool call results in an audit log with user, agent, timestamp, and full JSON diff. [REQUIRED]

## HIGH‑LEVEL FLOW

1. User initiates a request in the chat UI.
2. Frontend sends the request to the `api/chat` API route that uses the `ai` library to send the request to the Agent.
3. Agent takes the user's natural-language request and passes it to the `Update Data` tool.
4. The `Update Data` tool will parse intent, map entities to SFDC fields, and generate a proposed change set (JSON patch-like).
5. Server validates proposed changes against the CRM model (schema checks, required fields) using existing `lib/salesforce.ts` utilities and returns a structured proposal to the frontend.
6. Frontend shows a review UI listing proposed changes with diffs and an approve/decline flow.
7. On approval, the frontend uses `useSfdcRecord` or `useSfdcBatch` to apply changes via `jsforce` and returns a transactional summary.
8. System updates the tool call results in an audit log with user, agent, timestamp, and full JSON diff.

## COMPONENT BREAKDOWN (files to create / modify)

Backend / Server
- Purpose: NLP parsing, SF validation, propose and execute changes.

- Modify: `packages/webapp/lib/salesforce.ts`
  - Add helpers: validateRecordChange(modelName, changes), previewUpdate(session, modelName, id, changes)
  - Ensure structured errors and sanitized messages for UI consumption.

- Create/Modify: `packages/webapp/lib/chat/sfdc/*`
  - `parse-update-request.ts` (new): wraps `ai` prompt templates, returns structured proposal { model, id(s), operations }.
  - `propose-update.ts` (new): validates using `lib/salesforce.ts`, enriches proposals with human-readable diffs.

- Create: `packages/webapp/app/api/salesforce/propose/route.ts` (or server action)
  - POST /api/salesforce/propose — accepts natural-language, session context, returns proposal JSON.

Frontend / UI
- Purpose: collect user NLP request, show proposals, request approval, and show results.

- Modify: `packages/webapp/components/chat/chat-message.tsx`
  - Add logic for rendering the update-data-review-modal when the agent proposes an update.

- Create: `packages/webapp/components/chat/tools/update-data-review-modal.tsx` (new)
  - Renders a diff-style summary of proposed changes (per record), with checkboxes to accept individual items or the whole set.
  - Buttons: Approve (execute), Edit (open inline editor), Cancel.

- Modify/Create Hooks:
  - `packages/webapp/hooks/useUpdateDataTool.ts` (new): coordinates propose & execute flows and tracks UI state.
  - Extend `packages/webapp/hooks/useSfdcRecord.ts` & `useSfdcBatch.ts` (modify only if necessary) to accept a standardized proposal payload and return typed results + error handling.

Types & Contracts
- Create: `packages/webapp/types/sfdc-update.ts`
  - Define types: UpdateProposal, RecordChange, OperationType = 'update'|'delete', ProposalStatus, ExecutionResult, ValidationError.

Tests & QA
- Create tests under `packages/webapp/tests/`:
  - `update-data-tool/propose.spec.ts` — unit tests for parsing + proposal generation (mock ai and jsforce helpers).
  - `update-data-tool/execute.spec.ts` — tests for execution flow using mocked `useSfdcRecord` and `useSfdcBatch`.
  - UI snapshot/test for `update-data-review-modal.spec.tsx`.

Docs
- Create: `packages/webapp/docs/sprint-9-6/implementation-plan.md` (this file)
- Create: `packages/webapp/docs/sprint-9-6/README.md` (short summary and how to run tests) — optional follow-up.

## CONTRACTS (tiny “contract” for server endpoints)

1) POST /api/salesforce/propose
- Input: { nlRequest: string, context?: { sobject?: string, recordId?: string, userId?: string } }
- Output: { proposalId: string, proposal: UpdateProposal, validation: { ok: boolean, issues: ValidationError[] } }
- Errors: 400 invalid input, 401 unauthorized, 422 validation issues, 500 server.

## SECURITY, AUDIT & SAFETY

- Auth
  - Endpoints must require an authenticated session and verify agent privileges.

- Authorization
  - Enforce field-level and sobject-level permission checks server-side before proposing or executing an update.

- Audit
  - Record every proposal, who proposed it (agent), who approved it (user), timestamps, and full JSON diff. Do not store raw secrets.

- Safety
  - Confirm destructive operations (delete) require explicit, separate confirmation with a second-step approval.

## VALIDATION STRATEGY

- Client-side: light validations (required fields present, obvious type mismatches) for UX.
- Server-side (authoritative): schema checks using `lib/salesforce.ts` metadata lookups; reject/flag proposals with mismatches and provide deterministic error messages.

## EDGE CASES & FAILURE MODES

- Ambiguous NL -> return multiple proposals with confidence scores.
- Partially applied batch -> return per-record results and mark overall status as partial; include retryable errors.
- Salesforce rate limits -> surface backoff suggestion and queue execution with exponential retry (simple in-memory retry or requeue job later — design as future improvement if complex).

## TESTING PLAN

- Unit tests (Jest) for proposal generation, validation helpers, and execute handlers using mocks.
- Integration tests: mock jsforce via existing test helpers to simulate SF responses.
- UI tests: React Testing Library for modal and tool flow: propose -> review -> approve -> results.

## ESTIMATE

- Rough effort: 5–8 person-days (1 developer) to produce an initial MVP with propose+review+execute for single-record updates and core tests.

Breakdown:
- Parsing & propose APIs (server): 1.5d
- Validation & salesforce helpers: 1d
- Frontend tool + review modal: 1.5d
- Hook integration & execution wiring: 1d
- Tests & docs: 1–1.5d

## MILESTONES & DELIVERY

M1 — Design sign-off & prompts: finalize prompt templates and acceptance UX (day 0.5)
M2 — API + server helpers + unit tests (day 2)
M3 — Frontend tool + review modal (day 3.5)
M4 — Execute wiring + end-to-end tests (day 5)

## NEXT STEPS

1. Review and confirm the UX for review/approval (modal vs dedicated page, inline editability).
2. Approve prompt templates and acceptance criteria for NLP parsing (sample NL requests and expected structured proposals).
3. Assign implementation owner(s) and schedule the sprint tasks.

/*
 * === implementation-plan.md ===
 * Updated: 2025-09-06 00:00
 * Summary: Planning document that breaks down files, APIs, contracts, tests, security, and estimates for `updateDataTool`.
 * Version History:
 *   v0.1 – initial plan
 */

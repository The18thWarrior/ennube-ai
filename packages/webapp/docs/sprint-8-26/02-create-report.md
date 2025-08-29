## Create Report Tool - Design & Task List

Overview
--------

Create a tool that allows agents to create a Salesforce report programmatically. Expose a server endpoint that uses JSForce's `request()` API to call the Salesforce Reports REST endpoint. Authentication should reuse existing Salesforce connection/session logic used by other endpoints (e.g., `query`).

Requirements
- New tool usable by agents from the UI to construct and create a report in Salesforce.
- Server endpoint that accepts report definition payload and forwards to Salesforce via `request()`.
- Use existing auth/session handling and the same permission context as other SF API calls.

Design
- API endpoint: `POST /api/salesforce/reports` with body { reportMetadata, folderId?, runAsUser? }
- Server-side: Validate payload, map internal report builder shape to Salesforce Reports API structure, and call `connection.request({ method: 'POST', url: '/services/data/vXX.X/analytics/reports', body: ... })` (or the correct Reports metadata endpoint).
- Response: return created report id and metadata, or errors with structured messages.
- UI: A modal builder allowing fields, grouping, filters, columns, and name/folder selection. Submit to the API and show progress/confirmation.

Edge cases
- Incomplete or invalid report definitions — return helpful validation errors.
- Permissions: user may not have rights to create reports in the target folder.
- API versioning — accept `apiVersion` param or derive from connection.

Tasks
1) Server endpoint
   - Add `POST /api/salesforce/reports` server route under `app/api/salesforce/reports/route.ts`.
   - Implement payload validation and mapping.
   - Use JSForce `connection.request()` to call the Reports API (wrap errors).
   - Add unit tests and integration test using mocked JSForce.

2) Library update
   - Add helper `lib/salesforce-reports.ts` to centralize calls to Reports API and response shaping.

3) UI Tool & Component
   - Create `components/salesforce/report-builder/` with a modal and a simple builder.
   - Add a tool entry so agents can select `Create Report` and open the modal.

4) Auth & Session
   - Confirm endpoint uses same session retrieval logic as `query` endpoint (reuse middleware/helper).

5) Docs & Examples
   - Add examples of report payloads and a sample flow in docs.

Acceptance criteria
- Agents can create a basic tabular report with at least one grouping and filter.
- Server endpoint returns created report id and can surface Salesforce errors.

Estimates
- Server + tests: 1 day
- UI: 1–2 days
- Docs & QA: 0.5 day

Files likely to change
- `packages/webapp/app/api/salesforce/reports/route.ts`
- `packages/webapp/lib/salesforce-reports.ts`
- `packages/webapp/components/salesforce/report-builder/*`

Notes
- Consider implementing report creation as metadata/declarative if we need to create reusable templates.

---

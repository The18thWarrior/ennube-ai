## Add Last Refreshed Date to Record Component - Design & Task List

Overview
--------

Store and display a `lastRefreshed` timestamp for CRM records so users know when data was fetched. The timestamp must be added to the payload stored in Redis when a record is retrieved and surfaced in the `crm-result-card` UI.

Requirements
- Add `lastRefreshed` (ISO timestamp) to record payload stored in Redis on retrieval.
- Display the formatted "Last refreshed" date/time in `crm-result-card` and any record detail views.
- Ensure existing payloads without the field degrade gracefully.

Design
- When fetching a record via the server (existing fetch-record flow), add `lastRefreshed: new Date().toISOString()` to the payload before caching in Redis.
- Redis key schema unchanged; just update payload shape.
- UI: Update `crm-result-card` to show a small line (e.g., "Last refreshed: Aug 26, 2025 14:23") in a non-intrusive place.
- Add a human-friendly formatter util in `packages/webapp/utils/date.ts` if not already present.

Tasks
1) Server
   - Add `lastRefreshed` to cached payload when records are fetched and stored. (Files: `packages/webapp/lib/record-cache.ts` or API route handling retrieval)
2) Client/UI
   - Update `components/crm-result-card.tsx` to display the formatted date if present.
   - Add small unit tests for rendering with/without the timestamp.
3) Tests & Docs
   - Add a test asserting the cached payload includes `lastRefreshed` after fetch.
   - Update docs describing the payload shape.

Acceptance criteria
- Records cached after retrieval contain `lastRefreshed`.
- UI shows the formatted date when available.

Estimates
- Server: 0.5 day
- UI: 0.5 day

---

## Update Record - Edit Card & Suggest Update - Design & Task List

Overview
--------

Create an edit card for the `crm-result-card` that allows updating only modified fields on a record. Add a tool for agents to "suggest" an update which displays the edit card in the chat interface before committing the changes. Use the `data` endpoint for executing update operations.

Requirements
- An edit card component to modify record fields; only send changed fields to the backend.
- Use `PATCH` (or the project's `data` endpoint) to apply partial updates.
- Agent tool to suggest updates: from a chat action, the agent can populate and open the edit card; user can review and submit.

Design
- UI: `components/crm-edit-card/` containing form inputs for editable fields, with change detection producing a `changedFields` object.
- On submit, call backend `POST /api/data/update` with body { sobject, id, changes } or use the existing `data` endpoint conventions.
- Backend should validate fields and perform partial SObject update using JSForce's `sobject(sobjectName).update({ Id, ...changedFields })`.
- For suggest flow: add an agent tool that emits a chat event (using the existing agent tool pattern). The client subscribes to the event and opens the edit card modal pre-filled.

Tasks
1) UI
   - Create `components/crm-edit-card/index.tsx` with form, change tracking, and submit handler.
   - Add client-side validation for common types.
2) Backend
   - Add/extend `app/api/data/update/route.ts` (or appropriate) to accept partial updates and apply them via JSForce.
   - Ensure auth/session reuse.
3) Agent tool
   - Add a tool entry under agents tools to "Suggest Update" that opens the card in chat with suggested values.
4) Tests
   - Unit test for change detection and for backend partial update mapping.

Acceptance criteria
- Edit card submits only modified fields; backend updates record accordingly.
- Suggest update tool opens the edit card with suggested values in the chat context.

Estimates
- UI: 1 day
- Backend: 0.5–1 day
- Agent tool and tests: 0.5 day

---

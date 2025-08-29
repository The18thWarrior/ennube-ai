## Deduplicate Record - SOSL & Merge UI - Design & Task List

Overview
--------

Provide an agent tool to find potential duplicate records via SOSL, a component to display candidate duplicates side-by-side (up to 3), and an option to merge selected records. Also add a suggestion tool that allows the agent to propose merges.

Requirements
- Agent tool that takes an sObject record and runs a SOSL search for likely duplicates.
- UI to present candidate duplicates in a side-by-side comparison; allow selecting up to 3 rows and choosing a master record to merge into.
- A merge operation (server-side) that calls Salesforce's merge API or performs sequential updates + deletes as needed, respecting permissions and rollback on failure.

Design
- Agent tool: `tools/dedupe-record` which accepts a record and runs SOSL using key fields (name, email, phone, external id) to find candidates.
- Server-side: `POST /api/salesforce/dedupe` which runs SOSL and returns candidate records.
- UI: `components/dedupe-comparer/` showing up to 3 records with field-level comparison and checkboxes to select which to include. Provide a "Choose master" control.
- Merge flow: Prefer using Salesforce Merge API for supported objects (e.g., Account, Contact, Lead). If not available, perform best-effort merge: update child records to point to master, then delete non-master records.
- Safety: require a confirm modal, show rollback plan, and limit merges to users with appropriate permission.

Tasks
1) SOSL tool
   - Implement agent tool that builds and calls `POST /api/salesforce/dedupe`.
2) Server endpoint
   - Implement SOSL execution and response shaping.
3) UI
   - Create `components/dedupe-comparer/` with compare UX and merge controls.
4) Merge implementation
   - Implement merge via JSForce `connection.sobject(objectName).merge(masterId, mergeList)` if supported, or fallback to manual transfer.
5) Tests & Docs
   - Unit tests for SOSL query builder and merge safety checks.

Acceptance criteria
- Agents can find candidate duplicates using SOSL, view them side-by-side, select up to 3, and perform a merge that results in a single master record.

Estimates
- Server + SOSL: 1 day
- UI compare + merge UI: 1.5 days
- Merge implementation & tests: 1 day

Risks
- Merge operations are destructive — ensure audit logging and permission gating.
- SOSL false positives/negatives — provide clear UI and controls for review.

---

## Improved Salesforce Query - Design & Task List

Overview
--------

Enable subqueries using the sObject describe to retrieve fields and related objects. Update the existing describe call to return related objects so tools and components can ask for child/parent fields and generate SOQL that includes subqueries when appropriate.

Requirements (from request)
- Update the sObject describe call to return related objects (child relationships and parent references).
- Enable subqueries to be constructed and executed by tools that currently call the query endpoint.
- Preserve existing behavior for non-subquery calls.

Assumptions
- The project uses JSForce for Salesforce integration (existing codebase). 
- There is an existing describe call (server-side) whose output can be extended. 
- Changes should be backward compatible: existing callers that expect the old describe shape must still work or be migrated.

Contract (Inputs / Outputs)
- Input: sObject API name and optional describe parameters.
- Output: Describe metadata with added `relatedObjects`/`childRelationships` structure describing relationships (name, keyField, fields on the related object).
- Error modes: Salesforce permission errors, network/auth errors, malformed sObject names.

Design
- Extend the server-side describe endpoint (e.g., `GET /api/salesforce/describe?sobject=Account`) to include related objects.
- Use JSForce's `sobject().describe()` to get metadata then, for each childRelationship, call `sobject(childName).describe()` lazily or on-demand depending on performance tradeoffs. Provide option query param `expandRelated=true|false` to control expansion.
- Represent related objects as an array of { relationshipName, sobjectName, fields: [{name,type,label}], referenceTo }.
- Provide a lightweight caching layer (existing redis or in-memory) with a short TTL (e.g., 5–10 minutes) to avoid repeated heavy describe calls.
- Update TypeScript types for describe result and add type guards.

Edge cases
- Circular relationships — avoid infinite recursion by tracking visited sObjects.
- Large number of child relationships — respect `maxRelated` param (default 10) and `expandDepth=1`.
- Permission-limited fields — only return fields readable by the current auth context.

Tasks (implementation)
1) API changes (server)
   - Add `expandRelated` and `maxRelated` query params to describe endpoint.
   - Implement describe expansion logic using JSForce. (Files: `packages/webapp/lib/salesforce.ts` or similar)
   - Add caching: check and store describe results in redis/cache.
   - Add unit tests for expanded describe shape.

2) Types & validation
   - Add/extend TS types in `packages/webapp/types/` for DescribeWithRelated.
   - Add runtime validation/type guards.

3) Client updates (if necessary)
   - Update any client code that consumes describe to accept new shape (safely). Default to old behavior if `relatedObjects` absent.

4) Tool / Query builder
   - Update the tool that builds SOQL queries to accept related objects; allow selecting child fields using subquery syntax.
   - Add examples/tests demonstrating building a query with a subquery (e.g., select Id, Name, (select Id, Subject from Cases) from Account).

5) Documentation & migration
   - Update README/docs for the describe endpoint and a short migration guide.

Acceptance criteria
- The describe endpoint returns `relatedObjects` when `expandRelated=true`.
- A sample subquery can be constructed and executed using the updated describe metadata.
- Unit tests cover expansion logic and caching.

Estimates
- Dev: 1.5–2 days
- Tests & docs: 0.5 day

Files likely to change
- `packages/webapp/lib/salesforce.ts`
- `packages/webapp/app/api/salesforce/describe/route.ts` (or equivalent API route)
- `packages/webapp/types/salesforce.ts`
- Tests under `packages/webapp/tests/`

Risks & Mitigations
- Extra describes may increase API usage — mitigate with caching and `expandRelated` toggle.
- Permissions differences may hide fields — ensure errors surface correctly and docs explain required permissions.

QA/Testing
- Unit test: describe expansion returns related fields array with expected keys.
- Integration test (mocked JSForce): build and execute a query that contains one subquery.

Notes
- Keep expansion optional (off by default) to avoid extra runtime cost. Consider an admin-only faster cache priming job.

---

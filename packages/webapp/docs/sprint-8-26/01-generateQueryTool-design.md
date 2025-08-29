# Design: Upgrade generateQueryTool to store describe result and generate SQL

Overview

This design describes the changes needed to upgrade `packages/webapp/lib/chat/sfdc/generateQueryTool.ts` so that it:

- Stores Salesforce sObject `describe` results in an in-memory vector store (embeddings + metadata).
- Uses an existing `generateObject` method (assumed available in the project) to generate a strongly-typed object (Zod schema) containing SQL, params, tablesUsed, and rationale based on a user `description` and vector embeddings.
- Validates the generated object and composes a final SQL string to send to the `/api/salesforce/query` endpoint.

Assumptions

- There is a `generateObject` helper in the `ai` library that accepts a schema and a vector/embedding input and returns an object matching the schema. If not present, a small wrapper will be created to call an LLM generation endpoint.
- There is an embedding function available (e.g., `embedText`) to convert text into a vector. If no project helper exists, we'll implement a thin adapter that calls an embeddings provider via existing project APIs.
- The `describe` endpoint `/api/salesforce/describe` returns a JSON listing fields and minimal metadata suitable for embedding (field labels, apiNames, types, picklists).
- The in-memory vector store will be intentionally simple: an array of entries with {id, vector, payload}. This aligns with sprint scope and avoids introducing heavy dependencies.
- Security: no secrets will be stored in the vector store. Any external API calls use server-side code; this tool runs in the webapp package which may run in Node or edge — we'll document runtime considerations.

Data shapes

- Describe result (from `/api/salesforce/describe`):
  {
    sobjectType: string,
    fields: Array<{name:string,label:string,type:string,extra?:any}>
  }

- Vector store entry:
  {
    id: string, // `${sobjectType}:${fieldName}`
    vector: number[],
    payload: { sobjectType: string, fieldName: string, label: string, type: string }
  }

- Generated object schema (Zod):
  z.object({
    sql: z.string().describe('A single SELECT-only SQL statement using named params like :from, :to, :id'),
    params: z.record(z.any()).default({}),
    tablesUsed: z.array(z.string()).nonempty(),
    rationale: z.string().max(500),
  });

Design Details

1) Vector store
- Implement a minimal in-memory vector store `vectorStore.ts` with methods: `upsert(entries)`, `query(vector, topK)`, `getByPrefix(prefix)`.
- Store metadata so queries can return useful context for generation.

2) Embeddings
- Create an adapter to produce embeddings for the describe payload. We'll stringify the field entries into short sentences ("Field: Account.Name (label: Name) type: string") and embed them.

3) Generation pipeline in `generateQueryTool`
- Fetch describe via existing URL (current code already calls `/api/salesforce/describe`).
- Upsert describe entries into the vector store.
- Produce an embedding for the user `description` and query the vector store for top related fields (topK configurable, default 50).
- Build a prompt/context for `generateObject` that includes the selected field metadata and the user's `description`.
- Call `generateObject(schema, context)` to get the SQL object. Validate against Zod.
- Build the final SQL string (if the returned `sql` is already a full SQL statement, trust it after validation). Ensure it is SELECT-only (quick check) and includes only allowed tables.
- POST the SQL and params to `/api/salesforce/query` and return the query results as the tool result.

Edge cases and validation

- Missing `description`: reject early with an error.
- Empty describe fields: return a helpful message and avoid storing anything.
- `generateObject` returns invalid schema: return an error including the validation issues.
- SQL contains non-SELECT statements: reject and return rationale.

Testing strategy

- Unit tests for `vectorStore` (upsert, query, getByPrefix).
- Unit tests for `generateQueryTool` covering:
  - Happy path (valid describe + description => SQL run and results returned)
  - Missing description
  - Describe has no fields
- Mock external calls (`/api/salesforce/describe`, embeddings, `generateObject`, `/api/salesforce/query`).

Files to create/update

- Update: `packages/webapp/lib/chat/sfdc/generateQueryTool.ts`
- Add: `packages/webapp/lib/chat/sfdc/vectorStore.ts`
- Add: `packages/webapp/tests/generateQueryTool.test.ts`

Timeline / Estimates

- Vector store: 1-2 hours
- Embedding adapter & prompt shaping: 1-2 hours
- generateQueryTool changes & integration: 2-3 hours
- Tests & mocks: 1-2 hours
- Total: ~6-9 hours

Security & Performance notes

- The in-memory vector store is ephemeral; for production consider persistent stores (Pinecone, Weaviate) or persisted disk cache.
- Avoid logging raw describe payloads when they contain PII.

Next steps

If you approve the design I'll implement the code changes and tests in this sprint and run the tests. If you want a different vector store or existing helpers used, tell me which to prefer.
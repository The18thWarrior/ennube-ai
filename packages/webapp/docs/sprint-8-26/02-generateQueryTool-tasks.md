# Tasks: Implement generateQueryTool upgrade

Overview

This document lists concrete implementation tasks, files to change, acceptance criteria, and testing steps to complete the upgrade described in the design doc.

Task list

1) Create in-memory vector store
- File: `packages/webapp/lib/chat/sfdc/vectorStore.ts`
- Implement: Upsert, query (cosine similarity), getByPrefix. Use the `@themaximalist/vectordb.js` library with the `@xenova/transformers` embeddings model. 
- Tests: `vectorStore` unit tests
- Estimate: 1-2 hours

2) Add embedding adapter
- File: `packages/webapp/lib/chat/sfdc/embeddings.ts` (optional small file) or inline helper in `generateQueryTool.ts`.
- Implement: `embedText(text: string): Promise<number[]>` using existing project embedding utilities or a mocked implementation for tests. Use the `@themaximalist/embeddings.js` library with the `@xenova/transformers` embeddings model. 
- Estimate: 1 hour

3) Update `generateQueryTool.ts`
- File: `packages/webapp/lib/chat/sfdc/generateQueryTool.ts` (update existing)
- Implement flow:
  - Validate inputs (subId, sobjectType, description)
  - Fetch describe and handle errors
  - Convert describe fields into textual documents and compute embeddings
  - Upsert entries to vector store
  - Embed the user `description` and query vector store (topK)
  - Build context and call `generateObject` from the `ai` library with the zod schema
  - Validate returned object, enforce SELECT-only SQL, POST to `/api/salesforce/query`
  - Return the query results
- Tests: Mock network calls and `generateObject`
- Estimate: 2-3 hours

4) Tests for `generateQueryTool`
- File: `packages/webapp/tests/generateQueryTool.test.ts`
- Tests: Happy path; missing description; empty fields; invalid generated object
- Use Jest and mocks
- Estimate: 1-2 hours

5) Documentation and README
- Update docs folder with design + tasks (done)
- Add usage examples to `01-generateQueryTool-design.md` if needed
- Estimate: 0.5 hour

Implementation notes & acceptance criteria

- The tool must use `generateObject` to produce and validate the typed object matching the provided Zod schema. 
- The vector store must contain per-field metadata and be queryable by embedding similarity.
- The final SQL must be a single SELECT-only statement; otherwise the tool rejects.
- Tests must mock external APIs; CI-friendly fast tests only.

Deployment considerations

- This change is safe for local dev; production should use a persistent vector store.
- If runtime is edge or serverless, ensure memory usage is acceptable and consider using a persistent remote vector store for production.

How to run tests (local)

# From repo root
pnpm -w test

(Or use a targeted jest command for the webapp package.)

---

Mark tasks as you implement them and update estimates if needed.
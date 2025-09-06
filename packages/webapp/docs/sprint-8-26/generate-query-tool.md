# Generate Query Tool

Overview

The Generate Query Tool creates SELECT-only SOQL queries for Salesforce from natural language descriptions. It uses semantic field discovery (embeddings + vector search) to find relevant fields on an sObject, then prompts an LLM to produce a validated SOQL statement. The tool protects against unsafe SQL by validating that generated statements are SELECT-only before executing them via the server-side Salesforce query API.

Key components

- Embeddings adapter: converts field descriptions and user queries into numeric vectors (via `@themaximalist/embeddings.js` + `@xenova/transformers` by default).
- Vector store: in-memory (development) vector store for field vectors. Designed as a small adapter layer with pluggable backends (e.g., Upstash, vectordb) for production.
- AI generation: uses the `ai` SDK's `generateObject` with a Zod schema (`QueryGenerationSchema`) to produce a structured SQL-like object.
- Security validator: `validateSelectOnly(sql)` enforces the generated statement is a SELECT-only statement and rejects DML/DDL.
- Server APIs: communicates with server-side endpoints to fetch object describes and execute SOQL queries.

Files

- `lib/chat/sfdc/embeddings.ts` - embedding adapter and helpers (lazy-loaded to avoid test-time ESM import issues).
- `lib/chat/sfdc/vectorStore.ts` - in-memory vector store implementation with `upsert`, `query`, and `getByPrefix`.
- `lib/chat/sfdc/generateQueryTool.ts` - main tool exposing `generateQueryTool(subId)`; uses the above components.
- `tests/generateQueryTool.test.ts` - unit tests covering input validation, API error handling, embedding failures, vector store integration, and AI prompts.

Usage

1. Create the tool with a subscription id (server-side/agent code):

```ts
import { generateQueryTool } from '@/lib/chat/sfdc/generateQueryTool';

const tool = generateQueryTool('user-sub-id');
```

2. Execute the tool:

```ts
const result = await tool.execute({
  sobjectType: 'Account',
  description: 'Find technology companies in the US with revenue > $1M'
});

if (!result.success) {
  // inspect result.error
}

console.log(result.query.sql);
console.log(result.results);
```

Server endpoints used

- `GET /api/salesforce/describe?sub=...&sobjectType=...` - returns standard Salesforce describe metadata (fields, types, picklist values).
- `GET /api/salesforce/query?sub=...&soql=...` - executes the SOQL query and returns query results.

Behavior & constraints

- The tool only executes SELECT statements; any generated non-SELECT SQL is rejected.
- Embeddings and vector store are lazy-loaded to avoid ESM import-time errors in tests.
- The in-memory vector store is intended for development; switch to a persistent vectordb for production workloads.

Testing

- Unit tests are provided in `tests/generateQueryTool.test.ts`. They mock the embedding service, vector store, AI generation, and server endpoints.
- When adding integration tests that use real embeddings or vectordb packages, do so in a dedicated CI job or behind a flag (these libraries are ESM and can require special Jest transform config).

Extending to production

- Swap the in-memory vector store with a persistent backend (e.g., Upstash Redis or a vectordb provider).
- Use a hosted embeddings provider or run the xenova transformer model on a GPU-enabled environment.
- Add caching around describe responses and generated queries to reduce cost and latency.

Security & privacy

- Do not log sensitive user or Salesforce data in production logs.
- Ensure OAuth tokens and credentials are stored securely (Vercel KV, encrypted secret store, or a proper secrets manager).
- Sanitize any external data used in prompts to avoid prompt injection risks.

Troubleshooting

- If Jest complains about ESM import errors from the embeddings or vectordb packages, make sure those modules are mocked in tests or add a Jest transform configuration for ESM modules.
- If embeddings fail, the tool returns a clear error ("Embedding service unavailable") and does not execute any queries.

Change log

- v1.0 - Initial implementation (2025-08-27): vector store, embedding adapter, generateQueryTool implementation, and unit tests.

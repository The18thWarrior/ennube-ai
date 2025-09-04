Embedder API

A small package that provides a simple in-memory vector store for embeddings and an API surface for adding and querying vectors.

## Example: SimpleVectorStore (usage)

Below is a minimal example showing how to create the optimized in-memory store, add vectors, and perform a top-k similarity query.

```ts
import { SimpleVectorStore } from './lib/vector-store';

async function example() {
  // Use dim=1536 and pre-allocate capacity for 100k items for best performance
  const store = new SimpleVectorStore({ dim: 1536, expectedCapacity: 100000, tables: 16, bits: 12 });

  // Example: add some vectors (here using random data for illustration)
  const toAdd = [] as number[][];
  for (let i = 0; i < 1000; i++) {
    const v = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    toAdd.push(v);
  }
  const ids = store.addVectors(toAdd);

  // Query with a random vector, request top-20 results
  const q = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  const results = store.similaritySearchVectorWithScore(q, 20);
  console.log('top result', results[0]);
}

example();
```

## Quick smoke test

To validate behavior locally without running a repo-wide TypeScript check (which may run other packages), compile this package and run the included smoke script:

```bash
# from repo root
cd packages/embedder-api
pnpm tsc
node bin/smoke-vector-store.mjs
```

Notes:
- The project contains a `bin/smoke-vector-store.mjs` script that compiles and runs a small add+query run.
- Running `pnpm -w exec tsc --noEmit` at the repository root will type-check the entire monorepo and may surface unrelated package path/alias errors if your environment expects TypeScript path mappings or per-package builds; prefer per-package `pnpm tsc` when validating a single package.

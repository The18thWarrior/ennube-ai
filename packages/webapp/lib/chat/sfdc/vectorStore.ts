// === vectorStore.ts ===
// Created: 2025-08-27 00:00
// Purpose: Self-contained, import-free in-memory vector store used by the webapp chat SFDC integration.
// Exports:
//  - export type VectorDoc
//  - export class SimpleVectorStore
// Notes:
//  - This file intentionally has no import statements so it can be embedded easily.

/**
 * OVERVIEW
 *
 * - Purpose: Provide a minimal, fully custom vector store with a small API for adding vectors/documents
 *   and performing similarity searches. It's intentionally simple and dependency-free.
 * - Assumptions: The caller is responsible for producing vector embeddings (arrays of numbers).
 * - Edge Cases: Empty store, mismatched dims, missing vectors for documents. Methods throw clear errors
 *   on invalid input.
 * - Future improvements: persistence, async batch indexing, typed metadata shape, configurable distance metric.
 */

/** Document stored alongside a vector. */
export type VectorDoc = {
  id: string;
  text?: string; // optional textual content
  metadata?: Record<string, unknown>;
};

/** Minimal, in-memory vector store. */
export class SimpleVectorStore {
  private vectors: Map<string, number[]> = new Map();
  private docs: Map<string, VectorDoc> = new Map();
  private dim: number | null = null;
  private idCounter = 0;

  /** Create a new store. Optionally provide an expected dimensionality to lock the store. */
  constructor(expectedDim?: number) {
    if (expectedDim && expectedDim > 0) this.dim = expectedDim;
  }

  /* ----------------------------- Basic helpers ----------------------------- */
  private nextId(): string {
    this.idCounter += 1;
    return `vec_${Date.now().toString(36)}_${this.idCounter}`;
  }

  private assertDim(vec: number[]) {
    if (!Array.isArray(vec) || vec.length === 0) {
      throw new Error('Vector must be a non-empty number array.');
    }
    if (this.dim === null) this.dim = vec.length;
    if (vec.length !== this.dim) throw new Error(`Vector dimensionality mismatch: expected ${this.dim}, got ${vec.length}`);
  }

  private dot(a: number[], b: number[]) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }

  private norm(a: number[]) {
    return Math.sqrt(this.dot(a, a));
  }

  private cosine(a: number[], b: number[]) {
    const na = this.norm(a);
    const nb = this.norm(b);
    if (na === 0 || nb === 0) return 0;
    return this.dot(a, b) / (na * nb);
  }

  /* ----------------------------- Public API ----------------------------- */

  /** Add raw vectors with optional ids and optional metadata/text. Returns list of ids assigned. */
  addVectors(
    vectors: number[][],
    opts?: { ids?: string[]; docs?: (Partial<VectorDoc> | undefined)[] }
  ): string[] {
    if (!Array.isArray(vectors) || vectors.length === 0) throw new Error('vectors must be a non-empty array');
    const idsOut: string[] = [];
    for (let i = 0; i < vectors.length; i++) {
      const v = vectors[i];
      this.assertDim(v);
      const idFromOpts = opts?.ids && opts.ids[i];
      const id = idFromOpts || this.nextId();
      if (this.vectors.has(id)) throw new Error(`Duplicate vector id: ${id}`);
      this.vectors.set(id, v.slice()); // copy
      const docPartial = opts?.docs && opts.docs[i];
      this.docs.set(id, { id, text: docPartial?.text, metadata: docPartial?.metadata });
      idsOut.push(id);
    }
    return idsOut;
  }

  /** Add documents with externally supplied vectors. Documents must align with vectors if provided. */
  addDocuments(
    documents: { text?: string; metadata?: Record<string, unknown>; id?: string }[],
    vectors?: number[][]
  ): string[] {
    if (!Array.isArray(documents) || documents.length === 0) throw new Error('documents must be a non-empty array');
    if (vectors && vectors.length !== documents.length) throw new Error('documents and vectors must have same length');

    const ids: string[] = [];
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const id = doc.id || this.nextId();
      if (this.docs.has(id) || this.vectors.has(id)) throw new Error(`Duplicate document id: ${id}`);
      this.docs.set(id, { id, text: doc.text, metadata: doc.metadata });
      if (vectors) {
        const v = vectors[i];
        this.assertDim(v);
        this.vectors.set(id, v.slice());
      }
      ids.push(id);
    }
    return ids;
  }

  /** Perform similarity search using a query vector. Returns top-k documents with scores (cosine similarity). */
  similaritySearchVectorWithScore(queryVector: number[], k = 10): Array<{ doc: VectorDoc; score: number }> {
    if (this.vectors.size === 0) return [];
    this.assertDim(queryVector);
    const results: Array<{ id: string; score: number }> = [];
    this.vectors.forEach((vec, id) => {
      const sc = this.cosine(queryVector, vec);
      results.push({ id, score: sc });
    });
    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, k);
    return top.map((r) => ({ doc: this.docs.get(r.id) || { id: r.id }, score: r.score }));
  }

  /** Convenience: search by pre-computed query vector and return only documents. */
  similaritySearch(queryVector: number[], k = 10): VectorDoc[] {
    return this.similaritySearchVectorWithScore(queryVector, k).map((r) => r.doc);
  }

  /** Remove entries by id. Returns number removed. */
  deleteByIds(ids: string[]): number {
    let removed = 0;
    for (const id of ids) {
      const hadV = this.vectors.delete(id);
      const hadD = this.docs.delete(id);
      if (hadV || hadD) removed++;
    }
    return removed;
  }

  /** Completely clear the store. */
  clear(): void {
    this.vectors.clear();
    this.docs.clear();
    this.dim = null;
    this.idCounter = 0;
  }

  /** Get number of stored vectors. */
  size(): number {
    return this.vectors.size;
  }

  /** Export to a JSON-serializable object. */
  toJSON() {
    return {
      dim: this.dim,
      idCounter: this.idCounter,
      items: Array.from(this.vectors.entries()).map(([id, vec]) => ({ id, vec, doc: this.docs.get(id) })),
    };
  }

  /** Restore from an object produced by toJSON. */
  static fromJSON(data: any): SimpleVectorStore {
    if (!data || !Array.isArray(data.items)) throw new Error('invalid store JSON');
    const store = new SimpleVectorStore(data.dim ?? undefined);
    store.idCounter = typeof data.idCounter === 'number' ? data.idCounter : 0;
    for (const item of data.items) {
      if (!item || !item.id || !Array.isArray(item.vec)) continue;
      store.vectors.set(item.id, item.vec.slice());
      const doc = item.doc as VectorDoc | undefined;
      store.docs.set(item.id, doc ?? { id: item.id });
    }
    return store;
  }
}

/**
 * Compatibility types and factory used by the SFDC integration.
 * Older code expects a VectorStoreEntry shape and a createSalesforceVectorStore() factory
 * that returns an object with upsert(entries[]) and query(vector, k) methods.
 */
export type VectorStoreEntry = {
  id: string;
  vector: number[];
  payload?: Record<string, any>;
};

/**
 * Create a lightweight Salesforce-focused vector store adapter backed by SimpleVectorStore.
 */
export function createSalesforceVectorStore() {
  const store = new SimpleVectorStore();

  return {
    // Upsert entries (array of VectorStoreEntry)
    async upsert(entries: VectorStoreEntry[] | undefined) {
      if (!entries || entries.length === 0) return;
      const vectors: number[][] = [];
      const ids: string[] = [];
      const docs: Partial<VectorDoc>[] = [];
      for (const e of entries) {
        if (!e || !e.id || !Array.isArray(e.vector)) continue;
        ids.push(e.id);
        vectors.push(e.vector);
        docs.push({ id: e.id, text: undefined, metadata: e.payload });
      }
      // If some of the ids already exist, delete them first to perform upsert semantics
      store.deleteByIds(ids);
      store.addVectors(vectors, { ids, docs });
    },

    // Query returns top-k entries with payload and score
    async query(queryVector: number[], k = 10) {
      const results = store.similaritySearchVectorWithScore(queryVector, k);
      return results.map(r => ({ id: r.doc.id, payload: r.doc.metadata, score: r.score }));
    },

    // Expose a simple clear for testing
    async clear() {
      store.clear();
    },

    // For debugging: size
    async size() {
      return store.size();
    }
  };
}

/*
 * === vectorStore.ts ===
 * Updated: 2025-08-27 00:00
 * Summary: SimpleVectorStore - an in-memory vector store with add/search/delete and (de)serialization.
 * Key Components:
 *  - addVectors/addDocuments: add items to store
 *  - similaritySearchVectorWithScore: cosine-based retrieval
 *  - toJSON/fromJSON: persistence helpers
 * Version History:
 *  v1.0 – initial import-free implementation
 */
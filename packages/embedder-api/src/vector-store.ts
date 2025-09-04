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
  text?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Minimal, high-performance in-memory vector store with a simple LSH-based ANN.
 * - Uses contiguous Float32Array storage for vectors (good memory locality).
 * - Stores normalized vectors (unit length) so similarity = dot product.
 * - Uses multiple hash tables with signed random projections (SimHash) to generate candidate sets.
 * - Uses a bounded min-heap (size k) to compute top-k from candidates (O(n log k)).
 *
 * This implementation is dependency-free and tuned for many reads (100k vectors, dim ~1536).
 */
export class SimpleVectorStore {
  // Typed-array backing for vector storage (row-major flat float32 buffer)
  private dim: number;
  private capacity: number;
  private count = 0; // number of live vectors
  private data: Float32Array; // length = capacity * dim

  // Maps id -> slot index (0..capacity-1)
  private idToSlot: Map<string, number> = new Map();
  private slotToId: (string | null)[] = [];

  // Documents metadata
  private docs: Map<string, VectorDoc> = new Map();

  // LSH tables: for each table we have `bits` hyperplanes (stored as Float32Array)
  private lshTables: Map<string, number[]> = new Map(); // bucketKey -> array of slots
  private hyperplanes: Float32Array[] = [];
  private readonly tables: number;
  private readonly bits: number;

  // Pools reused for queries to reduce allocations
  private scratchVec?: Float32Array;

  constructor(options?: { dim?: number; expectedCapacity?: number; tables?: number; bits?: number }) {
    // Defaults tuned for user constraints: dim=1536, expectedCapacity=100k
    this.dim = options?.dim ?? 1536;
    this.capacity = Math.max(1024, options?.expectedCapacity ?? 16_384);
    this.data = new Float32Array(this.capacity * this.dim);
    this.slotToId = new Array(this.capacity).fill(null);

    // LSH defaults: tradeoff between recall and candidates. These are conservative defaults.
    this.tables = options?.tables ?? 16; // L
    this.bits = options?.bits ?? 12; // hyperplanes per table (<=32)

    // Initialize hyperplanes with deterministic pseudo-random numbers (stable across runs)
    for (let t = 0; t < this.tables; t++) {
      const hp = new Float32Array(this.bits * this.dim);
      // Deterministic 32-bit PRNG seeded by table index to keep reproducible behavior.
      // Uses a simple LCG to avoid BigInt and remain compatible with older TS targets.
      let seed = (2166136261 >>> 0) + t;
      for (let i = 0; i < hp.length; i++) {
        // LCG: seed = (a * seed + c) mod 2^32
        seed = (seed * 1664525 + 1013904223) >>> 0;
        // convert to float in (-1,1)
        const v = (seed / 0x100000000) * 2 - 1;
        hp[i] = v;
      }
      this.hyperplanes.push(hp);
    }
  }

  /* ----------------------------- Low-level storage ----------------------------- */
  private ensureCapacity(minCapacity: number) {
    if (minCapacity <= this.capacity) return;
    let newCap = this.capacity;
    while (newCap < minCapacity) newCap *= 2;
    const newData = new Float32Array(newCap * this.dim);
    newData.set(this.data);
    this.data = newData;
    const extra = new Array(newCap - this.capacity).fill(null);
    this.slotToId.push(...extra);
    this.capacity = newCap;
  }

  private allocSlot(): number {
    // find first null slot, else expand
    for (let i = 0; i < this.slotToId.length; i++) {
      if (this.slotToId[i] === null) return i;
    }
    // none free: expand
    const oldCap = this.capacity;
    this.ensureCapacity(this.capacity * 2);
    return oldCap;
  }

  private writeVectorToSlot(slot: number, vec: Float32Array) {
    const offset = slot * this.dim;
    this.data.set(vec, offset);
  }

  private readVectorFromSlot(slot: number, out?: Float32Array): Float32Array {
    const offset = slot * this.dim;
    if (!out) return this.data.slice(offset, offset + this.dim);
    out.set(this.data.subarray(offset, offset + this.dim));
    return out;
  }

  /* ----------------------------- Math helpers ----------------------------- */
  private dotUnit(slot: number, q: Float32Array) {
    // both q and stored vector are unit-length -> dot product equals cosine similarity
    const offset = slot * this.dim;
    let s = 0.0;
    for (let i = 0; i < this.dim; i++) s += this.data[offset + i] * q[i];
    return s;
  }

  private normalizeToFloat32(src: number[] | Float32Array): Float32Array {
    const v = new Float32Array(this.dim);
    if (src.length !== this.dim) throw new Error(`Vector dimensionality mismatch: expected ${this.dim}, got ${src.length}`);
    let s = 0;
    for (let i = 0; i < this.dim; i++) {
      v[i] = typeof (src as any)[i] === 'number' ? (src as any)[i] : 0;
      s += v[i] * v[i];
    }
    const norm = Math.sqrt(s);
    if (norm === 0) return v; // leave as zeros
    for (let i = 0; i < this.dim; i++) v[i] = v[i] / norm;
    return v;
  }

  /* ----------------------------- LSH hashing ----------------------------- */
  private hashVectorToBuckets(vec: Float32Array): string[] {
    const buckets: string[] = [];
    for (let t = 0; t < this.tables; t++) {
      const hp = this.hyperplanes[t];
      let key = 0 >>> 0;
      for (let b = 0; b < this.bits; b++) {
        // compute dot of hyperplane b with vec
        let s = 0.0;
        const planeOffset = b * this.dim;
        for (let i = 0; i < this.dim; i++) s += hp[planeOffset + i] * vec[i];
        if (s >= 0) key |= (1 << b) >>> 0;
      }
      buckets.push(t + ':' + (key >>> 0));
    }
    return buckets;
  }

  private addToBucket(bucketKey: string, slot: number) {
    const arr = this.lshTables.get(bucketKey);
    if (arr) {
      arr.push(slot);
    } else {
      this.lshTables.set(bucketKey, [slot]);
    }
  }

  private removeFromBucket(bucketKey: string, slot: number) {
    const arr = this.lshTables.get(bucketKey);
    if (!arr) return;
    const idx = arr.indexOf(slot);
    if (idx >= 0) {
      arr.splice(idx, 1);
      if (arr.length === 0) this.lshTables.delete(bucketKey);
    }
  }

  /* ----------------------------- Public API ----------------------------- */
  addVectors(vectors: number[][], opts?: { ids?: string[]; docs?: (Partial<VectorDoc> | undefined)[] }): string[] {
    if (!Array.isArray(vectors) || vectors.length === 0) throw new Error('vectors must be a non-empty array');
    const idsOut: string[] = [];
    for (let i = 0; i < vectors.length; i++) {
      const arr = vectors[i];
      const id = opts?.ids?.[i] ?? `vec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      if (this.idToSlot.has(id)) throw new Error(`Duplicate vector id: ${id}`);
      const vec = this.normalizeToFloat32(arr);
      const slot = this.allocSlot();
      this.ensureCapacity(slot + 1);
      this.writeVectorToSlot(slot, vec);
      this.slotToId[slot] = id;
      this.idToSlot.set(id, slot);
      this.docs.set(id, { id, text: opts?.docs?.[i]?.text, metadata: opts?.docs?.[i]?.metadata });
      // Add to LSH buckets
      const buckets = this.hashVectorToBuckets(vec);
      for (const b of buckets) this.addToBucket(b, slot);
      this.count += 1;
      idsOut.push(id);
    }
    return idsOut;
  }

  addDocuments(documents: { text?: string; metadata?: Record<string, unknown>; id?: string }[], vectors?: number[][]): string[] {
    if (!Array.isArray(documents) || documents.length === 0) throw new Error('documents must be a non-empty array');
    if (vectors && vectors.length !== documents.length) throw new Error('documents and vectors must have same length');
    const ids: string[] = [];
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const id = doc.id ?? `vec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      if (this.idToSlot.has(id)) throw new Error(`Duplicate document id: ${id}`);
      this.docs.set(id, { id, text: doc.text, metadata: doc.metadata });
      if (vectors) {
        const vec = this.normalizeToFloat32(vectors[i]);
        const slot = this.allocSlot();
        this.ensureCapacity(slot + 1);
        this.writeVectorToSlot(slot, vec);
        this.slotToId[slot] = id;
        this.idToSlot.set(id, slot);
        const buckets = this.hashVectorToBuckets(vec);
        for (const b of buckets) this.addToBucket(b, slot);
        this.count += 1;
      }
      ids.push(id);
    }
    return ids;
  }

  similaritySearchVectorWithScore(queryVector: number[], k = 10): Array<{ doc: VectorDoc; score: number }> {
    if (this.count === 0) return [];
    if (!this.scratchVec) this.scratchVec = new Float32Array(this.dim);
    const q = this.normalizeToFloat32(queryVector);

    // Gather candidates from LSH buckets
    const buckets = this.hashVectorToBuckets(q);
    const candidates = new Set<number>();
    for (const b of buckets) {
      const arr = this.lshTables.get(b);
      if (!arr) continue;
      for (const slot of arr) candidates.add(slot);
    }

    // If no candidates, fallback to scanning all slots (still unit vectors -> dot)
    let candidateSlots: number[];
    if (candidates.size === 0) {
      candidateSlots = [];
      for (let s = 0; s < this.slotToId.length; s++) {
        const id = this.slotToId[s];
        if (id !== null) candidateSlots.push(s);
      }
    } else {
      candidateSlots = Array.from(candidates);
    }

    // Use a bounded min-heap for top-k
    const heap: Array<{ slot: number; score: number }> = [];
    const pushHeap = (item: { slot: number; score: number }) => {
      if (heap.length < k) {
        heap.push(item);
        if (heap.length === k) heap.sort((a, b) => a.score - b.score);
        return;
      }
      if (item.score <= heap[0].score) return;
      // replace root (min)
      heap[0] = item;
      // bubble down small fix: resort - k is small (<=20) so sort is cheap
      heap.sort((a, b) => a.score - b.score);
    };

    for (const slot of candidateSlots) {
      const score = this.dotUnit(slot, q);
      pushHeap({ slot, score });
    }

    // sort descending by score
    heap.sort((a, b) => b.score - a.score);
    const out: Array<{ doc: VectorDoc; score: number }> = [];
    for (const it of heap) {
      const id = this.slotToId[it.slot];
      if (!id) continue;
      out.push({ doc: this.docs.get(id) ?? { id }, score: it.score });
    }
    return out;
  }

  similaritySearch(queryVector: number[], k = 10): VectorDoc[] {
    return this.similaritySearchVectorWithScore(queryVector, k).map(r => r.doc);
  }

  deleteByIds(ids: string[]): number {
    let removed = 0;
    for (const id of ids) {
      const slot = this.idToSlot.get(id);
      if (slot === undefined) continue;
      // remove from LSH buckets
      const vec = this.readVectorFromSlot(slot);
      const buckets = this.hashVectorToBuckets(vec);
      for (const b of buckets) this.removeFromBucket(b, slot);
      this.idToSlot.delete(id);
      this.slotToId[slot] = null;
      this.docs.delete(id);
      // zero out memory (optional)
      const off = slot * this.dim;
      this.data.fill(0, off, off + this.dim);
      this.count -= 1;
      removed += 1;
    }
    return removed;
  }

  clear(): void {
    this.data = new Float32Array(this.capacity * this.dim);
    this.idToSlot.clear();
    this.slotToId.fill(null);
    this.docs.clear();
    this.lshTables.clear();
    this.count = 0;
  }

  size(): number {
    return this.count;
  }

  toJSON() {
    // Note: serializing large Float32Arrays may be expensive; convert to normal arrays for portability
    const items: Array<{ id: string; vec: number[]; doc?: VectorDoc }> = [];
    for (let s = 0; s < this.slotToId.length; s++) {
      const id = this.slotToId[s];
      if (!id) continue;
      const off = s * this.dim;
      const vec = Array.from(this.data.subarray(off, off + this.dim));
      items.push({ id, vec, doc: this.docs.get(id) });
    }
    return { dim: this.dim, items };
  }

  static fromJSON(data: any): SimpleVectorStore {
    if (!data || !Array.isArray(data.items)) throw new Error('invalid store JSON');
    const store = new SimpleVectorStore({ dim: data.dim, expectedCapacity: data.items.length });
    for (const item of data.items) {
      if (!item || !item.id || !Array.isArray(item.vec)) continue;
      store.addVectors([item.vec], { ids: [item.id], docs: [item.doc] });
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
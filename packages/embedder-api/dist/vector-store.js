// === vectorStore.ts ===
// Created: 2025-08-27 00:00
// Purpose: Self-contained, import-free in-memory vector store used by the webapp chat SFDC integration.
// Exports:
//  - export type VectorDoc
//  - export class SimpleVectorStore
// Notes:
//  - This file intentionally has no import statements so it can be embedded easily.
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
    constructor(options) {
        var _a, _b, _c, _d;
        this.count = 0; // number of live vectors
        // Maps id -> slot index (0..capacity-1)
        this.idToSlot = new Map();
        this.slotToId = [];
        // Documents metadata
        this.docs = new Map();
        // LSH tables: for each table we have `bits` hyperplanes (stored as Float32Array)
        this.lshTables = new Map(); // bucketKey -> array of slots
        this.hyperplanes = [];
        // Defaults tuned for user constraints: dim=1536, expectedCapacity=100k
        this.dim = (_a = options === null || options === void 0 ? void 0 : options.dim) !== null && _a !== void 0 ? _a : 1536;
        this.capacity = Math.max(1024, (_b = options === null || options === void 0 ? void 0 : options.expectedCapacity) !== null && _b !== void 0 ? _b : 16384);
        this.data = new Float32Array(this.capacity * this.dim);
        this.slotToId = new Array(this.capacity).fill(null);
        // LSH defaults: tradeoff between recall and candidates. These are conservative defaults.
        this.tables = (_c = options === null || options === void 0 ? void 0 : options.tables) !== null && _c !== void 0 ? _c : 16; // L
        this.bits = (_d = options === null || options === void 0 ? void 0 : options.bits) !== null && _d !== void 0 ? _d : 12; // hyperplanes per table (<=32)
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
    ensureCapacity(minCapacity) {
        if (minCapacity <= this.capacity)
            return;
        let newCap = this.capacity;
        while (newCap < minCapacity)
            newCap *= 2;
        const newData = new Float32Array(newCap * this.dim);
        newData.set(this.data);
        this.data = newData;
        const extra = new Array(newCap - this.capacity).fill(null);
        this.slotToId.push(...extra);
        this.capacity = newCap;
    }
    allocSlot() {
        // find first null slot, else expand
        for (let i = 0; i < this.slotToId.length; i++) {
            if (this.slotToId[i] === null)
                return i;
        }
        // none free: expand
        const oldCap = this.capacity;
        this.ensureCapacity(this.capacity * 2);
        return oldCap;
    }
    writeVectorToSlot(slot, vec) {
        const offset = slot * this.dim;
        this.data.set(vec, offset);
    }
    readVectorFromSlot(slot, out) {
        const offset = slot * this.dim;
        if (!out)
            return this.data.slice(offset, offset + this.dim);
        out.set(this.data.subarray(offset, offset + this.dim));
        return out;
    }
    /* ----------------------------- Math helpers ----------------------------- */
    dotUnit(slot, q) {
        // both q and stored vector are unit-length -> dot product equals cosine similarity
        const offset = slot * this.dim;
        let s = 0.0;
        for (let i = 0; i < this.dim; i++)
            s += this.data[offset + i] * q[i];
        return s;
    }
    normalizeToFloat32(src) {
        const v = new Float32Array(this.dim);
        if (src.length !== this.dim)
            throw new Error(`Vector dimensionality mismatch: expected ${this.dim}, got ${src.length}`);
        let s = 0;
        for (let i = 0; i < this.dim; i++) {
            v[i] = typeof src[i] === 'number' ? src[i] : 0;
            s += v[i] * v[i];
        }
        const norm = Math.sqrt(s);
        if (norm === 0)
            return v; // leave as zeros
        for (let i = 0; i < this.dim; i++)
            v[i] = v[i] / norm;
        return v;
    }
    /* ----------------------------- LSH hashing ----------------------------- */
    hashVectorToBuckets(vec) {
        const buckets = [];
        for (let t = 0; t < this.tables; t++) {
            const hp = this.hyperplanes[t];
            let key = 0 >>> 0;
            for (let b = 0; b < this.bits; b++) {
                // compute dot of hyperplane b with vec
                let s = 0.0;
                const planeOffset = b * this.dim;
                for (let i = 0; i < this.dim; i++)
                    s += hp[planeOffset + i] * vec[i];
                if (s >= 0)
                    key |= (1 << b) >>> 0;
            }
            buckets.push(t + ':' + (key >>> 0));
        }
        return buckets;
    }
    addToBucket(bucketKey, slot) {
        const arr = this.lshTables.get(bucketKey);
        if (arr) {
            arr.push(slot);
        }
        else {
            this.lshTables.set(bucketKey, [slot]);
        }
    }
    removeFromBucket(bucketKey, slot) {
        const arr = this.lshTables.get(bucketKey);
        if (!arr)
            return;
        const idx = arr.indexOf(slot);
        if (idx >= 0) {
            arr.splice(idx, 1);
            if (arr.length === 0)
                this.lshTables.delete(bucketKey);
        }
    }
    /* ----------------------------- Public API ----------------------------- */
    addVectors(vectors, opts) {
        var _a, _b, _c, _d, _e, _f;
        if (!Array.isArray(vectors) || vectors.length === 0)
            throw new Error('vectors must be a non-empty array');
        const idsOut = [];
        for (let i = 0; i < vectors.length; i++) {
            const arr = vectors[i];
            const id = (_b = (_a = opts === null || opts === void 0 ? void 0 : opts.ids) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : `vec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            if (this.idToSlot.has(id))
                throw new Error(`Duplicate vector id: ${id}`);
            const vec = this.normalizeToFloat32(arr);
            const slot = this.allocSlot();
            this.ensureCapacity(slot + 1);
            this.writeVectorToSlot(slot, vec);
            this.slotToId[slot] = id;
            this.idToSlot.set(id, slot);
            this.docs.set(id, { id, text: (_d = (_c = opts === null || opts === void 0 ? void 0 : opts.docs) === null || _c === void 0 ? void 0 : _c[i]) === null || _d === void 0 ? void 0 : _d.text, metadata: (_f = (_e = opts === null || opts === void 0 ? void 0 : opts.docs) === null || _e === void 0 ? void 0 : _e[i]) === null || _f === void 0 ? void 0 : _f.metadata });
            // Add to LSH buckets
            const buckets = this.hashVectorToBuckets(vec);
            for (const b of buckets)
                this.addToBucket(b, slot);
            this.count += 1;
            idsOut.push(id);
        }
        return idsOut;
    }
    addDocuments(documents, vectors) {
        var _a;
        if (!Array.isArray(documents) || documents.length === 0)
            throw new Error('documents must be a non-empty array');
        if (vectors && vectors.length !== documents.length)
            throw new Error('documents and vectors must have same length');
        const ids = [];
        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            const id = (_a = doc.id) !== null && _a !== void 0 ? _a : `vec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            if (this.idToSlot.has(id))
                throw new Error(`Duplicate document id: ${id}`);
            this.docs.set(id, { id, text: doc.text, metadata: doc.metadata });
            if (vectors) {
                const vec = this.normalizeToFloat32(vectors[i]);
                const slot = this.allocSlot();
                this.ensureCapacity(slot + 1);
                this.writeVectorToSlot(slot, vec);
                this.slotToId[slot] = id;
                this.idToSlot.set(id, slot);
                const buckets = this.hashVectorToBuckets(vec);
                for (const b of buckets)
                    this.addToBucket(b, slot);
                this.count += 1;
            }
            ids.push(id);
        }
        return ids;
    }
    similaritySearchVectorWithScore(queryVector, k = 10) {
        var _a;
        if (this.count === 0)
            return [];
        if (!this.scratchVec)
            this.scratchVec = new Float32Array(this.dim);
        const q = this.normalizeToFloat32(queryVector);
        // Gather candidates from LSH buckets
        const buckets = this.hashVectorToBuckets(q);
        const candidates = new Set();
        for (const b of buckets) {
            const arr = this.lshTables.get(b);
            if (!arr)
                continue;
            for (const slot of arr)
                candidates.add(slot);
        }
        // If no candidates, fallback to scanning all slots (still unit vectors -> dot)
        let candidateSlots;
        if (candidates.size === 0) {
            candidateSlots = [];
            for (let s = 0; s < this.slotToId.length; s++) {
                const id = this.slotToId[s];
                if (id !== null)
                    candidateSlots.push(s);
            }
        }
        else {
            candidateSlots = Array.from(candidates);
        }
        // Use a bounded min-heap for top-k
        const heap = [];
        const pushHeap = (item) => {
            if (heap.length < k) {
                heap.push(item);
                if (heap.length === k)
                    heap.sort((a, b) => a.score - b.score);
                return;
            }
            if (item.score <= heap[0].score)
                return;
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
        const out = [];
        for (const it of heap) {
            const id = this.slotToId[it.slot];
            if (!id)
                continue;
            out.push({ doc: (_a = this.docs.get(id)) !== null && _a !== void 0 ? _a : { id }, score: it.score });
        }
        return out;
    }
    similaritySearch(queryVector, k = 10) {
        return this.similaritySearchVectorWithScore(queryVector, k).map(r => r.doc);
    }
    deleteByIds(ids) {
        let removed = 0;
        for (const id of ids) {
            const slot = this.idToSlot.get(id);
            if (slot === undefined)
                continue;
            // remove from LSH buckets
            const vec = this.readVectorFromSlot(slot);
            const buckets = this.hashVectorToBuckets(vec);
            for (const b of buckets)
                this.removeFromBucket(b, slot);
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
    clear() {
        this.data = new Float32Array(this.capacity * this.dim);
        this.idToSlot.clear();
        this.slotToId.fill(null);
        this.docs.clear();
        this.lshTables.clear();
        this.count = 0;
    }
    size() {
        return this.count;
    }
    toJSON() {
        // Note: serializing large Float32Arrays may be expensive; convert to normal arrays for portability
        const items = [];
        for (let s = 0; s < this.slotToId.length; s++) {
            const id = this.slotToId[s];
            if (!id)
                continue;
            const off = s * this.dim;
            const vec = Array.from(this.data.subarray(off, off + this.dim));
            items.push({ id, vec, doc: this.docs.get(id) });
        }
        return { dim: this.dim, items };
    }
    static fromJSON(data) {
        if (!data || !Array.isArray(data.items))
            throw new Error('invalid store JSON');
        const store = new SimpleVectorStore({ dim: data.dim, expectedCapacity: data.items.length });
        for (const item of data.items) {
            if (!item || !item.id || !Array.isArray(item.vec))
                continue;
            store.addVectors([item.vec], { ids: [item.id], docs: [item.doc] });
        }
        return store;
    }
}
/**
 * Create a lightweight Salesforce-focused vector store adapter backed by SimpleVectorStore.
 */
export function createSalesforceVectorStore() {
    const store = new SimpleVectorStore();
    return {
        // Upsert entries (array of VectorStoreEntry)
        async upsert(entries) {
            if (!entries || entries.length === 0)
                return;
            const vectors = [];
            const ids = [];
            const docs = [];
            for (const e of entries) {
                if (!e || !e.id || !Array.isArray(e.vector))
                    continue;
                ids.push(e.id);
                vectors.push(e.vector);
                docs.push({ id: e.id, text: undefined, metadata: e.payload });
            }
            // If some of the ids already exist, delete them first to perform upsert semantics
            store.deleteByIds(ids);
            store.addVectors(vectors, { ids, docs });
        },
        // Query returns top-k entries with payload and score
        async query(queryVector, k = 10) {
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

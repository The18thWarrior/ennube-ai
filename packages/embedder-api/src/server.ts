// === server.ts ===
// Created: 2025-09-03 00:00
// Purpose: Small Express HTTP server exposing POST /query to fetch a JSON stringified
// array of VectorStoreEntry from a URL and run a query against an in-memory store.

import express, { Request, Response } from 'express';
import dotenv from 'dotenv'
import { createSalesforceVectorStore, type VectorStoreEntry } from './vector-store.js';
import { getCachedEntries, setCachedEntries, touchCache, cleanupCacheOnce } from './cache.js';
// npm i @huggingface/transformers
import { pipeline } from '@huggingface/transformers';


dotenv.config()
const app = express();
app.use(express.json({ limit: '10mb' }));

// Simple token auth: set EMBEDDER_API_TOKEN in the environment to enable
// Bearer token authorization for the /query endpoint. If the env var is
// not set the server will start but the endpoint will be open (and a
// warning will be logged).
const EMBEDDER_API_TOKEN = process.env.EMBEDDER_API_TOKEN ?? '';
if (!EMBEDDER_API_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('EMBEDDER_API_TOKEN is not set; /query endpoint will be unprotected');
}

function requireApiToken(req: Request, res: Response, next: () => void) {
  if (!EMBEDDER_API_TOKEN) return next();
  const auth = String(req.headers.authorization ?? '');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'missing or invalid authorization header' });
  }
  const token = auth.slice(7).trim();
  if (token !== EMBEDDER_API_TOKEN) {
    return res.status(403).json({ error: 'forbidden' });
  }
  return next();
}

// Basic health
app.get('/', (_req: Request, res: Response) => res.json({ ok: true }));

/**
 * POST /query
 * Body: { url: string, queryEmbedding: number[], k?: number }
 * - downloads the file at url (expects a text file containing JSON.stringify(VectorStoreEntry[]))
 * - parses entries, upserts into the store, runs query, and returns results
 */
app.post('/query', requireApiToken, async (req: Request, res: Response) => {
  const body = req.body as { url?: string; queryEmbedding?: number[]; k?: number };
  if (!body?.url || !body?.queryEmbedding || !Array.isArray(body.queryEmbedding)) {
    return res.status(400).json({ error: 'missing required fields: url and queryEmbedding (array)' });
  }

  const { url, queryEmbedding, k = 10 } = body;
  try {
    // Try cache first
    let cached = await getCachedEntries(url);
    let entries: VectorStoreEntry[];
    if (cached) {
      // reset TTL
      await touchCache(url).catch(() => {});
      entries = cached.entries as VectorStoreEntry[];
    } else {
      const resp = await fetch(url);
      if (!resp.ok) return res.status(502).json({ error: `failed to fetch url: ${resp.status}` });
      const text = await resp.text();

      // The file is expected to contain JSON.stringified(VectorStoreEntry[])
      try {
        entries = JSON.parse(text) as VectorStoreEntry[];
        if (!Array.isArray(entries)) throw new Error('not an array');
      } catch (e) {
        return res.status(400).json({ error: 'failed to parse entries file as JSON array', details: String(e) });
      }

      // cache for future requests
      await setCachedEntries(url, entries).catch(() => {});
    }
    const deduplicatedByID = entries.reduce((acc, entry) => {
      if (entry.id && !acc.some(e => e.id === entry.id)) {
        acc.push(entry);
      }
      return acc;
    }, [] as VectorStoreEntry[]);
    const store = createSalesforceVectorStore();
    await store.upsert(deduplicatedByID);
    const results = await store.query(queryEmbedding, k);
    return res.json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: 'internal error', details: String(err) });
  }
});

app.get('/download', async (req: Request, res: Response) => {
  const pipe = await pipeline('embeddings', 'nomic-ai/nomic-embed-text-v1.5', {
    cache_dir: './.hf_cache'
  });
  //console.log('pipeline loaded', pipe.model, pipe.name, pipe.task);
  return res.status(200).json({ model: pipe.model.name || '', name: pipe.name || '', task: pipe.task || '' });
});
app.post('/embed', async (req: Request, res: Response) => {
  const body = req.body as { texts?: string[] };
  if (!body?.texts || !Array.isArray(body.texts) || body.texts.some(t => typeof t !== 'string')) {
    return res.status(400).json({ error: 'missing or invalid required field: texts (array of strings)' });
  }
  // Allocate pipeline
  const embedder = await pipeline('embeddings', 'nomic-ai/nomic-embed-text-v1.5');
  const { texts } = body;
  try {
    const entries = await embedder(texts, {});
    return res.json({ entries });
  } catch (err: any) {
    return res.status(500).json({ error: 'internal error', details: String(err) });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`embedder-api server listening on http://localhost:${port}`);
});

// Start hourly cleanup (runs in-process). This complements the standalone `cleanup-cache` script.
setInterval(() => {
  cleanupCacheOnce()
    .then(removed => {
      // eslint-disable-next-line no-console
      console.log(`hourly cache cleanup removed ${removed} files`);
    })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error('hourly cache cleanup failed', String(err));
    });
}, 1000 * 60 * 60);

/*
 * === server.ts ===
 */

// === cache.ts ===
// Created: 2025-09-03 00:00
// Purpose: File-system cache for fetched VectorStoreEntry arrays with TTL and cleanup helpers.

import fs from 'fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const CACHE_DIR = './tmp/embedder-api-cache';
export const TTL_MS = Number(process.env.EMBEDDER_CACHE_TTL_MS) || 24 * 60 * 60 * 1000; // 24 hours

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function cacheFileFor(url: string) {
  const h = crypto.createHash('sha256').update(url).digest('hex');
  return path.join(CACHE_DIR, `${h}.json`);
}

export async function getCachedEntries(url: string): Promise<{ entries: any[]; fetchedAt: number; expiresAt: number } | null> {
  await ensureCacheDir();
  const p = cacheFileFor(url);
  try {
    const txt = await fs.readFile(p, 'utf8');
    const obj = JSON.parse(txt) as { entries: any[]; fetchedAt: number; expiresAt: number };
    const now = Date.now();
    if (!obj || !Array.isArray(obj.entries) || typeof obj.expiresAt !== 'number') {
      // malformed -> delete
      await fs.unlink(p).catch(() => {});
      return null;
    }
    if (obj.expiresAt <= now) {
      // expired
      await fs.unlink(p).catch(() => {});
      return null;
    }
    return obj;
  } catch (e) {
    return null;
  }
}

export async function setCachedEntries(url: string, entries: any[]) {
  await ensureCacheDir();
  const p = cacheFileFor(url);
  const now = Date.now();
  const obj = { entries, fetchedAt: now, expiresAt: now + TTL_MS };
  const tmp = p + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(obj), 'utf8');
  await fs.rename(tmp, p);
}

export async function touchCache(url: string) {
  // reset the expiresAt timer on active cache
  const cached = await getCachedEntries(url);
  if (!cached) return false;
  console.log('cache exists', cached.fetchedAt, cached.expiresAt);
  await setCachedEntries(url, cached.entries);
  return true;
}

export async function cleanupCacheOnce(): Promise<number> {
  await ensureCacheDir();
  const files = await fs.readdir(CACHE_DIR).catch(() => []);
  const now = Date.now();
  let removed = 0;
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const p = path.join(CACHE_DIR, f);
    try {
      const txt = await fs.readFile(p, 'utf8');
      const obj = JSON.parse(txt) as { expiresAt?: number; fetchedAt?: number };
      if (!obj || typeof obj.expiresAt !== 'number' || obj.expiresAt <= now) {
        await fs.unlink(p).catch(() => {});
        removed += 1;
      }
    } catch (e) {
      await fs.unlink(p).catch(() => {});
      removed += 1;
    }
  }
  return removed;
}

/*
 * === cache.ts ===
 */

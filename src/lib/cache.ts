import { cache } from "react";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

// ---------------------------------------------------------------------------
// Cross-render, in-memory TTL cache.
// Survives React render boundaries so rapid back/forward navigation reuses
// recent data instead of re-fetching everything.
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown;
  ts: number;
}

const store = new Map<string, CacheEntry>();

/** Default TTL — entries older than this are evicted. */
const DEFAULT_TTL_MS = 30_000; // 30 seconds

function cacheGet(key: string, ttlMs: number = DEFAULT_TTL_MS): unknown | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > ttlMs) {
    store.delete(key);
    return undefined;
  }
  return entry.data;
}

function cacheSet(key: string, data: unknown): void {
  // Simple LRU-ish cap — keep memory bounded (one ticker page is ~20 entries).
  if (store.size > 500) {
    // O(n) eviction: find the oldest entry by timestamp without sorting.
    let oldestKey: string | null = null;
    let oldestTs = Infinity;
    for (const [k, v] of store) {
      if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
    }
    if (oldestKey) store.delete(oldestKey);
  }
  store.set(key, { data, ts: Date.now() });
}

// ---------------------------------------------------------------------------
// Public helper: cached fetch + JSON parse.
//
// Combines three layers:
//  1. Module-level TTL Map  → survives across renders (navigate back = instant)
//  2. React cache()          → deduplicates identical URLs within a single render
//  3. fetchWithRetry         → actual network call with retry + Next.js revalidate
//
// `ttlMs` controls how long the in-memory result is considered fresh.
// `revalidate` is passed through to Next.js fetch for HTTP-level caching.
// ---------------------------------------------------------------------------

export const cachedFetchJson = cache(
  async (url: string, opts?: { revalidate?: number; ttlMs?: number }) => {
    const { revalidate = 86400, ttlMs = DEFAULT_TTL_MS } = opts ?? {};

    const cached = cacheGet(url, ttlMs);
    if (cached !== undefined) return cached;

    const res = await fetchWithRetry(url, { revalidate });
    const json = await res.json();

    cacheSet(url, json);
    return json;
  }
);

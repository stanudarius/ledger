"use server"

import { FallbackProvider } from "@/lib/providers/fallback";

// --- Rate limiting & cache ---
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — symbols don't appear/disappear that fast
const MAX_CALLS_PER_WINDOW = 60;
const WINDOW_MS = 60_000; // 1 min

interface CacheEntry {
  result: boolean;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const callTimestamps: number[] = [];

function pruneOldCalls(now: number) {
  const cutoff = now - WINDOW_MS;
  while (callTimestamps.length > 0 && callTimestamps[0] < cutoff) {
    callTimestamps.shift();
  }
}

export async function validateTicker(symbol: string): Promise<boolean> {
  if (!symbol) return false;

  const key = symbol.toUpperCase();
  const now = Date.now();

  // 1. Cache hit?
  const cached = cache.get(key);
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.result;

  // 2. Rate limit check
  pruneOldCalls(now);
  if (callTimestamps.length >= MAX_CALLS_PER_WINDOW) {
    // Return the last known result if available, otherwise false
    return cached?.result ?? false;
  }

  // 3. Call the provider
  callTimestamps.push(now);
  const provider = new FallbackProvider();
  try {
    const quote = await provider.getQuote(key);
    const result = !!quote && typeof quote.currentPrice === "number" && quote.currentPrice > 0;
    cache.set(key, { result, ts: now });
    return result;
  } catch (_error) {
    // Don't cache failures — transient errors should be retried
    return false;
  }
}

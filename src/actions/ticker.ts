"use server"

import { FallbackProvider } from "@/lib/providers/fallback";

export async function validateTicker(symbol: string): Promise<boolean> {
  if (!symbol) return false;
  
  const provider = new FallbackProvider();
  try {
    const quote = await provider.getQuote(symbol.toUpperCase());
    return !!quote && typeof quote.currentPrice === "number" && quote.currentPrice > 0;
  } catch (_error) {
    return false;
  }
}

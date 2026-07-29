import type { Metrics, Quote, AnalystRatings } from "@/lib/providers";

export const DISCOVER_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMZN",
  "INTC", "CRM", "ORCL", "ADBE", "AVGO", "QCOM", "TXN", "IBM",
  "JPM", "BAC", "GS", "MS", "AXP", "C", "SCHW",
  "JNJ", "UNH", "PFE", "LLY", "MRK", "ABBV", "MRNA", "DHR",
  "WMT", "PG", "KO", "COST", "DIS", "MCD", "SBUX", "PYPL", "EBAY",
  "XOM", "CVX", "CAT", "GE", "UPS", "RTX", "LMT", "SLB",
  "VZ", "T", "NEE", "DUK",
  "HD", "NKE", "BA", "TSLA", "AMD", "NFLX",
] as const;

export const TICKER_SECTORS: Record<string, string> = {
  AAPL: "Tech", MSFT: "Tech", GOOGL: "Tech", META: "Tech", NVDA: "Tech", AMZN: "Consumer",
  INTC: "Tech", CRM: "Tech", ORCL: "Tech", ADBE: "Tech", AVGO: "Tech", QCOM: "Tech", TXN: "Tech", IBM: "Tech",
  JPM: "Financials", BAC: "Financials", GS: "Financials", MS: "Financials", AXP: "Financials", C: "Financials", SCHW: "Financials",
  JNJ: "Healthcare", UNH: "Healthcare", PFE: "Healthcare", LLY: "Healthcare", MRK: "Healthcare", ABBV: "Healthcare", MRNA: "Healthcare", DHR: "Healthcare",
  WMT: "Consumer", PG: "Consumer", KO: "Consumer", COST: "Consumer", DIS: "Consumer", MCD: "Consumer", SBUX: "Consumer", PYPL: "Consumer", EBAY: "Consumer",
  XOM: "Energy", CVX: "Energy", CAT: "Industrial", GE: "Industrial", UPS: "Industrial", RTX: "Industrial", LMT: "Industrial", SLB: "Energy",
  VZ: "Telecom", T: "Telecom", NEE: "Utilities", DUK: "Utilities",
  HD: "Consumer", NKE: "Consumer", BA: "Industrial", TSLA: "Consumer", AMD: "Tech", NFLX: "Consumer",
};

// ── Types ─────────────────────────────────────────────────────────
interface StockScores {
  value: number;
  growth: number;
  quality: number;
  composite: number;
}

export interface ScoredStock {
  symbol: string;
  companyName: string;
  sector: string;
  quote: Quote;
  metrics: Metrics;
  ratings: AnalystRatings | null;
  scores: StockScores;
  upside: number | null;
}

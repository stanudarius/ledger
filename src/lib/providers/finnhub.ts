import { cachedFetchJson } from "@/lib/cache";
import {
  DataProvider,
  Quote,
  CompanyProfile,
  Metrics,
  RevenueSegment,
  IncomeStatementPeriod,
  BalanceSheet,
  CashFlow,
  Ownership,
  PriceHistoryPoint,
  EarningsHistoryPeriod,
  AnalystRatings,
  ExecutiveCompensation,
  StockSplit,
  InsiderTrade,
  UpcomingEarnings,
  Dividend,
  normalizeExchange,
} from "./index";

export class FinnhubProvider implements DataProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY;
  }

  private hasValidKey(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== "";
  }

  private url(path: string, params: Record<string, string> = {}): string {
    const qs = new URLSearchParams({ ...params, token: this.apiKey! }).toString();
    return `https://finnhub.io/api/v1${path}?${qs}`;
  }

  async getQuote(symbol: string): Promise<Quote> {
    if (!this.hasValidKey()) throw new Error("FINNHUB_API_KEY not configured");
    const data = await cachedFetchJson(this.url("/quote", { symbol }), { revalidate: 60 });
    if (!data.c) throw new Error(`No quote data for ${symbol}`);
    const change = data.c - data.pc;
    const pct = data.pc ? (change / data.pc) * 100 : 0;
    return {
      currentPrice: data.c,
      changeAmount: Math.abs(change),
      changePercentage: Math.abs(pct),
      isPositive: pct >= 0,
      open: data.o ?? data.pc,
      high: data.h ?? data.c,
      low: data.l ?? data.c,
      previousClose: data.pc,
      volume: data.v ?? 0,
      week52High: data.c,
      week52Low: data.c,
    };
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    if (!this.hasValidKey()) throw new Error("FINNHUB_API_KEY not configured");
    const data = await cachedFetchJson(this.url("/stock/profile2", { symbol }));
    if (!data?.name) throw new Error(`No profile data for ${symbol}`);
    return {
      companyName: data.name,
      description: "",
      sector: data.finnhubIndustry || "N/A",
      industry: data.finnhubIndustry || "N/A",
      exchange: normalizeExchange(data.exchange || "N/A"),
      ceoName: "",
      website: data.weburl ?? "",
      ipoDate: data.ipo ?? "N/A",
      country: data.country ?? "N/A",
    };
  }

  async getMetrics(symbol: string): Promise<Metrics> {
    if (!this.hasValidKey()) throw new Error("FINNHUB_API_KEY not configured");
    const data = await cachedFetchJson(this.url("/stock/metric", { symbol, metric: "all" }));
    if (!data?.metric) throw new Error(`No metrics data for ${symbol}`);
    const m = data.metric;
    return {
      marketCap: (m.marketCapitalization ?? 0) * 1_000_000,
      peRatio: m.peExclExtraTTM ?? 0,
      pbRatio: m.pbAnnual ?? 0,
      dividendYield: (m.dividendYieldIndicatedAnnual ?? 0) / 100,
      beta: m.beta ?? 1.0,
      roe: m.roeTTM ?? 0,
      roa: m.roaTTM ?? 0,
      eps: m.epsTTM ?? 0,
      revenueGrowthYoy: m.revenueGrowthTTMYoy ?? 0,
    };
  }

  async getRevenueSegments(_symbol: string): Promise<RevenueSegment[]> {
    throw new Error("Not implemented in Finnhub");
  }

  async getIncomeStatementHistory(_symbol: string): Promise<IncomeStatementPeriod[]> {
    throw new Error("Not implemented in Finnhub");
  }

  async getBalanceSheet(_symbol: string): Promise<BalanceSheet> {
    throw new Error("Finnhub free tier does not support balance sheet data");
  }

  async getCashFlow(_symbol: string): Promise<CashFlow> {
    throw new Error("Finnhub free tier does not support cash flow data");
  }

  async getOwnership(_symbol: string): Promise<Ownership> {
    throw new Error("Not implemented in Finnhub");
  }

  async getPriceHistory(
    symbol: string,
    range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" = "1Y"
  ): Promise<PriceHistoryPoint[]> {
    if (!this.hasValidKey()) throw new Error("FINNHUB_API_KEY not configured");
    const now = Math.floor(Date.now() / 1000);
    const resolutions: Record<string, string> = {
      "1D": "5",
      "1W": "15",
      "1M": "60",
      "3M": "D",
      "1Y": "D",
      "5Y": "W",
    };
    const lookbacks: Record<string, number> = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
      "5Y": 1825,
    };
    const resolution = resolutions[range] ?? "D";
    const from = now - (lookbacks[range] ?? 365) * 86400;

    const data = await cachedFetchJson(
      this.url("/stock/candle", {
        symbol,
        resolution,
        from: from.toString(),
        to: now.toString(),
      }),
      { revalidate: 60 }
    );
    if (data.s === "ok" && Array.isArray(data.t)) {
      return data.t.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split("T")[0],
        close: data.c[i],
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        volume: data.v[i],
      }));
    }
    return [];
  }

  async getEarningsHistory(symbol: string): Promise<EarningsHistoryPeriod[]> {
    if (!this.hasValidKey()) throw new Error("FINNHUB_API_KEY not configured");
    const data = await cachedFetchJson(this.url("/stock/earnings", { symbol }));
    if (Array.isArray(data)) {
      return data.slice(0, 8).map((d: {
        period: string; year: number; quarter: number;
        estimate: number; actual: number; surprise: number; surprisePercent: number;
      }) => ({
        period: d.period ?? `Q${d.quarter} ${d.year}`,
        estimatedEPS: d.estimate ?? 0,
        actualEPS: d.actual ?? 0,
        surprise: d.surprisePercent ?? 0,
        revenueEstimate: 0,
        actualRevenue: 0,
      }));
    }
    return [];
  }

  async getAnalystRatings(symbol: string): Promise<AnalystRatings> {
    if (!this.hasValidKey()) throw new Error("FINNHUB_API_KEY not configured");
    const data = await cachedFetchJson(this.url("/stock/recommendation", { symbol }));
    if (Array.isArray(data) && data.length > 0) {
      const latest = data[0];
      return {
        strongBuy: latest.strongBuy ?? 0,
        buy: latest.buy ?? 0,
        hold: latest.hold ?? 0,
        sell: latest.sell ?? 0,
        strongSell: latest.strongSell ?? 0,
        targetHigh: 0,
        targetLow: 0,
        targetMean: 0,
        targetMedian: 0,
      };
    }
    return { buy: 0, hold: 0, sell: 0, strongBuy: 0, strongSell: 0, targetHigh: 0, targetLow: 0, targetMean: 0, targetMedian: 0 };
  }

  async getExecutiveCompensation(_symbol: string): Promise<ExecutiveCompensation | null> {
    throw new Error("Not implemented in Finnhub");
  }

  async getStockSplits(_symbol: string): Promise<StockSplit[]> {
    throw new Error("Not implemented in Finnhub");
  }

  async getInsiderTrades(_symbol: string): Promise<InsiderTrade[]> {
    throw new Error("Not implemented in Finnhub");
  }

  async getUpcomingEarnings(_symbol: string): Promise<UpcomingEarnings | null> {
    return null;
  }

  async getDividends(_symbol: string): Promise<Dividend[]> {
    return [];
  }
}

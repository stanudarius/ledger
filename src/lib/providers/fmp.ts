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

const BASE = "https://financialmodelingprep.com/stable";

export class FMPProvider implements DataProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.FMP_API_KEY;
  }

  private hasValidKey(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== "";
  }

  private url(endpoint: string, params: Record<string, string> = {}): string {
    const qs = new URLSearchParams({ apikey: this.apiKey!, ...params }).toString();
    return `${BASE}/${endpoint}?${qs}`;
  }

  async getQuote(symbol: string): Promise<Quote> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("quote", { symbol }), { revalidate: 60 });
    if (!data?.length) throw new Error(`No quote data for ${symbol}`);
    const q = data[0];
    return {
      currentPrice: q.price ?? 0,
      changeAmount: Math.abs(q.change ?? 0),
      changePercentage: Math.abs(q.changePercentage ?? 0),
      isPositive: (q.changePercentage ?? 0) >= 0,
      open: q.open ?? q.previousClose ?? 0,
      high: q.dayHigh ?? q.price ?? 0,
      low: q.dayLow ?? q.price ?? 0,
      previousClose: q.previousClose ?? 0,
      volume: q.volume ?? 0,
      week52High: q.yearHigh ?? q.price ?? 0,
      week52Low: q.yearLow ?? q.price ?? 0,
    };
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("profile", { symbol }));
    if (!data?.length) throw new Error(`No profile data for ${symbol}`);
    const p = data[0];
    return {
      companyName: p.companyName ?? `${symbol} Inc.`,
      description: p.description ?? "",
      sector: p.sector ?? p.industry ?? "N/A",
      industry: p.industry ?? "N/A",
      exchange: normalizeExchange(p.exchange ?? p.exchangeFullName ?? "N/A"),
      ceoName: p.ceo ?? "N/A",
      website: p.website ?? "",
      ipoDate: p.ipoDate ?? "N/A",
      country: p.country ?? "N/A",
    };
  }

  async getMetrics(symbol: string): Promise<Metrics> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");

    const [incomeData, balanceData, profileData, quoteData] = await Promise.all([
      cachedFetchJson(this.url("income-statement", { symbol, limit: "5" })),
      cachedFetchJson(this.url("balance-sheet-statement", { symbol, limit: "1" })),
      cachedFetchJson(this.url("profile", { symbol })),
      cachedFetchJson(this.url("quote", { symbol }), { revalidate: 60, ttlMs: 60_000 }),
    ]);

    if (!profileData?.length && !quoteData?.length) {
      throw new Error(`No metrics data for ${symbol}`);
    }

    const p = profileData?.[0] ?? {};
    const q = quoteData?.[0] ?? {};

    let latestIncome: Record<string, unknown> = {};
    let prevIncome: Record<string, unknown> = {};
    if (Array.isArray(incomeData) && incomeData.length >= 2) {
      latestIncome = incomeData[0];
      prevIncome = incomeData[1];
    } else if (Array.isArray(incomeData) && incomeData.length === 1) {
      latestIncome = incomeData[0];
    }

    let balance: Record<string, unknown> = {};
    if (Array.isArray(balanceData)) balance = balanceData[0] ?? {};

    return FMPProvider.computeMetrics({
      marketCap: p.marketCap ?? 0,
      beta: p.beta ?? 1.0,
      lastDividend: p.lastDiv ?? p.lastDividend ?? 0,
      price: q.price ?? 0,
      revenue: (latestIncome.revenue as number) ?? 0,
      netIncome: (latestIncome.netIncome as number) ?? 0,
      prevRevenue: (prevIncome.revenue as number) ?? 0,
      equity: (balance.totalStockholdersEquity as number) ?? (balance.totalEquity as number) ?? 0,
      totalAssets: (balance.totalAssets as number) ?? 0,
      eps: (latestIncome.eps as number) ?? (latestIncome.epsDiluted as number) ?? 0,
      sharesOut: (latestIncome.weightedAverageShsOut as number) ?? 0,
    });
  }

  /** Pure computation — no HTTP. Used by getMetricsFromData and getMetrics internally. */
  private static computeMetrics(raw: {
    marketCap: number; beta: number; lastDividend: number;
    price: number; revenue: number; netIncome: number; prevRevenue: number;
    equity: number; totalAssets: number; eps: number; sharesOut: number;
  }): Metrics {
    const { marketCap, beta, lastDividend, price, revenue, netIncome, prevRevenue, equity, totalAssets, eps, sharesOut } = raw;
    return {
      marketCap,
      peRatio: netIncome > 0 ? marketCap / netIncome : 0,
      pbRatio: equity > 0 ? marketCap / equity : 0,
      dividendYield: price > 0 ? lastDividend / price : 0,
      beta,
      roe: equity > 0 ? (netIncome / equity) * 100 : 0,
      roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      eps: sharesOut > 0 ? netIncome / sharesOut : eps,
      revenueGrowthYoy: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
    };
  }

  getMetricsFromData(data: {
    profile?: CompanyProfile;
    quote?: Quote;
    latestIncome?: IncomeStatementPeriod;
    prevIncome?: IncomeStatementPeriod;
    balance?: BalanceSheet;
    marketCap?: number;
    beta?: number;
    lastDividend?: number;
    sharesOut?: number;
  }): Metrics {
    return FMPProvider.computeMetrics({
      marketCap: data.marketCap ?? 0,
      beta: data.beta ?? 1.0,
      lastDividend: data.lastDividend ?? 0,
      price: data.quote?.currentPrice ?? 0,
      revenue: data.latestIncome?.revenue ?? 0,
      netIncome: data.latestIncome?.netIncome ?? 0,
      prevRevenue: data.prevIncome?.revenue ?? 0,
      equity: data.balance?.equity ?? 0,
      totalAssets: data.balance?.totalAssets ?? 0,
      eps: data.latestIncome?.eps ?? 0,
      sharesOut: data.sharesOut ?? 0,
    });
  }



  async getRevenueSegments(symbol: string): Promise<RevenueSegment[]> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("revenue-product-segmentation", { symbol, structure: "flat" }));
    if (Array.isArray(data) && data.length > 0) {
      const latest = data[0];
      const segments = latest.data as Record<string, number> | undefined;
      if (segments) {
        return Object.entries(segments).map(([label, value]) => ({ label, value }));
      }
    }
    throw new Error(`No revenue segment data for ${symbol}`);
  }

  async getIncomeStatementHistory(symbol: string): Promise<IncomeStatementPeriod[]> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("income-statement", { symbol, limit: "5" }));
    if (!data?.length) throw new Error(`No income data for ${symbol}`);
    return data.slice(0, 5).reverse().map((d: Record<string, unknown>) => ({
      period: String(d.date ?? d.fiscalYear ?? "").slice(0, 4) || "N/A",
      revenue: (d.revenue as number) ?? 0,
      grossProfit: (d.grossProfit as number) ?? 0,
      operatingIncome: (d.operatingIncome as number) ?? 0,
      operatingExpense: (d.operatingExpenses as number) ?? 0,
      netIncome: (d.netIncome as number) ?? 0,
      netMargin: d.revenue ? +(((d.netIncome as number) / (d.revenue as number)) * 100).toFixed(1) : 0,
      eps: (d.eps as number) ?? (d.epsDiluted as number) ?? 0,
      ebitda: (d.ebitda as number) ?? 0,
    }));
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("balance-sheet-statement", { symbol, limit: "1" }));
    if (!data?.length) throw new Error(`No balance sheet data for ${symbol}`);
    const b = data[0];
    return {
      cash: b.cashAndCashEquivalents ?? b.cashAndShortTermInvestments ?? 0,
      totalAssets: b.totalAssets ?? 0,
      totalLiabilities: b.totalLiabilities ?? 0,
      equity: b.totalStockholdersEquity ?? b.totalEquity ?? 0,
      debt: b.totalDebt ?? b.longTermDebt ?? 0,
      assetsBreakdown: [
        { label: "Current Assets", value: b.totalCurrentAssets ?? 0 },
        { label: "PP&E", value: b.propertyPlantEquipmentNet ?? 0 },
        { label: "Other Non-Current", value: Math.max(0, (b.totalNonCurrentAssets ?? 0) - (b.propertyPlantEquipmentNet ?? 0)) },
      ].filter((a) => a.value > 0),
      liabilitiesBreakdown: [
        { label: "Current Liabilities", value: b.totalCurrentLiabilities ?? 0 },
        { label: "Long-Term Debt", value: b.longTermDebt ?? 0 },
        { label: "Other Non-Current", value: Math.max(0, (b.totalNonCurrentLiabilities ?? 0) - (b.longTermDebt ?? 0)) },
      ].filter((l) => l.value > 0),
    };
  }

  async getCashFlow(symbol: string): Promise<CashFlow> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("cash-flow-statement", { symbol, limit: "1" }));
    if (!data?.length) throw new Error(`No cash flow data for ${symbol}`);
    const c = data[0];
    return {
      operating: c.operatingCashFlow ?? c.netCashProvidedByOperatingActivities ?? 0,
      investing: c.netCashProvidedByInvestingActivities ?? 0,
      financing: c.netCashProvidedByFinancingActivities ?? 0,
      netChange: c.netChangeInCash ?? 0,
      freeCashFlow: c.freeCashFlow ?? 0,
    };
  }

  async getOwnership(_symbol: string): Promise<Ownership> {
    throw new Error("Not implemented in FMP");
  }

  async getPriceHistory(
    _symbol: string,
    _range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" = "1Y"
  ): Promise<PriceHistoryPoint[]> {
    throw new Error("Not implemented in FMP");
  }

  async getEarningsHistory(_symbol: string): Promise<EarningsHistoryPeriod[]> {
    throw new Error("Not implemented in FMP");
  }

  async getAnalystRatings(symbol: string): Promise<AnalystRatings> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("analyst-estimates", { symbol, period: "annual" }));
    if (Array.isArray(data) && data.length > 0) {
      const latest = data[0];
      // FMP's analyst-estimates returns price targets but NOT the buy/sell/hold
      // breakdown.  If those fields are missing the fallback should keep trying
      // other providers that do have them (Finnhub, Yahoo).
      const hasBreakdown =
        latest.strongBuy !== undefined || latest.buy !== undefined ||
        latest.hold !== undefined || latest.sell !== undefined ||
        latest.strongSell !== undefined;
      if (!hasBreakdown) throw new Error(`No analyst breakdown for ${symbol} (FMP)`);

      return {
        strongBuy: latest.strongBuy ?? 0,
        buy: latest.buy ?? 0,
        hold: latest.hold ?? 0,
        sell: latest.sell ?? 0,
        strongSell: latest.strongSell ?? 0,
        targetHigh: latest.targetHighPrice ?? latest.estimatedRevenueHigh ?? 0,
        targetLow: latest.targetLowPrice ?? latest.estimatedRevenueLow ?? 0,
        targetMean: latest.targetConsensus ?? latest.estimatedRevenueAvg ?? 0,
        targetMedian: latest.targetMedian ?? 0,
      };
    }
    throw new Error(`No analyst ratings data for ${symbol}`);
  }

  async getExecutiveCompensation(symbol: string): Promise<ExecutiveCompensation | null> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("key-executives", { symbol }));
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const ceo = data.find(exec => exec.title?.toLowerCase().includes("ceo") || exec.title?.toLowerCase().includes("chief executive")) || data[0];
    
    return {
      name: ceo.name ?? "N/A",
      title: ceo.title ?? "N/A",
      salary: ceo.pay ?? 0,
      bonus: 0,
      stockAwards: 0,
      total: ceo.pay ?? 0,
      year: String(new Date().getFullYear()),
    };
  }

  async getStockSplits(symbol: string): Promise<StockSplit[]> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("historical-price-full/stock_split/" + symbol));
    if (!data || !data.historical) return [];
    return data.historical.slice(0, 5).map((s: Record<string, unknown>) => ({
      date: s.date as string,
      numerator: s.numerator as number,
      denominator: s.denominator as number,
    }));
  }

  async getInsiderTrades(symbol: string): Promise<InsiderTrade[]> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("insider-trading", { symbol, limit: "10" }));
    if (!Array.isArray(data)) return [];
    return data.map(trade => {
      const typeStr = (trade.transactionType || trade.acquistionOrDisposition || "").toLowerCase();
      const isBuy = typeStr.includes("buy") || typeStr.includes("p-purchase") || typeStr === "p" || typeStr === "a";
      return {
        officerName: trade.reportingName ?? "N/A",
        officerTitle: trade.typeOfOwner ?? "N/A",
        transactionType: isBuy ? "Purchase" : "Sale",
        shares: trade.securitiesTransacted ?? 0,
        transactionDate: trade.transactionDate ?? "N/A",
      };
    });
  }

  async getUpcomingEarnings(symbol: string): Promise<UpcomingEarnings | null> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url("earning_calendar", { symbol }));
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const now = new Date().toISOString().slice(0, 10);
    const upcoming = [...data].reverse().find(e => e.date && e.date >= now);
    if (!upcoming) return null;

    return {
      date: upcoming.date,
      revenueEstimate: upcoming.revenueEstimated ?? 0,
      epsEstimate: upcoming.epsEstimated ?? 0,
    };
  }

  async getDividends(symbol: string): Promise<Dividend[]> {
    if (!this.hasValidKey()) throw new Error("FMP_API_KEY not configured");
    const data = await cachedFetchJson(this.url(`historical-price-full/stock_dividend/${symbol}`));
    if (!data || !data.historical) return [];
    return data.historical.slice(0, 20).map((d: Record<string, number>) => ({
      date: d.date,
      amount: d.adjDividend,
    }));
  }
}

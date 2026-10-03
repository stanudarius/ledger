import { cache } from "react";
import {
  DataProvider,
  Quote,
  CompanyProfile,
  Metrics,
  IncomeStatementPeriod,
  BalanceSheet,
  CashFlow,
  Ownership,
  OwnershipHolder,
  PriceHistoryPoint,
  EarningsHistoryPeriod,
  AnalystRatings,
  StockSplit,
  InsiderTrade,
  UpcomingEarnings,
  Dividend,
} from "./index";



const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const SUMMARY_BASE = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "1y", interval: "1d" },
  "1Y": { range: "2y", interval: "1d" },
  "5Y": { range: "6y", interval: "1wk" },
};



let cachedCrumb: { cookie: string; crumb: string } | null = null;
let crumbTs = 0;
let crumbPromise: Promise<{ cookie: string; crumb: string } | null> | null = null;

async function getYahooCrumb(): Promise<{ cookie: string; crumb: string } | null> {
  if (cachedCrumb && Date.now() - crumbTs < 300_000) return cachedCrumb;
  
  if (crumbPromise) return crumbPromise;

  crumbPromise = (async () => {
    try {
      const cookieRes = await fetch("https://fc.yahoo.com/", { headers: { "User-Agent": UA }, next: { revalidate: 300 } });
    const cookie = cookieRes.headers.get("set-cookie")?.split(";")?.[0];
    if (!cookie) return cachedCrumb;
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { Cookie: cookie, "User-Agent": UA },
      next: { revalidate: 300 }
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.includes("Too Many") || crumb.length > 50) return cachedCrumb;
    cachedCrumb = { cookie, crumb };
    crumbTs = Date.now();
    return cachedCrumb;
    } catch {
      return cachedCrumb;
    } finally {
      crumbPromise = null;
    }
  })();

  return crumbPromise;
}

async function fetchSummary(symbol: string, modules: string[]): Promise<Record<string, unknown> | null> {
  const auth = await getYahooCrumb();
  const headers: Record<string, string> = { "User-Agent": UA };
  const moduleStr = modules.join("%2C");
  let url: string;

  if (auth) {
    headers["Cookie"] = auth.cookie;
    url = `${SUMMARY_BASE}/${symbol}?modules=${moduleStr}&crumb=${auth.crumb}`;
  } else {
    url = `${SUMMARY_BASE}/${symbol}?modules=${moduleStr}`;
  }

  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.quoteSummary?.result?.[0] ?? null;
}



function raw(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (v && typeof v === "object" && "raw" in v) return raw((v as { raw: unknown }).raw);
  return 0;
}

function fmt(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "fmt" in v) return (v as { fmt: string }).fmt ?? "";
  return "";
}

function mapOwnershipList(list: unknown[]): OwnershipHolder[] {
  return (list ?? []).slice(0, 5).map((item) => {
    const h = item as Record<string, unknown>;
    const orgName = typeof h.organization === "string" ? h.organization : "Unknown";
    return {
      name: orgName,
      shares: raw(h.position),
      percentage: raw(h.pctHeld),
    };
  });
}



const fetchAllModules = cache(async (symbol: string) => {
  return fetchSummary(symbol, [
    "price",
    "summaryDetail",
    "assetProfile",
    "summaryProfile",
    "defaultKeyStatistics",
    "financialData",
    "institutionOwnership",
    "fundOwnership",
    "earningsHistory",
    "recommendationTrend",
    "insiderTransactions",
    "calendarEvents",
  ]);
});

const ANNUAL_TIMESERIES_TYPES = [
  "annualTotalRevenue", "annualGrossProfit", "annualOperatingIncome", "annualEBITDA",
  "annualNetIncome", "annualTotalOperatingExpenses", "annualOperatingExpense", "annualDilutedEPS",
  "annualTotalAssets", "annualTotalLiabilitiesNetMinorityInterest", "annualStockholdersEquity",
  "annualCashAndCashEquivalents", "annualCurrentAssets", "annualCurrentLiabilities",
  "annualLongTermDebt", "annualTotalDebt", "annualNetPropertyPlantAndEquipment",
  "annualOrdinarySharesNumber", "annualOperatingCashFlow", "annualInvestingCashFlow",
  "annualFinancingCashFlow", "annualCapitalExpenditure", "annualFreeCashFlow", "annualChangesInCash",
];

const fetchTimeseries = cache(async (symbol: string, typesKey: string) => {
  const url = `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}?symbol=${symbol}&type=${typesKey}&period1=0&period2=1893456000`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } });
  if (!res.ok) return {};
  const data = await res.json();
  const result = data?.timeseries?.result;
  if (!Array.isArray(result)) return {};

  const byYear: Record<string, Record<string, number>> = {};
  // Track the latest asOfDate seen for each (year,type) so intra-year
  // revisions/quarterly filings don't non-deterministically overwrite the
  // annual report — we keep the most recent record per year/type.
  const latestAsOf: Record<string, Record<string, string>> = {};
  for (const item of result) {
    const type = item.meta?.type?.[0];
    if (!type || !Array.isArray(item[type])) continue;
    for (const point of item[type]) {
      const year = point.asOfDate?.substring(0, 4);
      if (!year) continue;
      const asOf: string = point.asOfDate ?? "";
      if (!byYear[year]) { byYear[year] = {}; latestAsOf[year] = {}; }
      const prev = latestAsOf[year][type];
      if (prev === undefined || asOf >= prev) {
        byYear[year][type] = raw(point.reportedValue);
        latestAsOf[year][type] = asOf;
      }
    }
  }
  return byYear;
});

const getAnnualTimeseries = cache(async (symbol: string) =>
  fetchTimeseries(symbol, ANNUAL_TIMESERIES_TYPES.join(",")),
);

async function fetchLatestTimeseriesValue(symbol: string, type: string): Promise<number> {
  const params = new URLSearchParams({ symbol, type, period1: "0", period2: "1893456000" });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}?${params}`,
      { headers: { "User-Agent": UA }, cache: "no-store", signal: controller.signal },
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const item = data?.timeseries?.result?.find(
      (entry: Record<string, unknown>) => ((entry.meta as { type?: string[] } | undefined)?.type?.[0]) === type,
    ) as Record<string, unknown> | undefined;
    const points = item?.[type];
    if (!Array.isArray(points)) return 0;
    const latest = [...points].sort((a, b) =>
      String((a as Record<string, unknown>).asOfDate ?? "").localeCompare(String((b as Record<string, unknown>).asOfDate ?? "")),
    ).at(-1) as Record<string, unknown> | undefined;
    return raw(latest?.reportedValue);
  } finally {
    clearTimeout(timeout);
  }
}

export class YahooProvider implements DataProvider {


  async getQuote(symbol: string): Promise<Quote> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no quote for ${symbol}`);
    const p = result.price as Record<string, unknown>;
    const sd = result.summaryDetail as Record<string, unknown> | undefined;
    return {
      currentPrice: raw(p?.regularMarketPrice),
      changeAmount: raw(p?.regularMarketChange),
      changePercentage: raw(p?.regularMarketChangePercent) * 100,
      isPositive: raw(p?.regularMarketChange) >= 0,
      open: raw(p?.regularMarketOpen),
      high: raw(p?.regularMarketDayHigh),
      low: raw(p?.regularMarketDayLow),
      volume: raw(p?.regularMarketVolume),
      week52High: raw(sd?.fiftyTwoWeekHigh),
      week52Low: raw(sd?.fiftyTwoWeekLow),
    };
  }

  async getPriceHistory(
    symbol: string,
    range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" = "1Y"
  ): Promise<PriceHistoryPoint[]> {
    const { range: yRange, interval } = RANGE_MAP[range] ?? RANGE_MAP["1Y"];
    const url = `${CHART_BASE}/${symbol}?range=${yRange}&interval=${interval}`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Yahoo: HTTP ${res.status} for price history`);
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) throw new Error(`Yahoo: Invalid price history for ${symbol}`);
    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0];
    if (!quote || !timestamps.length) return [];
    return timestamps
      .map((t, i) => ({
        date: new Date(t * 1000).toISOString().split("T")[0],
        close: quote.close?.[i] ?? 0,
        open: quote.open?.[i] ?? 0,
        high: quote.high?.[i] ?? 0,
        low: quote.low?.[i] ?? 0,
        volume: quote.volume?.[i] ?? 0,
      }))
      .filter((p) => p.close > 0);
  }



  async getProfile(symbol: string): Promise<CompanyProfile> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no profile for ${symbol}`);
    const p = (result.assetProfile ?? result.summaryProfile) as Record<string, unknown>;
    return {
      companyName: (p?.longName as string) ?? (p?.shortName as string) ?? symbol,
      description: (p?.longBusinessSummary as string) ?? "",
      sector: (p?.sector as string) ?? "N/A",
      industry: (p?.industry as string) ?? "N/A",
      ceoName: (() => {
        const officers = p?.companyOfficers as Array<Record<string, unknown>> | undefined;
        return (officers?.[0]?.name as string) ?? "N/A";
      })(),
      website: (p?.website as string) ?? "",
      country: (p?.country as string) ?? "N/A",
    };
  }

  async getMetrics(symbol: string): Promise<Metrics> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no metrics for ${symbol}`);
    const modules = result;
    const sd = (modules.summaryDetail ?? {}) as Record<string, unknown>;
    const ks = (modules.defaultKeyStatistics ?? {}) as Record<string, unknown>;
    const fd = (modules.financialData ?? {}) as Record<string, unknown>;
    const pr = (modules.price ?? {}) as Record<string, unknown>;
    const price = raw(pr?.regularMarketPrice);
    let sharesOut = raw(sd?.sharesOutstanding) || raw(ks?.sharesOutstanding) || raw(pr?.sharesOutstanding) || raw(ks?.impliedSharesOutstanding) || raw(fd?.sharesOutstanding) || raw(sd?.floatShares);
    let marketCap = raw(sd?.marketCap) || raw(pr?.marketCap) || raw(ks?.marketCap) || (sharesOut > 0 && price > 0 ? sharesOut * price : 0);

    if (!(marketCap > 0)) {
      try {
        marketCap = await fetchLatestTimeseriesValue(symbol, "trailingMarketCap");
        if (sharesOut === 0) sharesOut = await fetchLatestTimeseriesValue(symbol, "annualOrdinarySharesNumber");
      } catch {}
      if (!(marketCap > 0) && sharesOut > 0 && price > 0) marketCap = sharesOut * price;
    }

    let roe = raw(fd?.returnOnEquity) * 100;
    let pbRatio = raw(ks?.priceToBook);
    
    if (roe === 0 || pbRatio === 0 || (marketCap === 0 && price > 0)) {
      try {
        const bs = await this.getBalanceSheet(symbol);
        const is = await this.getIncomeStatementHistory(symbol);
        if (bs.equity > 0) {
          if (roe === 0 && is.length > 0) roe = (is[is.length - 1].netIncome / bs.equity) * 100;
          if (pbRatio === 0) pbRatio = marketCap / bs.equity;
        }
        // Backfill marketCap from balance-sheet shares outstanding
        if (marketCap === 0 && bs.sharesOutstanding > 0 && price > 0) {
          marketCap = bs.sharesOutstanding * price;
        }
      } catch {}
    }

    if (marketCap === 0 && price > 0) {
      console.warn(`getMetrics: marketCap is 0 for ${symbol} despite price=${price} — all data sources returned 0`);
    }

    const reportedPe = raw(sd?.trailingPE);
    const trailingEps = raw(ks?.trailingEps);

    return {
      marketCap,
      // Negative EPS does not produce a meaningful P/E; only derive one for positive EPS.
      peRatio: reportedPe > 0 ? reportedPe : price > 0 && trailingEps > 0 ? price / trailingEps : 0,
      pbRatio,
      dividendYield: raw(sd?.dividendYield),
      beta: raw(sd?.beta),
      roe,
      roa: raw(fd?.returnOnAssets) * 100,
      eps: trailingEps,
      revenueGrowthYoy: raw(fd?.revenueGrowth) * 100,
    };
  }

  async getIncomeStatementHistory(symbol: string): Promise<IncomeStatementPeriod[]> {
    const byYear = await getAnnualTimeseries(symbol);
    // Contract: ascending by period (oldest first) so income[last] is the latest year.
    const years = Object.keys(byYear).sort().slice(-5);
    if (!years.length) throw new Error(`Yahoo: no income history for ${symbol}`);
    
    return years.map(year => {
      const d = byYear[year];
      const revenue = d.annualTotalRevenue ?? 0;
      const netIncome = d.annualNetIncome ?? 0;
      return {
        period: year,
        revenue,
        grossProfit: d.annualGrossProfit ?? 0,
        operatingIncome: d.annualOperatingIncome ?? 0,
        operatingExpense: d.annualTotalOperatingExpenses ?? d.annualOperatingExpense ?? 0,
        netIncome,
        netMargin: revenue > 0 ? +((netIncome / revenue) * 100).toFixed(1) : 0,
        eps: d.annualDilutedEPS ?? 0,
        ebitda: d.annualEBITDA ?? 0,
      };
    });
  }

  async getBalanceSheet(symbol: string): Promise<BalanceSheet> {
    const byYear = await getAnnualTimeseries(symbol);
    const year = Object.keys(byYear).sort().reverse()[0];
    if (!year) throw new Error(`Yahoo: no balance sheet for ${symbol}`);
    const b = byYear[year];
    
    const currentAssets = b.annualCurrentAssets ?? 0;
    const totalAssets = b.annualTotalAssets ?? 0;
    const ppe = b.annualNetPropertyPlantAndEquipment ?? 0;
    const currentLiabilities = b.annualCurrentLiabilities ?? 0;
    const totalLiabilities = b.annualTotalLiabilitiesNetMinorityInterest ?? 0;
    const longTermDebt = b.annualLongTermDebt ?? 0;
    const totalDebt = b.annualTotalDebt ?? longTermDebt;
    
    return {
      cash: b.annualCashAndCashEquivalents ?? 0,
      totalAssets,
      totalLiabilities,
      equity: b.annualStockholdersEquity ?? 0,
      debt: totalDebt,
      sharesOutstanding: b.annualOrdinarySharesNumber ?? 0,
      assetsBreakdown: [
        { label: "Current Assets", value: currentAssets },
        { label: "PP&E", value: ppe },
        { label: "Other Non-Current", value: Math.max(0, totalAssets - currentAssets - ppe) },
      ].filter((a) => a.value > 0),
      liabilitiesBreakdown: [
        { label: "Current Liabilities", value: currentLiabilities },
        { label: "Long-Term Debt", value: longTermDebt },
        { label: "Other Non-Current", value: Math.max(0, totalLiabilities - currentLiabilities - longTermDebt) },
      ].filter((l) => l.value > 0),
    };
  }

  async getCashFlow(symbol: string): Promise<CashFlow> {
    const byYear = await getAnnualTimeseries(symbol);
    const year = Object.keys(byYear).sort().reverse()[0];
    if (!year) throw new Error(`Yahoo: no cash flow for ${symbol}`);
    const c = byYear[year];
    return {
      operating: c.annualOperatingCashFlow ?? 0,
      investing: c.annualInvestingCashFlow ?? 0,
      financing: c.annualFinancingCashFlow ?? 0,
      netChange: c.annualChangesInCash ?? 0,
      freeCashFlow: c.annualFreeCashFlow ?? ((c.annualOperatingCashFlow ?? 0) + (c.annualCapitalExpenditure ?? 0)),
    };
  }

  async getOwnership(symbol: string): Promise<Ownership> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no ownership for ${symbol}`);
    const institutionalHolders = mapOwnershipList(
      ((result.institutionOwnership as Record<string, unknown>)?.ownershipList as unknown[]) ?? []
    );
    const topETFs = mapOwnershipList(
      ((result.fundOwnership as Record<string, unknown>)?.ownershipList as unknown[]) ?? []
    );
    return { institutionalHolders, topETFs };
  }

  async getEarningsHistory(symbol: string): Promise<EarningsHistoryPeriod[]> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no earnings history for ${symbol}`);
    const hist = (result?.earningsHistory as Record<string, unknown>)
      ?.history as Array<Record<string, unknown>> | undefined;
    if (!hist?.length) return [];
    return hist.map((h) => ({
      period: fmt(h.quarter).slice(0, 7) || "N/A",
      estimatedEPS: raw(h.epsEstimate),
      actualEPS: raw(h.epsActual),
      surprise: raw(h.surprisePercent) * 100,
    })).reverse();
  }

  async getAnalystRatings(symbol: string): Promise<AnalystRatings> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no analyst ratings for ${symbol}`);
    const fd = result?.financialData as Record<string, unknown> | undefined;
    const trend = (result?.recommendationTrend as Record<string, unknown>)
      ?.trend as Array<Record<string, unknown>> | undefined;
    const latest = trend?.[0];
    return {
      strongBuy: raw(latest?.strongBuy),
      buy: raw(latest?.buy),
      hold: raw(latest?.hold),
      sell: raw(latest?.sell),
      strongSell: raw(latest?.strongSell),
      recommendationMean: raw(fd?.recommendationMean),
      recommendationKey: typeof fd?.recommendationKey === "string" ? fd.recommendationKey : "",
      targetHigh: raw(fd?.targetHighPrice),
      targetLow: raw(fd?.targetLowPrice),
      targetMean: raw(fd?.targetMeanPrice),
      targetMedian: raw(fd?.targetMedianPrice),
    };
  }

  async getStockSplits(symbol: string): Promise<StockSplit[]> {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=max&interval=1mo&events=div,splits`, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const json = await res.json();
    const splitsObj = json.chart?.result?.[0]?.events?.splits as Record<string, { date: number; numerator: number; denominator: number }> | undefined;
    if (!splitsObj) return [];
    
    return Object.values(splitsObj).sort((a, b) => b.date - a.date).slice(0, 5).map((s) => ({
      date: new Date(s.date * 1000).toISOString().split("T")[0],
      numerator: s.numerator,
      denominator: s.denominator,
    }));
  }

  async getInsiderTrades(symbol: string): Promise<InsiderTrade[]> {
    const result = await fetchAllModules(symbol);
    if (!result) return [];
    const trades = (result.insiderTransactions as Record<string, unknown>)?.transactions as Array<Record<string, unknown>> | undefined;
    if (!trades || trades.length === 0) return [];
    
    return trades.slice(0, 10).map((t) => {
      const typeStr = (t.transactionText as string || "").toLowerCase();
      const isBuy = typeStr.includes("buy") || typeStr.includes("purchase");
      return {
        officerName: (t.filerName as string) ?? "N/A",
        officerTitle: (t.filerRelation as string) ?? "N/A",
        transactionType: isBuy ? "Purchase" : "Sale",
        shares: raw(t.shares),
        transactionDate: t.startDate ? new Date(raw(t.startDate) * 1000).toISOString().split("T")[0] : "N/A",
      };
    });
  }

  async getUpcomingEarnings(symbol: string): Promise<UpcomingEarnings | null> {
    const result = await fetchAllModules(symbol);
    if (!result) return null;
    const events = result.calendarEvents as Record<string, unknown> | undefined;
    const earnings = events?.earnings as Record<string, unknown> | undefined;
    const earningsDate = (earnings?.earningsDate as unknown[])?.[0];
    
    if (!earningsDate) return null;
    
    return {
      date: new Date(raw(earningsDate) * 1000).toISOString().split("T")[0],
      revenueEstimate: raw(earnings?.revenueAverage),
      epsEstimate: raw(earnings?.earningsAverage),
    };
  }

  async getDividends(symbol: string): Promise<Dividend[]> {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5y&interval=1mo&events=div,splits`, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const json = await res.json();
    const divsObj = json.chart?.result?.[0]?.events?.dividends;
    if (!divsObj) return [];
    
    const divs = Object.values(divsObj) as Array<{date: number, amount: number}>;
    divs.sort((a, b) => b.date - a.date);
    
    return divs.slice(0, 20).map(d => ({
      date: new Date(d.date * 1000).toISOString().split("T")[0],
      amount: d.amount,
    }));
  }
}

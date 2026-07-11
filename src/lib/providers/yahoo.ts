import { cache } from "react";
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
  OwnershipHolder,
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



const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const SUMMARY_BASE = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
  "5Y": { range: "5y", interval: "1mo" },
};



let cachedCrumb: { cookie: string; crumb: string } | null = null;
let crumbTs = 0;
let crumbPromise: Promise<{ cookie: string; crumb: string } | null> | null = null;

async function getYahooCrumb(): Promise<{ cookie: string; crumb: string } | null> {
  if (cachedCrumb && Date.now() - crumbTs < 300_000) return cachedCrumb;
  
  if (crumbPromise) return crumbPromise;

  crumbPromise = (async () => {
    try {
      const cookieRes = await fetch("https://fc.yahoo.com/", { headers: { "User-Agent": UA }, cache: "no-store" });
    const cookie = cookieRes.headers.get("set-cookie")?.split(";")?.[0];
    if (!cookie) return cachedCrumb;
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { Cookie: cookie, "User-Agent": UA },
      cache: "no-store"
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

  const res = await fetch(url, { headers, next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.quoteSummary?.result?.[0] ?? null;
}



function raw(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "raw" in v) return (v as { raw: number }).raw ?? 0;
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
    "incomeStatementHistory",
    "balanceSheetHistory",
    "cashflowStatementHistory",
    "institutionOwnership",
    "fundOwnership",
    "earningsHistory",
    "recommendationTrend",
    "insiderTransactions",
    "calendarEvents",
    "earnings"
  ]);
});

const fetchTimeseries = cache(async (symbol: string, types: string[]) => {
  const url = `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}?symbol=${symbol}&type=${types.join(",")}&period1=0&period2=1893456000`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } });
  if (!res.ok) return {};
  const data = await res.json();
  const result = data?.timeseries?.result;
  if (!Array.isArray(result)) return {};

  const byYear: Record<string, Record<string, number>> = {};
  for (const item of result) {
    const type = item.meta?.type?.[0];
    if (!type || !Array.isArray(item[type])) continue;
    for (const point of item[type]) {
      const year = point.asOfDate?.substring(0, 4);
      if (!year) continue;
      if (!byYear[year]) byYear[year] = {};
      byYear[year][type] = raw(point.reportedValue);
    }
  }
  return byYear;
});

export class YahooProvider implements DataProvider {


  async getQuote(symbol: string): Promise<Quote> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no quote for ${symbol}`);
    const p = result.price as Record<string, unknown>;
    const sd = result.summaryDetail as Record<string, unknown> | undefined;
    return {
      currentPrice: raw(p?.regularMarketPrice),
      changeAmount: Math.abs(raw(p?.regularMarketChange)),
      changePercentage: Math.abs(raw(p?.regularMarketChangePercent) * 100),
      isPositive: raw(p?.regularMarketChange) >= 0,
      open: raw(p?.regularMarketOpen),
      high: raw(p?.regularMarketDayHigh),
      low: raw(p?.regularMarketDayLow),
      previousClose: raw(p?.regularMarketPreviousClose),
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
      exchange: normalizeExchange((p?.exchange as string) ?? "N/A"),
      ceoName: (() => {
        const officers = p?.companyOfficers as Array<Record<string, unknown>> | undefined;
        return (officers?.[0]?.name as string) ?? "N/A";
      })(),
      website: (p?.website as string) ?? "",
      ipoDate: "N/A",
      country: (p?.country as string) ?? "N/A",
    };
  }

  async getMetrics(symbol: string): Promise<Metrics> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no metrics for ${symbol}`);
    const sd = result.summaryDetail as Record<string, unknown>;
    const ks = result.defaultKeyStatistics as Record<string, unknown>;
    const fd = result.financialData as Record<string, unknown>;
    
    let roe = raw(fd?.returnOnEquity) * 100;
    let pbRatio = raw(ks?.priceToBook);
    
    if (roe === 0 || pbRatio === 0) {
      try {
        const bs = await this.getBalanceSheet(symbol);
        const is = await this.getIncomeStatementHistory(symbol);
        if (bs.equity > 0) {
          if (roe === 0 && is.length > 0) roe = (is[0].netIncome / bs.equity) * 100;
          if (pbRatio === 0) pbRatio = raw(sd?.marketCap) / bs.equity;
        }
      } catch {}
    }

    return {
      marketCap: raw(sd?.marketCap),
      peRatio: raw(sd?.trailingPE),
      pbRatio,
      dividendYield: raw(sd?.dividendYield),
      beta: raw(sd?.beta),
      roe,
      roa: raw(fd?.returnOnAssets) * 100,
      eps: raw(ks?.trailingEps),
      revenueGrowthYoy: raw(fd?.revenueGrowth) * 100,
    };
  }

  async getRevenueSegments(_symbol: string): Promise<RevenueSegment[]> {
    return [];
  }

  async getIncomeStatementHistory(symbol: string): Promise<IncomeStatementPeriod[]> {
    const types = ["annualTotalRevenue","annualGrossProfit","annualOperatingIncome","annualEBITDA","annualNetIncome","annualTotalOperatingExpenses","annualOperatingExpense","annualDilutedEPS"];
    const byYear = await fetchTimeseries(symbol, types);
    const years = Object.keys(byYear).sort().reverse().slice(0, 5);
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
    const types = ["annualTotalAssets","annualTotalLiabilitiesNetMinorityInterest","annualStockholdersEquity","annualCashAndCashEquivalents","annualCurrentAssets","annualCurrentLiabilities","annualLongTermDebt","annualTotalDebt","annualNetPropertyPlantAndEquipment"];
    const byYear = await fetchTimeseries(symbol, types);
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
    const types = ["annualOperatingCashFlow","annualInvestingCashFlow","annualFinancingCashFlow","annualEndCashPosition","annualCapitalExpenditure","annualFreeCashFlow","annualChangesInCash"];
    const byYear = await fetchTimeseries(symbol, types);
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
      revenueEstimate: 0,
      actualRevenue: 0,
    }));
  }

  async getAnalystRatings(symbol: string): Promise<AnalystRatings> {
    const result = await fetchAllModules(symbol);
    if (!result) throw new Error(`Yahoo: no analyst ratings for ${symbol}`);
    const fd = result?.financialData as Record<string, unknown> | undefined;
    const trend = (result?.recommendationTrend as Record<string, unknown>)
      ?.trend as Array<Record<string, unknown>> | undefined;
    const latest = trend?.[0];
    return {
      strongBuy: (latest?.strongBuy as number) ?? 0,
      buy: (latest?.buy as number) ?? 0,
      hold: (latest?.hold as number) ?? 0,
      sell: (latest?.sell as number) ?? 0,
      strongSell: (latest?.strongSell as number) ?? 0,
      targetHigh: raw(fd?.targetHighPrice),
      targetLow: raw(fd?.targetLowPrice),
      targetMean: raw(fd?.targetMeanPrice),
      targetMedian: raw(fd?.targetMedianPrice),
    };
  }

  async getExecutiveCompensation(symbol: string): Promise<ExecutiveCompensation | null> {
    const result = await fetchAllModules(symbol);
    if (!result) return null;
    const p = (result.assetProfile ?? result.summaryProfile) as Record<string, unknown>;
    const officers = p?.companyOfficers as Array<Record<string, unknown>> | undefined;
    
    if (!officers || officers.length === 0) return null;
    
    const ceo = officers.find((o) => (o.title as string)?.toLowerCase().includes("ceo") || (o.title as string)?.toLowerCase().includes("chief executive")) || officers[0];
    
    return {
      name: (ceo.name as string) ?? "N/A",
      title: (ceo.title as string) ?? "N/A",
      salary: raw(ceo.totalPay), 
      bonus: 0,
      stockAwards: raw(ceo.exercisedValue),
      total: raw(ceo.totalPay) + raw(ceo.exercisedValue),
      year: String(new Date().getFullYear()),
    };
  }

  async getStockSplits(symbol: string): Promise<StockSplit[]> {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=max&interval=1mo&events=div,splits`, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 86400 } });
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
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5y&interval=1mo&events=div,splits`, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 86400 } });
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

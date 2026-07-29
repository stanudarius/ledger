
export function normalizeExchange(raw: string): string {
  if (!raw || raw === "N/A") return "N/A";
  const m = raw.match(/^(NYSE|NASDAQ|NYSEARCA|NYSEAMERICAN|AMEX|BATS|OTC|CBOE|LSE|TSE|HKEX|SSE|SZSE|TSX|ASX|NSE|BSE|KRX|JPX|SIX|OMX|EURONEXT|XETRA|LON)/i);
  return m ? m[1].toUpperCase() : raw;
}

export interface Quote {
  currentPrice: number;
  /** Intraday change percentage. Signed (negative = down day). Unit: percent. */
  changePercentage: number;
  /** Intraday change amount. Signed (negative = down day). Unit: USD. */
  changeAmount: number;
  /** Direction flag for arrow/color rendering. */
  isPositive: boolean;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  week52High: number;
  week52Low: number;
}

export interface CompanyProfile {
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  exchange: string;
  ceoName: string;
  website: string;
  ipoDate: string;
  country: string;
}

export interface Metrics {
  /** Total market capitalization in USD (absolute, not scaled). */
  marketCap: number;
  /** Price-to-earnings (trailing). Unit: ratio (25.0 = 25x). */
  peRatio: number;
  /** Price-to-book. Unit: ratio (3.0 = 3x). */
  pbRatio: number;
  /** Dividend yield. Unit: decimal 0–1 (0.025 = 2.5%). Consumers multiply by 100. */
  dividendYield: number;
  /** Beta vs. market. Unit: ratio (1.0 = market). */
  beta: number;
  /** Return on equity. Unit: percent (15.0 = 15%). */
  roe: number;
  /** Return on assets. Unit: percent (5.0 = 5%). */
  roa: number;
  /** Diluted EPS (trailing). Unit: USD per share (can be negative). */
  eps: number;
  /** Revenue growth, year-over-year. Unit: percent (10.0 = +10%). Negative = decline. */
  revenueGrowthYoy: number;
}


export interface RevenueSegment {
  label: string;
  value: number;
}


export interface IncomeStatementPeriod {
  period: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  operatingExpense: number;
  netIncome: number;
  netMargin: number;
  eps: number;
  ebitda: number;
}

interface BalanceSheetSegment {
  label: string;
  value: number;
}

export interface BalanceSheet {
  cash: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  debt: number;
  assetsBreakdown: BalanceSheetSegment[];
  liabilitiesBreakdown: BalanceSheetSegment[];
}

export interface CashFlow {
  operating: number;
  investing: number;
  financing: number;
  netChange: number;
  freeCashFlow: number;
}

export interface OwnershipHolder {
  name: string;
  shares: number;
  percentage: number;
}

export interface Ownership {
  topETFs: OwnershipHolder[];
  institutionalHolders: OwnershipHolder[];
}

export interface PriceHistoryPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface EarningsHistoryPeriod {
  period: string;
  estimatedEPS: number;
  actualEPS: number;
  surprise: number;
  revenueEstimate: number;
  actualRevenue: number;
}

export interface AnalystRatings {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface ExecutiveCompensation {
  name: string;
  title: string;
  salary: number;
  bonus: number;
  stockAwards: number;
  total: number;
  year: string;
}

export interface StockSplit {
  date: string;
  numerator: number;
  denominator: number;
}

export interface InsiderTrade {
  officerName: string;
  officerTitle: string;
  transactionType: "Purchase" | "Sale";
  shares: number;
  transactionDate: string;
}

export interface UpcomingEarnings {
  date: string;
  revenueEstimate: number;
  epsEstimate: number;
}


export interface Dividend {
  date: string;
  amount: number;
}

interface PriceProvider {
  getQuote(symbol: string): Promise<Quote>;
  getPriceHistory(symbol: string, range?: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y"): Promise<PriceHistoryPoint[]>;
}

interface FundamentalsProvider {
  getProfile(symbol: string): Promise<CompanyProfile>;
  getMetrics(symbol: string): Promise<Metrics>;
  /** Compute metrics from already-fetched data — skips redundant HTTP calls.
   *  Each provider uses whichever fields it needs; unknown fields are ignored. */
  getMetricsFromData?(data: {
    profile?: CompanyProfile;
    quote?: Quote;
    latestIncome?: IncomeStatementPeriod;
    prevIncome?: IncomeStatementPeriod;
    balance?: BalanceSheet;
    marketCap?: number;
    beta?: number;
    lastDividend?: number;
    sharesOut?: number;
  }): Metrics;
  getRevenueSegments(symbol: string): Promise<RevenueSegment[]>;
  /** Annual income-statement history.
   *  Contract: ordered ASCENDING by period (oldest first), so the last element
   *  is the most recent year. Consumers rely on `arr[arr.length - 1]` = latest. */
  getIncomeStatementHistory(symbol: string): Promise<IncomeStatementPeriod[]>;
  getBalanceSheet(symbol: string): Promise<BalanceSheet>;
  getCashFlow(symbol: string): Promise<CashFlow>;
  getOwnership(symbol: string): Promise<Ownership>;
  /** Quarterly earnings history.
   *  Contract: ordered ASCENDING by period (oldest first), so the last element
   *  is the most recent quarter. Consumers render charts left→right = old→new. */
  getEarningsHistory(symbol: string): Promise<EarningsHistoryPeriod[]>;
  getAnalystRatings(symbol: string): Promise<AnalystRatings>;
  getExecutiveCompensation(symbol: string): Promise<ExecutiveCompensation | null>;
  getStockSplits(symbol: string): Promise<StockSplit[]>;
  getInsiderTrades(symbol: string): Promise<InsiderTrade[]>;
  getUpcomingEarnings(symbol: string): Promise<UpcomingEarnings | null>;
  getDividends(symbol: string): Promise<Dividend[]>;
}

export interface DataProvider extends PriceProvider, FundamentalsProvider {}

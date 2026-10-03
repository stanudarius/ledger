


export interface Quote {
  currentPrice: number;
  changePercentage: number;
  changeAmount: number;
  isPositive: boolean;
  open: number;
  high: number;
  low: number;
  volume: number;
  week52High: number;
  week52Low: number;
}

export interface CompanyProfile {
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  ceoName: string;
  website: string;
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
  /** Total common shares outstanding used for market-cap fallback. */
  sharesOutstanding: number;
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
}

export interface AnalystRatings {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  /** Yahoo's weighted analyst consensus score, on a 1 (strong buy) to 5 (strong sell) scale. */
  recommendationMean: number;
  /** Yahoo's consensus label, e.g. "buy" or "strong_buy". */
  recommendationKey: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
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
  /** Annual income-statement history, oldest first. */
  getIncomeStatementHistory(symbol: string): Promise<IncomeStatementPeriod[]>;
  getBalanceSheet(symbol: string): Promise<BalanceSheet>;
  getCashFlow(symbol: string): Promise<CashFlow>;
  getOwnership(symbol: string): Promise<Ownership>;
  /** Quarterly earnings history, oldest first. */
  getEarningsHistory(symbol: string): Promise<EarningsHistoryPeriod[]>;
  getAnalystRatings(symbol: string): Promise<AnalystRatings>;
  getStockSplits(symbol: string): Promise<StockSplit[]>;
  getInsiderTrades(symbol: string): Promise<InsiderTrade[]>;
  getUpcomingEarnings(symbol: string): Promise<UpcomingEarnings | null>;
  getDividends(symbol: string): Promise<Dividend[]>;
}

export interface DataProvider extends PriceProvider, FundamentalsProvider {}

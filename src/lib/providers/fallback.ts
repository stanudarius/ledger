import { DataProvider } from "./index";
import { FMPProvider } from "./fmp";
import { YahooProvider } from "./yahoo";
import { FinnhubProvider } from "./finnhub";

/** Methods whose contract legitimately returns null. For these, a null from the
 *  locked provider is a success (holds the lock) rather than a fall-through. */
const NULLABLE_METHODS = new Set([
  "getUpcomingEarnings", "getExecutiveCompensation", "getQuote", "getProfile",
  "getMetrics", "getBalanceSheet", "getCashFlow", "getOwnership", "getAnalystRatings",
]);

export class FallbackProvider implements DataProvider {
  private providers: DataProvider[];
  private locked: { provider: DataProvider; name: string } | null = null;
  /** Methods the locked provider has already failed — skip it for these. */
  private lockedFailed = new Set<string>();

  constructor(providers?: DataProvider[]) {
    this.providers = providers ?? [new FMPProvider(), new FinnhubProvider(), new YahooProvider()];
  }

  private async _fallback<T>(method: string, symbol: string, call: (p: DataProvider) => Promise<T>): Promise<T> {
    if (this.locked && !this.lockedFailed.has(method)) {
      try {
        const result = await call(this.locked.provider);
        // A null is a valid success for nullable methods (holds the lock);
        // for non-nullable methods a null/empty array falls through.
        const isNullable = NULLABLE_METHODS.has(method);
        if (result !== null && !(Array.isArray(result) && result.length === 0)) return result;
        if (isNullable && result === null) return result as unknown as T;
      } catch (err) {
        const msg = (err as Error).message ?? "";
        if (/rate.?limit|429|too many/i.test(msg)) {
          this.locked = null;
          this.lockedFailed.clear();
        } else {
          // Don't retry this provider for this method again.
          this.lockedFailed.add(method);
        }
      }
    }
    for (const p of this.providers) {
      if (this.locked && p === this.locked.provider) continue;
      try {
        const result = await call(p);
        if (result === null || (Array.isArray(result) && result.length === 0)) continue;
        if (!this.locked) this.locked = { provider: p, name: p.constructor.name };
        return result;
      } catch (err) {
        console.warn(`[Fallback] ${p.constructor.name} failed "${method}": ${(err as Error).message}`);
      }
    }
    if (NULLABLE_METHODS.has(method)) return null as unknown as T;
    return [] as unknown as T;
  }

  getQuote         = (s: string) => this._fallback("getQuote", s, p => p.getQuote(s));
  getPriceHistory  = (s: string, r?: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y") => this._fallback("getPriceHistory", s, p => p.getPriceHistory(s, r));
  getProfile       = (s: string) => this._fallback("getProfile", s, p => p.getProfile(s));
  getMetrics       = (s: string) => this._fallback("getMetrics", s, p => p.getMetrics(s));
  getRevenueSegments = (s: string) => this._fallback("getRevenueSegments", s, p => p.getRevenueSegments(s));
  getIncomeStatementHistory = (s: string) => this._fallback("getIncomeStatementHistory", s, p => p.getIncomeStatementHistory(s));
  getBalanceSheet  = (s: string) => this._fallback("getBalanceSheet", s, p => p.getBalanceSheet(s));
  getCashFlow      = (s: string) => this._fallback("getCashFlow", s, p => p.getCashFlow(s));
  getOwnership     = (s: string) => this._fallback("getOwnership", s, p => p.getOwnership(s));
  getEarningsHistory = (s: string) => this._fallback("getEarningsHistory", s, p => p.getEarningsHistory(s));
  getAnalystRatings = (s: string) => this._fallback("getAnalystRatings", s, p => p.getAnalystRatings(s));
  getExecutiveCompensation = (s: string) => this._fallback("getExecutiveCompensation", s, p => p.getExecutiveCompensation(s));
  getStockSplits   = (s: string) => this._fallback("getStockSplits", s, p => p.getStockSplits(s));
  getInsiderTrades = (s: string) => this._fallback("getInsiderTrades", s, p => p.getInsiderTrades(s));
  getUpcomingEarnings = (s: string) => this._fallback("getUpcomingEarnings", s, p => p.getUpcomingEarnings(s));
  getDividends     = (s: string) => this._fallback("getDividends", s, p => p.getDividends(s));

  getMetricsFromData(data: {
    profile?: import("./index").CompanyProfile;
    quote?: import("./index").Quote;
    latestIncome?: import("./index").IncomeStatementPeriod;
    prevIncome?: import("./index").IncomeStatementPeriod;
    balance?: import("./index").BalanceSheet;
    marketCap?: number;
    beta?: number;
    lastDividend?: number;
    sharesOut?: number;
  }): import("./index").Metrics {
    // Use the locked provider if it supports the method, otherwise the first that does.
    const candidate =
      (this.locked?.provider.getMetricsFromData ? this.locked.provider : null) ??
      this.providers.find(p => p.getMetricsFromData);
    if (candidate?.getMetricsFromData) return candidate.getMetricsFromData(data);
    // Fallback: FMP can always compute it — call the pure static method directly
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
    });
  }
}

import { Card } from "@/components/ledger/Card";
import { MetaLine } from "@/components/ledger/MetaLine";
import Link from "next/link";
import { FallbackProvider } from "@/lib/providers/fallback";
import { getWatchlist } from "@/actions/userPreferences";
import { WatchlistManager } from "./components/WatchlistManager";
import { RemoveFromWatchlistButton } from "./components/RemoveFromWatchlistButton";

export default async function WatchlistPage() {
  const provider = new FallbackProvider();
  const watchlist = await getWatchlist();

  const results = await Promise.allSettled(watchlist.map(async (symbol) => {
    const [quote, profile] = await Promise.allSettled([
      provider.getQuote(symbol),
      provider.getProfile(symbol)
    ]);
    const q = quote.status === "fulfilled" ? quote.value : null;
    const p = profile.status === "fulfilled" ? profile.value : null;
    return { symbol, name: p?.companyName || symbol, price: q ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(q.currentPrice) : "—", change: q ? `${q.isPositive ? '+' : ''}${q.changePercentage.toFixed(2)}%` : "—", isPositive: q?.isPositive ?? false };
  }));

  const trackedTickers = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<{ symbol: string; name: string; price: string; change: string; isPositive: boolean }>).value);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-serif text-ink tracking-tighter">Watchlist</h1>
          <MetaLine className="mt-2">TRACKED EQUITIES · MAX 20</MetaLine>
        </div>
        <WatchlistManager />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink border-collapse">
            <thead className="bg-paper-alt border-b border-rule">
              <tr>
                <th className="p-4 font-sans uppercase tracking-widest text-xs font-bold text-ink-muted">Ticker</th>
                <th className="p-4 font-sans uppercase tracking-widest text-xs font-bold text-ink-muted">Price</th>
                <th className="p-4 font-sans uppercase tracking-widest text-xs font-bold text-ink-muted">Day Change</th>
                <th className="p-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-dashed">
              {trackedTickers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-muted text-sm">
                    Your watchlist is empty. Add a ticker above to start tracking.
                  </td>
                </tr>
              ) : (
                trackedTickers.map((ticker) => (
                  <tr key={ticker.symbol} className="hover:bg-paper-alt/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/ticker/${ticker.symbol}`} className="flex flex-col">
                        <span className="font-serif font-semibold text-lg text-ink hover:underline">{ticker.symbol}</span>
                        <span className="text-xs text-ink-muted">{ticker.name}</span>
                      </Link>
                    </td>
                    <td className="p-4 font-medium">{ticker.price}</td>
                    <td className={`p-4 font-medium ${ticker.isPositive ? "text-positive" : "text-negative"}`}>
                      {ticker.isPositive ? "▲" : "▼"} {ticker.change}
                    </td>
                    <td className="p-4 text-right">
                      <RemoveFromWatchlistButton symbol={ticker.symbol} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

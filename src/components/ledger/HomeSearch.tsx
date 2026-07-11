"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, X, TrendingUp, Loader2 } from "lucide-react"

export function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)
  const [error, setError] = React.useState("")
  const QUICK = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA", "AMZN", "META", "JPM"]
  
  const filtered = QUICK.filter((t) => t.startsWith(query.toUpperCase())).slice(0, 8)
  
  const go = async (symbol: string) => {
    if (!symbol.trim() || isSearching) return
    
    setIsSearching(true)
    setError("")
    
    try {
      const { validateTicker } = await import("@/actions/ticker")
      const isValid = await validateTicker(symbol)
      
      if (isValid) {
        router.push(`/ticker/${symbol.toUpperCase().trim()}`)
      } else {
        setError(`Ticker "${symbol.toUpperCase().trim()}" not found.`)
        setIsSearching(false)
      }
    } catch (_err) {
      setError("An error occurred while validating the ticker.")
      setIsSearching(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") go(query)
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative mt-8">
      <div className="relative flex items-center w-full h-14 rounded-full border border-rule bg-paper shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-ink transition-all">
        <div className="pl-5 text-ink-muted">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (error) setError("")
          }}
          onKeyDown={handleKey}
          placeholder="Search ticker symbol (e.g. AAPL)..."
          className="flex-1 h-full bg-transparent outline-none px-4 text-lg text-ink placeholder:text-ink-muted/50 font-sans"
          autoFocus
          disabled={isSearching}
        />
        {query && !isSearching && (
          <button onClick={() => { setQuery(""); setError(""); }} className="pr-5 text-ink-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="absolute top-full mt-2 w-full text-center text-sm text-negative animate-fade-in font-medium">
          {error}
        </div>
      )}

      {query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-paper border border-rule rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
          <div className="p-2">
            <div className="text-xs font-sans font-bold uppercase tracking-widest text-ink-muted px-3 py-2">
              Results
            </div>
            {filtered.map((sym) => (
              <button
                key={sym}
                onClick={() => go(sym)}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-paper-alt transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-paper-alt border border-rule-dashed flex items-center justify-center flex-shrink-0 group-hover:bg-ink group-hover:border-ink transition-colors">
                  <TrendingUp className="w-5 h-5 text-ink-muted group-hover:text-paper transition-colors" />
                </div>
                <div>
                  <div className="text-lg font-serif font-semibold text-ink">{sym}</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <button
                onClick={() => go(query)}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-paper-alt transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-paper" />
                </div>
                <div>
                  <div className="text-lg font-serif font-semibold text-ink">
                    Search for &quot;{query.toUpperCase()}&quot;
                  </div>
                  <div className="text-xs text-ink-muted">View ticker page</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
      
      {!query && (
        <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in">
           {QUICK.slice(0, 5).map(sym => (
             <button
               key={sym}
               onClick={() => go(sym)}
               className="px-4 py-2 rounded-full border border-rule bg-paper-alt hover:bg-paper hover:border-ink transition-all text-sm font-sans font-medium text-ink flex items-center gap-2"
             >
               <TrendingUp className="w-4 h-4 text-ink-muted" />
               {sym}
             </button>
           ))}
        </div>
      )}
    </div>
  )
}

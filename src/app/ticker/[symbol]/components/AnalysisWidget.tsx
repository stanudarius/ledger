"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";

type Section = Record<string, unknown>;

function textValue(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "Not available.";
}

function SectionCard({ title, data }: { title: string; data: Section }) {
  return (
    <div className="border border-rule-dashed rounded-sm bg-paper p-4">
      <h4 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-3">{title}</h4>
      <p className="text-sm text-ink leading-relaxed mb-3">{textValue(data.summary)}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border-l-2 border-positive/50 pl-3">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-positive mb-1">{textValue(data.positiveTitle)}</div>
          <p className="text-xs text-ink-muted leading-relaxed">{textValue(data.positiveText)}</p>
        </div>
        <div className="border-l-2 border-negative/50 pl-3">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-negative mb-1">{textValue(data.negativeTitle)}</div>
          <p className="text-xs text-ink-muted leading-relaxed">{textValue(data.negativeText)}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-rule-dashed pt-3 space-y-2">
        <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">Key Question</div>
        <p className="text-xs text-ink leading-relaxed">{textValue(data.question)}</p>
        <p className="text-xs text-ink-muted leading-relaxed">{textValue(data.answer)}</p>
        <p className="text-xs text-ink-muted leading-relaxed italic">{textValue(data.implication)}</p>
      </div>
    </div>
  );
}

export function AnalysisWidget({
  symbol, companyName, metrics, income, balance, cashFlow,
}: {
  symbol: string; companyName: string;
  metrics: Record<string, unknown> | null; income: Record<string, unknown>[];
  balance: Record<string, unknown> | null; cashFlow: Record<string, unknown> | null;
}) {
  const [result, setResult] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getStockAnalysis } = await import("@/actions/analysis");
        const r = await getStockAnalysis(symbol, companyName, metrics ?? {}, income, balance ?? {}, cashFlow ?? {});
        if (cancelled) return;
        if (r.success && r.data) {
          setResult(r.data as unknown as Record<string, unknown>);
        } else {
          setErrorMsg(r.error || "No analysis returned");
        }
      } catch (err) {
        if (!cancelled) setErrorMsg((err as Error).message || "Unknown error");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [symbol, companyName]); // eslint-disable-line

  if (loading) {
    return (
      <div className="border border-rule-dashed rounded-sm bg-paper-alt p-6">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-5 h-5 text-ink-muted animate-spin" />
          <span className="font-serif text-lg text-ink">Generating analysis</span>
          <span className="text-ink-muted animate-pulse">...</span>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-paper rounded-sm w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><div className="h-3 bg-paper rounded-sm w-16" /><div className="h-4 bg-paper rounded-sm w-full" /><div className="h-4 bg-paper rounded-sm w-5/6" /></div>
            <div className="space-y-2"><div className="h-3 bg-paper rounded-sm w-16" /><div className="h-4 bg-paper rounded-sm w-full" /><div className="h-4 bg-paper rounded-sm w-5/6" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !result?.overall) {
    return (
      <div className="border border-rule-dashed rounded-sm bg-paper-alt p-4 text-center space-y-1">
        <p className="text-sm text-ink-muted">Analysis is currently unavailable.</p>
        <p className="text-xs text-ink-muted/60 font-mono">{errorMsg || "No data returned"}</p>
      </div>
    );
  }

  const o = result.overall as Section;

  return (
    <div className="space-y-6">
      <div className="border border-rule rounded-sm bg-paper-alt text-ink p-6 flex flex-col md:flex-row gap-6 md:items-start">
        <div className="flex-1">
          <p className="font-serif text-xl text-ink leading-snug mb-4">{textValue(o.headline)}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-l-2 border-positive/50 pl-3"><div className="text-[9px] font-sans font-bold uppercase tracking-widest text-positive mb-1">Bull Case</div><p className="text-sm text-ink-muted leading-relaxed">{textValue(o.bull)}</p></div>
            <div className="border-l-2 border-negative/50 pl-3"><div className="text-[9px] font-sans font-bold uppercase tracking-widest text-negative mb-1">Bear Case</div><p className="text-sm text-ink-muted leading-relaxed">{textValue(o.bear)}</p></div>
          </div>
        </div>
        <div className="flex-shrink-0 text-center md:text-right">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-2">Rating</div>
          <div className={`font-serif text-2xl font-bold ${(o.rating as string)?.includes("buy") ? "text-positive" : (o.rating as string)?.includes("sell") ? "text-negative" : "text-ink"}`}>
            {((o.rating as string)?.replace(/_/g, " ").toUpperCase()) ?? "HOLD"}
          </div>
        </div>
      </div>

      {result.incomeStatement != null && <SectionCard title="Income Statement" data={result.incomeStatement as Section} />}
      {result.balanceSheet     != null && <SectionCard title="Balance Sheet"     data={result.balanceSheet as Section} />}
      {result.cashFlow         != null && <SectionCard title="Cash Flow"          data={result.cashFlow as Section} />}
    </div>
  );
}

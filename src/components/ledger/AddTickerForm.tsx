"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddTickerFormProps {
  action: (symbol: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function AddTickerForm({
  action,
  placeholder = "Add ticker (e.g. AAPL)",
  className = "relative max-w-sm",
}: AddTickerFormProps) {
  const [query, setQuery] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const symbol = query.trim().toUpperCase();
    startTransition(() => {
      action(symbol);
      setQuery("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleAdd} className={className}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-paper-alt border border-rule rounded-sm py-2 pl-9 pr-10 text-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink uppercase"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={!query || isPending}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink hover:text-accent-blue disabled:opacity-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </form>
  );
}

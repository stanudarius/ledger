"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, Scale } from "lucide-react";

export function UserActionButtons({
  symbol,
  initialWatchlist,
  initialCompare,
}: {
  symbol: string;
  initialWatchlist: boolean;
  initialCompare: boolean;
}) {
  const [inWatchlist, setInWatchlist] = React.useState(initialWatchlist);
  const [inCompare, setInCompare] = React.useState(initialCompare);
  const [isPending, startTransition] = React.useTransition();

  const handleWatchlist = () => {
    const next = !inWatchlist;
    setInWatchlist(next);
    startTransition(async () => {
      try {
        const { toggleWatchlist } = await import("@/actions/userPreferences");
        const result = await toggleWatchlist(symbol);
        if (result?.success === false) setInWatchlist(!next);
      } catch {
        setInWatchlist(!next);
      }
    });
  };

  const handleCompare = () => {
    const next = !inCompare;
    setInCompare(next);
    startTransition(async () => {
      try {
        const { toggleCompare } = await import("@/actions/userPreferences");
        const result = await toggleCompare(symbol);
        if (result?.success === false) setInCompare(!next);
      } catch {
        setInCompare(!next);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={handleWatchlist}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-colors text-xs font-sans uppercase tracking-widest font-bold ${
          inWatchlist
            ? "bg-ink text-paper border-ink"
            : "bg-paper-alt text-ink border-rule hover:bg-rule hover:text-paper"
        }`}
      >
        {inWatchlist ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        {inWatchlist ? "Saved" : "Save"}
      </button>

      <button
        onClick={handleCompare}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-colors text-xs font-sans uppercase tracking-widest font-bold ${
          inCompare
            ? "bg-ink text-paper border-ink"
            : "bg-paper-alt text-ink border-rule hover:bg-rule hover:text-paper"
        }`}
      >
        <Scale className="w-3.5 h-3.5" />
        {inCompare ? "Comparing" : "Compare"}
      </button>
    </div>
  );
}

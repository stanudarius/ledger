"use client";

import * as React from "react";
import { toggleWatchlist, toggleCompare } from "@/actions/userPreferences";
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
    setInWatchlist(!inWatchlist);
    startTransition(() => {
      toggleWatchlist(symbol);
    });
  };

  const handleCompare = () => {
    setInCompare(!inCompare);
    startTransition(() => {
      toggleCompare(symbol);
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

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { toggleCompare } from "@/actions/userPreferences";
import { useRouter } from "next/navigation";

export function RemoveFromCompareButton({ symbol }: { symbol: string }) {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const handleRemove = () => {
    startTransition(() => {
      toggleCompare(symbol);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="p-1.5 text-ink-muted hover:text-negative hover:bg-negative/10 rounded-sm transition-colors disabled:opacity-50"
      title="Remove from Compare"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

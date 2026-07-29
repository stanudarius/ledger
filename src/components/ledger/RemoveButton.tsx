"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface RemoveButtonProps {
  symbol: string;
  action: (symbol: string) => Promise<{ success?: boolean; error?: string } | void>;
  label: string;
}

export function RemoveButton({ symbol, action, label }: RemoveButtonProps) {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await action(symbol);
        router.refresh();
      } catch {
        // The server-rendered list remains unchanged when removal fails.
      }
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="p-1.5 text-ink-muted hover:text-negative hover:bg-negative/10 rounded-sm transition-colors disabled:opacity-50"
      title={`Remove from ${label}`}
    >
      <X className="w-4 h-4" />
    </button>
  );
}

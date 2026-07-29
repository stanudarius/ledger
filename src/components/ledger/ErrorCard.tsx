"use client";

import Link from "next/link";

interface ErrorCardProps {
  title: string;
  message?: string;
  showHomeLink?: boolean;
  reset: () => void;
}

export function ErrorCard({ title, message, showHomeLink = false, reset }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
      <h2 className="text-2xl font-serif text-ink">{title}</h2>
      {message && (
        <p className="text-ink-muted text-sm max-w-sm text-center">{message}</p>
      )}
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-ink text-paper rounded-sm hover:bg-ink-muted transition-colors font-sans uppercase tracking-widest text-xs font-bold"
        >
          Retry
        </button>
        {showHomeLink && (
          <Link
            href="/"
            className="px-6 py-2 border border-rule text-ink rounded-sm hover:bg-paper-alt transition-colors font-sans uppercase tracking-widest text-xs font-bold"
          >
            Go Home
          </Link>
        )}
      </div>
    </div>
  );
}

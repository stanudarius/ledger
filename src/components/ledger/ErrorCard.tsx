"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorCardProps {
  title: string;
  message?: string;
  showHomeLink?: boolean;
  reset: () => void;
}

export function ErrorCard({ title, message, showHomeLink = false, reset }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-16 h-16 rounded-full bg-negative/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-negative" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-serif text-ink mb-2">{title}</h2>
      {message && (
        <p className="text-ink-muted text-sm max-w-sm text-center mb-6">{message}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper rounded-sm hover:bg-ink-muted transition-colors font-sans uppercase tracking-widest text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
        {showHomeLink && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-rule text-ink rounded-sm hover:bg-paper-alt transition-colors font-sans uppercase tracking-widest text-xs font-bold"
          >
            <Home className="w-3.5 h-3.5" />
            Go Home
          </Link>
        )}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  number?: string;
  title: string;
  className?: string;
}

export function SectionHeading({ number, title, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-6 border-b border-rule pb-2", className)}>
      {number && (
        <span className="block font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1">
          {number}
        </span>
      )}
      <h2 className="font-serif text-2xl text-ink">
        {title}
      </h2>
    </div>
  );
}

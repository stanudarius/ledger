import { cn } from "@/lib/utils"

export function TrendTriangle({ isPositive, className }: { isPositive: boolean; className?: string }) {
  return (
    <span className={cn("text-[10px] ml-1 inline-block", isPositive ? "text-positive" : "text-negative", className)}>
      {isPositive ? "▲" : "▼"}
    </span>
  )
}

export function QuickSummary({ text }: { text: string }) {
  return (
    <div className="font-serif text-xl text-ink leading-snug border-l-2 border-ink pl-4 py-1 mb-6">
      {text}
    </div>
  )
}

export function ImplicationCallout({ question, answer, implication }: { question: string; answer: string; implication: string }) {
  return (
    <div className="bg-paper-alt border border-rule-dashed rounded-sm p-4 my-4">
      <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1">{question}</div>
      <div className="font-serif text-lg text-ink mb-2">{answer}</div>
      <div className="text-sm text-ink-muted border-t border-rule-dashed pt-2 mt-2">
        {implication}
      </div>
    </div>
  )
}

export function TwinBoxes({ 
  positiveTitle, positiveText, 
  negativeTitle, negativeText 
}: { 
  positiveTitle: string; positiveText: string; 
  negativeTitle: string; negativeText: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      <div className="border border-positive/30 bg-positive/5 rounded-sm p-4 border-t-2 border-t-positive">
        <h4 className="font-sans uppercase tracking-widest text-[10px] text-positive font-bold mb-2">{positiveTitle}</h4>
        <p className="text-sm text-ink leading-snug">{positiveText}</p>
      </div>
      <div className="border border-negative/30 bg-negative/5 rounded-sm p-4 border-t-2 border-t-negative">
        <h4 className="font-sans uppercase tracking-widest text-[10px] text-negative font-bold mb-2">{negativeTitle}</h4>
        <p className="text-sm text-ink leading-snug">{negativeText}</p>
      </div>
    </div>
  )
}

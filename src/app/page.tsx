import { HomeSearch } from "@/components/ledger/HomeSearch";
import { SectorHeatmap } from "@/components/ledger/MarketPulse";

export const revalidate = 300; // 5 minutes

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Subtle background texture — radial gradient from center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(76,111,231,0.05),transparent)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-10 relative">
        <section className="text-center space-y-6 pt-12 pb-4">
          <h1 className="font-serif text-5xl md:text-7xl tracking-tighter text-ink max-w-3xl mx-auto leading-none">
            Your edge in the market.
          </h1>
          <p className="text-lg md:text-xl text-ink-muted max-w-2xl mx-auto font-sans">
            Institutional-grade fundamentals, earnings analysis, and market intelligence at your fingertips.
          </p>
        </section>
        
        <HomeSearch />

        <div className="pt-8">
          <SectorHeatmap />
        </div>
      </div>
    </div>
  );
}

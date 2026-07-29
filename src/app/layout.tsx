import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ledger/Navbar";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ledger",
    template: "%s | Ledger",
  },
  description:
    "Ledger is a stock research platform delivering institutional-grade fundamentals, earnings analysis, and market intelligence.",
  keywords: ["stock research", "fundamentals", "earnings", "financial analysis", "investing"],
  openGraph: {
    title: "Ledger — Market Companion",
    description: "Institutional-grade stock research.",
    type: "website",
  },
};

// Inline script — runs before hydration to prevent flash of wrong theme.
// Avoids calling cookies() in the root layout which forces dynamic rendering.
const THEME_SCRIPT = `(function(){try{var c=document.cookie.match(/ledger-theme=([^;]*)/);var t=c&&c[1]==='dark'?'dark':c&&c[1]==='light'?'light':(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Navbar />
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}

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
    default: "Ledger — Market Companion",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Navbar />
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}

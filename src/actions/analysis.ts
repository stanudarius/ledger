"use server";
import { generateStockAnalysis } from "@/lib/generate";

export async function getStockAnalysis(
  symbol: string, companyName: string,
  metrics: Record<string, unknown>, income: Record<string, unknown>[],
  balance: Record<string, unknown>, cashFlow: Record<string, unknown>,
) {
  try {
    const result = await generateStockAnalysis(symbol, companyName, metrics, income, balance, cashFlow);
    if (!result) return { success: false, error: "OPENROUTER_API_KEY not configured — set it in .env" };
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: (err as Error).message || "Unknown error" };
  }
}

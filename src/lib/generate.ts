import OpenAI from "openai";
const dsApiKey = process.env.DEEPSEEK_API_KEY || "";
const hasAnyKey = !!dsApiKey;

let _openai: import("openai").default | null = null;
function getOpenAI() {
  if (!dsApiKey) return null;
  if (!_openai) {
    _openai = new OpenAI({ apiKey: dsApiKey, baseURL: "https://api.deepseek.com" });
  }
  return _openai;
}



async function generateWithFallback(prompt: string) {
  const openai = getOpenAI();
  if (!openai) throw new Error("No DeepSeek key");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    }, {
      signal: controller.signal,
    });
    return response.choices[0].message.content || "";
  } finally {
    clearTimeout(timer);
  }
}


export interface StockAnalysis {
  incomeStatement: SectionAnalysis;
  balanceSheet: SectionAnalysis;
  cashFlow: SectionAnalysis;
  overall: OverallVerdict;
}

interface SectionAnalysis {
  summary: string;
  positiveTitle: string;
  positiveText: string;
  negativeTitle: string;
  negativeText: string;
  question: string;
  answer: string;
  implication: string;
}

interface OverallVerdict {
  headline: string;
  bull: string;
  bear: string;
  rating: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
}



export async function generateStockAnalysis(
  symbol: string,
  companyName: string,
  metrics: Record<string, unknown>,
  incomeData: Record<string, unknown>[],
  balanceData: Record<string, unknown>,
  cashFlowData: Record<string, unknown>
): Promise<StockAnalysis | null> {
  if (!hasAnyKey) {
    return null;
  }

  const prompt = `
You are a senior equity research analyst. Analyze the following financial data for ${companyName} (${symbol}) and produce a structured JSON analysis.
Be specific, data-driven, and concise. Reference actual numbers where possible. Output ONLY valid JSON, no markdown.

Schema:
{
  "incomeStatement": {
    "summary": "1-2 sentence summary of revenue/earnings trends",
    "positiveTitle": "short positive highlight title",
    "positiveText": "1-2 sentence positive insight",
    "negativeTitle": "short risk/concern title",
    "negativeText": "1-2 sentence risk description",
    "question": "key investor question about income",
    "answer": "direct short answer",
    "implication": "1 sentence strategic implication (do NOT use words like 'Ledger suggests', 'We suggest', or mention any AI/app)"
  },
  "balanceSheet": { /* same structure */ },
  "cashFlow": { /* same structure */ },
  "overall": {
    "headline": "1 sentence overall verdict",
    "bull": "bull case in 1-2 sentences",
    "bear": "bear case in 1-2 sentences",
    "rating": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell"
  }
}

Data:
- Metrics: ${JSON.stringify(metrics)}
- Income Statement (5-year history): ${JSON.stringify(incomeData)}
- Balance Sheet (latest): ${JSON.stringify(balanceData)}
- Cash Flow (latest): ${JSON.stringify(cashFlowData)}
`;

  try {
    const rawText = await generateWithFallback(prompt);
    const text = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(text) as StockAnalysis;
  } catch (e) {
    console.error(`generateStockAnalysis error for ${symbol}:`, e);
    return null;
  }
}

import OpenAI from "openai";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const hasAnyKey = !!DEEPSEEK_API_KEY;

let _openai: import("openai").default | null = null;
function getOpenAI() {
  if (!DEEPSEEK_API_KEY) return null;
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }
  return _openai;
}

// ── System prompt: role, rules, schema, and a concrete example ──────────────

const SYSTEM_PROMPT = `You are a senior equity research analyst. Output ONLY valid JSON — no markdown fences, no preamble, no commentary, no trailing text. Never mention "Ledger", "we suggest", "AI", or any app name. Be specific, data-driven, and concise. Reference actual numbers from the data provided.

Example (illustrative — do NOT reuse these numbers):
{
  "incomeStatement": {
    "summary": "Revenue grew 12% YoY to $94.7B while net income rose 18% to $23.6B, driven by margin expansion.",
    "positiveTitle": "Double-digit revenue growth",
    "positiveText": "Revenue grew at a double-digit pace for the third consecutive year, while net margin improved from 21% to 25%.",
    "negativeTitle": "Revenue concentration risk",
    "negativeText": "Over 70% of revenue comes from a single product line, creating vulnerability to demand shifts.",
    "question": "Is the current revenue growth rate sustainable?",
    "answer": "Partially — growth is decelerating from 18% to 12%, and forward guidance suggests further moderation.",
    "implication": "Margin expansion may offset slowing revenue growth, but investors should monitor the core segment's competitive moat."
  },
  "balanceSheet": {
    "summary": "The company holds $28B in cash against $15B in debt, with a current ratio of 1.4x.",
    "positiveTitle": "Fortress balance sheet",
    "positiveText": "Cash reserves cover all short- and long-term debt 1.9x over, providing ample liquidity for buybacks or strategic acquisitions.",
    "negativeTitle": "Rising leverage trend",
    "negativeText": "Debt has increased 25% YoY, outpacing equity growth of 10%, pushing the D/E ratio from 0.3 to 0.4.",
    "question": "Can the company service its debt comfortably?",
    "answer": "Yes — interest coverage exceeds 12x, well within safe territory.",
    "implication": "Strong liquidity supports shareholder returns, but the rising leverage trend warrants monitoring."
  },
  "cashFlow": {
    "summary": "Operating cash flow reached $32B with free cash flow of $28B, up 15% YoY.",
    "positiveTitle": "Robust free cash flow generation",
    "positiveText": "FCF conversion rate exceeds 90% of net income, indicating high earnings quality.",
    "negativeTitle": "Rising capex intensity",
    "negativeText": "Capital expenditures grew 30% YoY to $4B, compressing FCF margins slightly.",
    "question": "Is the capex increase a red flag?",
    "answer": "Not necessarily — the spending targets capacity expansion in a high-growth segment, suggesting strategic investment rather than waste.",
    "implication": "Strong cash generation funds both growth capex and shareholder returns without balance-sheet stress."
  },
  "overall": {
    "headline": "A high-quality compounder with strong fundamentals, though valuation leaves limited upside at current levels.",
    "bull": "Double-digit revenue growth, expanding margins, fortress balance sheet, and robust free cash flow support continued outperformance and capital returns.",
    "bear": "Revenue concentration risk, decelerating growth, and rising leverage could compress the multiple if macro conditions soften.",
    "rating": "buy"
  }
}`;

// ── Low-level API call ──────────────────────────────────────────────────────

async function generateWithFallback(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const openai = getOpenAI();
  if (!openai) throw new Error("No DeepSeek API key configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    // v4 models default to thinking=enabled, which ignores temperature
    // and can conflict with json_object — explicitly disable it.
    // Pass via a plain object cast since the OpenAI SDK types don't include
    // the DeepSeek-specific `thinking` parameter.
    const response = await openai.chat.completions.create(
      {
        model: "deepseek-v4-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        // @ts-expect-error — DeepSeek-specific parameter, not in OpenAI SDK types
        thinking: { type: "disabled" },
      },
      { signal: controller.signal },
    );
    return response.choices[0].message.content || "";
  } finally {
    clearTimeout(timer);
  }
}

// ── Retry wrapper ───────────────────────────────────────────────────────────

const MAX_RETRIES = 2;

async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const raw = await generateWithFallback(systemPrompt, userPrompt);
      if (raw && raw.trim().length > 0) return raw;
      // Empty response — DeepSeek JSON mode quirk; retry
      console.warn(
        `generateWithRetry: empty response on attempt ${attempt + 1}/${MAX_RETRIES}`,
      );
      lastError = new Error("Empty response from DeepSeek");
    } catch (e) {
      lastError = e;
      console.warn(
        `generateWithRetry: attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        e instanceof Error ? e.message : e,
      );
    }
    // Small delay between retries to avoid rate limiting
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw lastError ?? new Error("All retries exhausted");
}

// ── Public API ──────────────────────────────────────────────────────────────

interface StockAnalysis {
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
  cashFlowData: Record<string, unknown>,
): Promise<StockAnalysis | null> {
  if (!hasAnyKey) {
    return null;
  }

  const userPrompt = [
    `### COMPANY`,
    `${companyName} (${symbol})`,
    "",
    `### KEY METRICS`,
    JSON.stringify(metrics, null, 2),
    "",
    `### INCOME STATEMENT (multi-year history)`,
    JSON.stringify(incomeData, null, 2),
    "",
    `### BALANCE SHEET (latest)`,
    JSON.stringify(balanceData, null, 2),
    "",
    `### CASH FLOW (latest)`,
    JSON.stringify(cashFlowData, null, 2),
  ].join("\n");

  try {
    const rawText = await generateWithRetry(SYSTEM_PROMPT, userPrompt);
    const text = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(text) as StockAnalysis;
  } catch (e) {
    console.error(`generateStockAnalysis error for ${symbol}:`, e);
    return null;
  }
}

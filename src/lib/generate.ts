import "server-only";
import OpenAI from "openai";

let _openai: import("openai").default | null = null;
function getOpenAI() {
  const key = process.env.OPENROUTER_API_KEY || "";
  if (!key) return null;
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: key,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return _openai;
}

const ANALYSIS_MODEL = "openai/gpt-5.6-luna";

const SYSTEM_PROMPT = `You are a senior equity research analyst. Output ONLY valid JSON — no markdown fences, no preamble. Be concise and data-driven. Use this exact schema:
{"incomeStatement":{"summary":"...","positiveTitle":"...","positiveText":"...","negativeTitle":"...","negativeText":"...","question":"...","answer":"...","implication":"..."},"balanceSheet":{...same schema...},"cashFlow":{...same schema...},"overall":{"headline":"...","bull":"...","bear":"...","rating":"buy"|"hold"|"sell"}}`;

const CONCISE_SYSTEM_PROMPT = `You are a senior equity research analyst. Output ONLY valid JSON — no markdown fences, no preamble. BE EXTREMELY CONCISE: one short sentence per field, no more than 15 words each. Use this exact schema:
{"incomeStatement":{"summary":"...","positiveTitle":"...","positiveText":"...","negativeTitle":"...","negativeText":"...","question":"...","answer":"...","implication":"..."},"balanceSheet":{...same schema...},"cashFlow":{...same schema...},"overall":{"headline":"...","bull":"...","bear":"...","rating":"buy"|"hold"|"sell"}}`;

async function generateWithFallback(
  systemPrompt: string,
  userPrompt: string,
  opts?: { temperature?: number; maxTokens?: number },
): Promise<{ content: string; finishReason: string | null }> {
  const openai = getOpenAI();
  if (!openai) throw new Error("No OpenRouter API key configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await openai.chat.completions.create(
      {
        model: ANALYSIS_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.maxTokens ?? 4096,
        response_format: { type: "json_object" },
        // @ts-expect-error – OpenRouter-specific reasoning control
        reasoning: { effort: "low" },
      },
      { signal: controller.signal },
    );
    const msg = response.choices[0].message as { content?: string | null; reasoning_content?: string | null };
    const content = msg.content?.trim() || msg.reasoning_content?.trim() || "";
    const finishReason: string | null = response.choices[0].finish_reason || null;
    return { content, finishReason };
  } finally {
    clearTimeout(timer);
  }
}

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

/**
 * Best-effort repair of JSON truncated mid-generation.
 * Closes unterminated strings, then closes unmatched braces/brackets.
 */
function repairTruncatedJson(text: string): string {
  let repaired = text;

  // If the last non-whitespace character is inside a string (odd number of
  // unescaped quotes up to that point), close it.
  let inString = false;
  let escaped = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; }
  }
  if (inString) {
    repaired += '"';
  }

  // Count open braces/brackets and close them.
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;

  // Remove any trailing comma before closing.
  repaired = repaired.replace(/,\s*$/, "");

  for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
  for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";

  return repaired;
}

function isTruncatedJsonError(error: SyntaxError): boolean {
  const message = error.message.toLowerCase();
  return message.includes("unterminated string") || message.includes("unexpected end of json") || message.includes("unexpected end");
}

export async function generateStockAnalysis(
  symbol: string,
  companyName: string,
  metrics: Record<string, unknown>,
  incomeData: Record<string, unknown>[],
  balanceData: Record<string, unknown>,
  cashFlowData: Record<string, unknown>,
): Promise<StockAnalysis | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.warn("generateStockAnalysis: no OpenRouter API key configured");
    return null;
  }

  const userPrompt = [
    `### COMPANY`, `${companyName} (${symbol})`, "",
    `### KEY METRICS`, JSON.stringify(metrics, null, 2), "",
    `### INCOME STATEMENT (multi-year history)`, JSON.stringify(incomeData, null, 2), "",
    `### BALANCE SHEET (latest)`, JSON.stringify(balanceData, null, 2), "",
    `### CASH FLOW (latest)`, JSON.stringify(cashFlowData, null, 2),
  ].join("\n");

  async function tryParse(text: string, finishReason: string | null): Promise<StockAnalysis> {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    // Tolerate LLM trailing commas before } or ] (e.g. {"a":1,} or [1,2,])
    const sanitized = cleaned.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(sanitized) as StockAnalysis;
    } catch (e) {
      if (e instanceof SyntaxError && isTruncatedJsonError(e) && finishReason === "length") {
        // Truncated output — attempt repair
        const repaired = repairTruncatedJson(sanitized);
        try {
          const parsed = JSON.parse(repaired) as StockAnalysis;
          console.warn(
            `generateStockAnalysis: truncated JSON repaired for ${symbol} ` +
            `(text=${text.length} chars, finish=${finishReason})`,
          );
          return parsed;
        } catch {
          // repair failed, fall through to retry
        }
      }
      throw e;
    }
  }

  let firstFinishReason: string | null = null;
  try {
    const response = await generateWithFallback(SYSTEM_PROMPT, userPrompt);
    firstFinishReason = response.finishReason;
    const rawText = response.content;
    if (!rawText || !rawText.trim()) throw new Error("API returned empty content");
    return await tryParse(rawText, firstFinishReason);
  } catch (firstErr) {
    // Retry only when the model explicitly reports length truncation.
    if (
      firstErr instanceof SyntaxError &&
      firstFinishReason === "length" &&
      isTruncatedJsonError(firstErr)
    ) {
      console.warn(
        `generateStockAnalysis: retrying with concise prompt for ${symbol} (first attempt truncated)`,
      );
      try {
        const { content: rawText, finishReason } = await generateWithFallback(
          CONCISE_SYSTEM_PROMPT,
          userPrompt,
          { temperature: 0, maxTokens: 4096 },
        );
        if (!rawText || !rawText.trim()) throw new Error("API returned empty content on retry");
        return await tryParse(rawText, finishReason);
      } catch (retryErr) {
        console.warn(
          `generateStockAnalysis: concise retry also failed for ${symbol}:`,
          (retryErr as Error).message,
        );
      }
    }

    // Build a meaningful error message
    let msg = "Unknown error";
    if (firstErr instanceof Error && firstErr.name === "AbortError") {
      msg = "Analysis timed out (>120s)";
    } else if (firstErr instanceof SyntaxError) {
      msg = `Malformed JSON from model (likely truncated or trailing-comma defect): ${firstErr.message}`;
    } else {
      msg = (firstErr as Error).message || msg;
    }
    console.warn(`generateStockAnalysis: analysis unavailable for ${symbol}:`, msg);
    throw new Error(msg);
  }
}
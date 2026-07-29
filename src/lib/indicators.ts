/** Pure technical-indicator functions. All operate on close-price arrays or
 *  PriceHistoryPoint[] (which carries open/high/low/close/volume).
 *  Zero dependencies — just math. */

export interface OHLCV {
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

// ---------------------------------------------------------------------------
// Moving averages
// ---------------------------------------------------------------------------

/** Simple Moving Average. Returns `null` for the first `period-1` entries. */
export function sma(data: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) sum -= data[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

/** Exponential Moving Average. Uses `period * 2` worth of warmup. */
export function ema(data: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  // Seed with SMA of first `period` values
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i === period - 1) prev = sum / period;
    if (i >= period) prev = data[i] * k + (prev as number) * (1 - k);
    out.push(i >= period - 1 ? prev : null);
  }
  return out;
}

// ---------------------------------------------------------------------------
// RSI (Relative Strength Index) — Wilder's smoothing
// ---------------------------------------------------------------------------

export function rsi(data: number[], period: number = 14): (number | null)[] {
  const out: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period + 1) return out;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < data.length; i++) {
    if (avgLoss === 0) {
      out[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      out[i] = 100 - 100 / (1 + rs);
    }

    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff > 0 ? 0 : -diff;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  return out;
}

// ---------------------------------------------------------------------------
// MACD (12/26/9)
// ---------------------------------------------------------------------------

export function macd(
  data: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { macdLine: (number | null)[]; signalLine: (number | null)[]; histogram: (number | null)[] } {
  const emaFast = ema(data, fast);
  const emaSlow = ema(data, slow);
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    macdLine.push(
      emaFast[i] !== null && emaSlow[i] !== null ? (emaFast[i] as number) - (emaSlow[i] as number) : null
    );
  }
  // Signal line = EMA of MACD line
  const macdValues = macdLine.filter((v): v is number => v !== null);
  const sigRaw = ema(macdValues, signal);
  const signalLine: (number | null)[] = new Array(data.length).fill(null);
  const histogram: (number | null)[] = new Array(data.length).fill(null);
  let si = 0;
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] !== null && si < sigRaw.length) {
      signalLine[i] = sigRaw[si];
      histogram[i] = (macdLine[i] as number) - (sigRaw[si] as number);
      si++;
    }
  }
  return { macdLine, signalLine, histogram };
}

// ---------------------------------------------------------------------------
// Bollinger Bands (20, 2)
// ---------------------------------------------------------------------------

export function bollinger(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { middle: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const middle = sma(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    // Std dev of the `period` values
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (data[j] - (middle[i] as number)) ** 2;
    }
    const sd = Math.sqrt(sumSq / period);
    upper.push((middle[i] as number) + stdDev * sd);
    lower.push((middle[i] as number) - stdDev * sd);
  }
  return { middle, upper, lower };
}

// ---------------------------------------------------------------------------
// ATR (Average True Range)
// ---------------------------------------------------------------------------

export function atr(bars: OHLCV[], period: number = 14): (number | null)[] {
  const tr: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      tr.push((bars[i].high ?? bars[i].close) - (bars[i].low ?? bars[i].close));
    } else {
      const h = bars[i].high ?? bars[i].close;
      const l = bars[i].low ?? bars[i].close;
      const pc = bars[i - 1].close;
      tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
  }
  const out: (number | null)[] = new Array(bars.length).fill(null);
  if (tr.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  out[period - 1] = sum / period;
  for (let i = period; i < tr.length; i++) {
    out[i] = ((out[i - 1] as number) * (period - 1) + tr[i]) / period;
  }
  return out;
}

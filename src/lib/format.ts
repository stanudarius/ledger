/** Full USD currency with cents. e.g. "$1,234.56" */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/** Compact USD: "$1.5B", "$300M", "$50K", else "$1,234". Falls back to "-" for 0. */
export function formatCompactCurrency(value: number): string {
  if (value === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Market cap: "$1.50T", "$245.3B", "$18.5M", else full currency. */
export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return formatCurrency(value);
}

/** Compact number (no $). e.g. "1.5B", "300M", "1,234". Used for volume. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Signed percent string. e.g. "+12.5%", "-3.2%", "0.0%". */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Billions string. e.g. "$24.51B". */
export function formatBillions(value: number): string {
  if (value === 0) return "—";
  return `$${(value / 1e9).toFixed(2)}B`;
}

/** Compute a nice axis domain [min, max] for the given data range.
 *  Rounds the step to a clean multiple (1, 2, 5, 10, …) and snaps the
 *  min/max outward to the nearest nice tick boundaries. */
export function niceTicks(
  dataMin: number,
  dataMax: number,
  targetSteps = 5,
): [number, number] {
  if (dataMin === dataMax) {
    // Degenerate — add 10 % padding each side
    const pad = dataMin === 0 ? 1 : Math.abs(dataMin) * 0.1;
    return [dataMin - pad, dataMax + pad];
  }
  const range = dataMax - dataMin;
  const rough = range / targetSteps;
  // Snap to a "nice" step size
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3) niceStep = 2 * magnitude;
  else if (residual <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(dataMin / niceStep) * niceStep;
  const niceMax = Math.ceil(dataMax / niceStep) * niceStep;
  return [niceMin, niceMax];
}

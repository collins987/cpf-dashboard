/** Display formatting only — never used by the Core Logic layer, which returns plain numbers. */

export function formatKes(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `KES ${(value / 1_000_000_000).toFixed(1)}Bn`;
  if (abs >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(0)}M`;
  return `KES ${Math.round(value).toLocaleString()}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString();
}

export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null) return "N/A";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentPoint(value: number | null, decimals = 1): string {
  if (value === null) return "N/A";
  return `${(value * 100).toFixed(decimals)}pp`;
}

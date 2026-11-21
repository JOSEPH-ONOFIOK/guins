// $RPENG numbers shared by the casino, rules and wiki.

// $RPENG hasn't launched, so it has no price: with RATE_KNOWN false the site shows
// no dollar values and the rate reads "Soon". After launch, set the real RATE and
// flip RATE_KNOWN to true to show "≈ $" next to amounts again.
export const RATE_KNOWN = false;
// Placeholder: 100,000,000 $RPENG ≈ $2.00
export const RATE = { tokens: 100_000_000, usd: 2 };
export const USD_PER_TOKEN = RATE.usd / RATE.tokens;

// The Colony Casino opens itself at this moment (Sat 21 Nov, 5:20 PM WAT = 16:20 UTC): before it the
// tables are chained up with a countdown. No redeploy needed when it passes.
export const CASINO_OPENS = Date.parse("2026-11-21T16:20:00Z");

// Play chips: everyone starts with this, and can top back up to it when they run dry
export const START_CHIPS = 100_000_000;
export const MIN_BET = 1_000_000;

// 1,250,000 → "1.25M"
export function fmtTok(n: number) {
  const abs = Math.abs(n);
  const unit = abs >= 1e12 ? [1e12, "T"] : abs >= 1e9 ? [1e9, "B"] : abs >= 1e6 ? [1e6, "M"] : abs >= 1e3 ? [1e3, "K"] : [1, ""];
  const v = n / (unit[0] as number);
  return `${Number(v.toFixed(Math.abs(v) >= 100 ? 0 : 2)).toLocaleString("en-US")}${unit[1]}`;
}

// Token amount → "$2.00"
export function fmtUsd(tokens: number) {
  const usd = tokens * USD_PER_TOKEN;
  if (usd !== 0 && Math.abs(usd) < 0.01) return `${usd < 0 ? "-" : ""}<$0.01`;
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Fair random number in [0, 1) from the browser's crypto source
export function rand() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

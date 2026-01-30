/**
 * Centralized financial rates and assumptions
 * 
 * TODO: Pull these dynamically from API in future:
 * - HYSA rates: Bankrate API or scrape
 * - Fed funds: FRED API (free)
 * - Market returns: Keep as configurable assumption
 * 
 * Last updated: 2026-01-30
 */

// Market assumptions
export const EXPECTED_MARKET_RETURN = 0.07; // 7% long-term average
export const EXPECTED_MARKET_RETURN_PERCENT = 7;

// High-Yield Savings Account rates (update monthly)
export const HYSA_APY = 0.045; // 4.5%
export const HYSA_APY_PERCENT = 4.5;

// Top HYSA providers with current rates
export const HYSA_PROVIDERS = [
  { name: 'UFB Direct', rate: 5.25 },
  { name: 'Pibank', rate: 5.10 },
  { name: 'Varo', rate: 5.00 },
  { name: 'Wealthfront Cash', rate: 4.50 },
  { name: 'Marcus by Goldman Sachs', rate: 4.40 },
] as const;

// Inflation assumption
export const INFLATION_RATE = 0.03; // 3%

// Safe withdrawal rate for retirement
export const SAFE_WITHDRAWAL_RATE = 0.04; // 4%

// Social Security COLA estimate
export const SS_COLA_ESTIMATE = 0.025; // 2.5%

import type { Express, RequestHandler } from "express";
import yahooFinance from "yahoo-finance2";

interface MarketData {
  indices: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
  gainers: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
  }>;
  losers: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
  }>;
  sectors: Array<{
    name: string;
    changePercent: number;
  }>;
  lastUpdated: string;
}

let cachedMarketData: MarketData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
];

const SECTOR_ETFS = [
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLV", name: "Healthcare" },
  { symbol: "XLF", name: "Financials" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLY", name: "Consumer" },
  { symbol: "XLI", name: "Industrials" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLRE", name: "Real Estate" },
];

interface QuoteResult {
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  symbol?: string;
  shortName?: string;
}

async function fetchQuote(symbol: string): Promise<QuoteResult | null> {
  try {
    const quote = await yahooFinance.quote(symbol);
    return quote as QuoteResult;
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

async function fetchGainersLosers(): Promise<{ gainers: any[]; losers: any[] }> {
  const fetchScreener = async (scrIds: string): Promise<any[]> => {
    try {
      const result = await yahooFinance.screener(
        { scrIds, count: 10 },
        { validateResult: false }
      );
      return (result as any)?.quotes || [];
    } catch (error: any) {
      if (error?.result?.quotes) {
        console.log(`[Market Pulse] Using partial data for ${scrIds}`);
        return error.result.quotes;
      }
      console.error(`Failed to fetch ${scrIds}:`, error?.message || error);
      return [];
    }
  };

  try {
    const [gainers, losers] = await Promise.all([
      fetchScreener("day_gainers"),
      fetchScreener("day_losers"),
    ]);
    console.log(`[Market Pulse] Fetched ${gainers.length} gainers, ${losers.length} losers`);
    return { gainers, losers };
  } catch (error) {
    console.error("Failed to fetch gainers/losers:", error);
    return { gainers: [], losers: [] };
  }
}

async function fetchMarketData(): Promise<MarketData> {
  const now = Date.now();
  
  if (cachedMarketData && now - cacheTimestamp < CACHE_DURATION) {
    return cachedMarketData;
  }

  console.log("[Market Pulse] Fetching fresh market data...");

  const [indicesQuotes, sectorQuotes, gainersLosers] = await Promise.all([
    Promise.all(INDICES.map(async (idx) => {
      const quote = await fetchQuote(idx.symbol);
      const price = typeof quote?.regularMarketPrice === 'number' ? quote.regularMarketPrice : 0;
      const change = typeof quote?.regularMarketChange === 'number' ? quote.regularMarketChange : 0;
      const changePercent = typeof quote?.regularMarketChangePercent === 'number' ? quote.regularMarketChangePercent : 0;
      return {
        symbol: idx.symbol,
        name: idx.name,
        price,
        change,
        changePercent,
      };
    })),
    Promise.all(SECTOR_ETFS.map(async (sector) => {
      const quote = await fetchQuote(sector.symbol);
      const changePercent = typeof quote?.regularMarketChangePercent === 'number' ? quote.regularMarketChangePercent : 0;
      return {
        name: sector.name,
        changePercent,
      };
    })),
    fetchGainersLosers(),
  ]);

  const marketData: MarketData = {
    indices: indicesQuotes.filter(q => q.price > 0),
    gainers: gainersLosers.gainers.slice(0, 5).map(q => ({
      symbol: String(q.symbol || "N/A"),
      name: String(q.shortName || q.symbol || "Unknown"),
      price: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : 0,
      changePercent: typeof q.regularMarketChangePercent === 'number' ? q.regularMarketChangePercent : 0,
    })),
    losers: gainersLosers.losers.slice(0, 5).map(q => ({
      symbol: String(q.symbol || "N/A"),
      name: String(q.shortName || q.symbol || "Unknown"),
      price: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : 0,
      changePercent: typeof q.regularMarketChangePercent === 'number' ? q.regularMarketChangePercent : 0,
    })),
    sectors: sectorQuotes.sort((a, b) => b.changePercent - a.changePercent),
    lastUpdated: new Date().toISOString(),
  };

  cachedMarketData = marketData;
  cacheTimestamp = now;
  
  console.log("[Market Pulse] Data cached successfully");
  return marketData;
}

export function registerMarketPulseRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get("/api/market-data", isAuthenticated, async (_req, res) => {
    try {
      const data = await fetchMarketData();
      res.json(data);
    } catch (error) {
      console.error("[Market Pulse] Error:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  app.post("/api/market-data/refresh", isAuthenticated, async (_req, res) => {
    try {
      cachedMarketData = null;
      cacheTimestamp = 0;
      const data = await fetchMarketData();
      res.json(data);
    } catch (error) {
      console.error("[Market Pulse] Refresh error:", error);
      res.status(500).json({ error: "Failed to refresh market data" });
    }
  });
}

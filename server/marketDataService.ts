import axios from 'axios';

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: Date;
  source: 'alphavantage' | 'coingecko';
}

interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000;
const quoteCache = new Map<string, CacheEntry<Quote>>();
const historicalCache = new Map<string, CacheEntry<HistoricalPrice[]>>();

const CRYPTO_SYMBOLS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'XRP': 'ripple',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'SHIB': 'shiba-inu',
};

function isCrypto(symbol: string): boolean {
  return symbol.toUpperCase() in CRYPTO_SYMBOLS;
}

function getCryptoId(symbol: string): string {
  return CRYPTO_SYMBOLS[symbol.toUpperCase()] || symbol.toLowerCase();
}

async function fetchAlphaVantageQuote(symbol: string): Promise<Quote | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.warn('ALPHA_VANTAGE_API_KEY not configured');
    return null;
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await axios.get(url);
    const data = response.data['Global Quote'];
    
    if (!data || Object.keys(data).length === 0) {
      console.warn(`No data returned for symbol: ${symbol}`);
      return null;
    }

    return {
      symbol: data['01. symbol'] || symbol,
      price: parseFloat(data['05. price']) || 0,
      change: parseFloat(data['09. change']) || 0,
      changePercent: parseFloat((data['10. change percent'] || '0').replace('%', '')) || 0,
      volume: parseInt(data['06. volume']) || 0,
      high: parseFloat(data['03. high']) || 0,
      low: parseFloat(data['04. low']) || 0,
      open: parseFloat(data['02. open']) || 0,
      previousClose: parseFloat(data['08. previous close']) || 0,
      lastUpdated: new Date(),
      source: 'alphavantage',
    };
  } catch (error) {
    console.error(`Error fetching Alpha Vantage quote for ${symbol}:`, error);
    return null;
  }
}

async function fetchCoinGeckoQuote(symbol: string): Promise<Quote | null> {
  try {
    const coinId = getCryptoId(symbol);
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !data.market_data) {
      console.warn(`No data returned for crypto: ${symbol}`);
      return null;
    }

    const marketData = data.market_data;
    return {
      symbol: symbol.toUpperCase(),
      price: marketData.current_price?.usd || 0,
      change: marketData.price_change_24h || 0,
      changePercent: marketData.price_change_percentage_24h || 0,
      volume: marketData.total_volume?.usd || 0,
      high: marketData.high_24h?.usd || 0,
      low: marketData.low_24h?.usd || 0,
      open: marketData.current_price?.usd || 0,
      previousClose: (marketData.current_price?.usd || 0) - (marketData.price_change_24h || 0),
      lastUpdated: new Date(),
      source: 'coingecko',
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko quote for ${symbol}:`, error);
    return null;
  }
}

async function fetchAlphaVantageHistory(symbol: string, days: number): Promise<HistoricalPrice[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.warn('ALPHA_VANTAGE_API_KEY not configured');
    return [];
  }

  try {
    const outputSize = days > 100 ? 'full' : 'compact';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${apiKey}`;
    const response = await axios.get(url);
    const timeSeries = response.data['Time Series (Daily)'];
    
    if (!timeSeries) {
      console.warn(`No historical data returned for symbol: ${symbol}`);
      return [];
    }

    const prices: HistoricalPrice[] = [];
    const dates = Object.keys(timeSeries).sort().reverse().slice(0, days);
    
    for (const date of dates) {
      const dayData = timeSeries[date];
      prices.push({
        date,
        open: parseFloat(dayData['1. open']) || 0,
        high: parseFloat(dayData['2. high']) || 0,
        low: parseFloat(dayData['3. low']) || 0,
        close: parseFloat(dayData['4. close']) || 0,
        volume: parseInt(dayData['5. volume']) || 0,
      });
    }

    return prices.reverse();
  } catch (error) {
    console.error(`Error fetching Alpha Vantage history for ${symbol}:`, error);
    return [];
  }
}

async function fetchCoinGeckoHistory(symbol: string, days: number): Promise<HistoricalPrice[]> {
  try {
    const coinId = getCryptoId(symbol);
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !data.prices) {
      console.warn(`No historical data returned for crypto: ${symbol}`);
      return [];
    }

    const prices: HistoricalPrice[] = [];
    const priceData = data.prices;
    const volumeData = data.total_volumes || [];
    
    for (let i = 0; i < priceData.length; i++) {
      const [timestamp, price] = priceData[i];
      const volume = volumeData[i] ? volumeData[i][1] : 0;
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      prices.push({
        date,
        open: price,
        high: price,
        low: price,
        close: price,
        volume,
      });
    }

    return prices;
  } catch (error) {
    console.error(`Error fetching CoinGecko history for ${symbol}:`, error);
    return [];
  }
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const normalizedSymbol = symbol.toUpperCase();
  const cacheKey = normalizedSymbol;
  
  const cached = quoteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  let quote: Quote | null = null;
  
  if (isCrypto(normalizedSymbol)) {
    quote = await fetchCoinGeckoQuote(normalizedSymbol);
  } else {
    quote = await fetchAlphaVantageQuote(normalizedSymbol);
  }

  if (quote) {
    quoteCache.set(cacheKey, { data: quote, timestamp: Date.now() });
  }

  return quote;
}

export async function getMultipleQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const results = new Map<string, Quote>();
  
  const cryptoSymbols: string[] = [];
  const stockSymbols: string[] = [];
  
  for (const symbol of symbols) {
    const normalized = symbol.toUpperCase();
    if (isCrypto(normalized)) {
      cryptoSymbols.push(normalized);
    } else {
      stockSymbols.push(normalized);
    }
  }

  if (cryptoSymbols.length > 0) {
    const uncachedCrypto: string[] = [];
    
    for (const symbol of cryptoSymbols) {
      const cached = quoteCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        results.set(symbol, cached.data);
      } else {
        uncachedCrypto.push(symbol);
      }
    }
    
    if (uncachedCrypto.length > 0) {
      try {
        const coinIds = uncachedCrypto.map(getCryptoId).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
        const response = await axios.get(url);
        const data = response.data;
        
        for (const symbol of uncachedCrypto) {
          const coinId = getCryptoId(symbol);
          const coinData = data[coinId];
          if (coinData) {
            const quote: Quote = {
              symbol,
              price: coinData.usd || 0,
              change: (coinData.usd || 0) * (coinData.usd_24h_change || 0) / 100,
              changePercent: coinData.usd_24h_change || 0,
              volume: coinData.usd_24h_vol || 0,
              high: 0,
              low: 0,
              open: 0,
              previousClose: 0,
              lastUpdated: new Date(),
              source: 'coingecko',
            };
            results.set(symbol, quote);
            quoteCache.set(symbol, { data: quote, timestamp: Date.now() });
          }
        }
      } catch (error) {
        console.error('Error fetching batch crypto quotes:', error);
      }
    }
  }

  for (const symbol of stockSymbols) {
    const quote = await getQuote(symbol);
    if (quote) {
      results.set(symbol, quote);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  return results;
}

export async function getHistoricalPrices(symbol: string, days: number = 30): Promise<HistoricalPrice[]> {
  const normalizedSymbol = symbol.toUpperCase();
  const cacheKey = `${normalizedSymbol}_${days}`;
  
  const cached = historicalCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  let prices: HistoricalPrice[] = [];
  
  if (isCrypto(normalizedSymbol)) {
    prices = await fetchCoinGeckoHistory(normalizedSymbol, days);
  } else {
    prices = await fetchAlphaVantageHistory(normalizedSymbol, days);
  }

  if (prices.length > 0) {
    historicalCache.set(cacheKey, { data: prices, timestamp: Date.now() });
  }

  return prices;
}

export function clearCache(): void {
  quoteCache.clear();
  historicalCache.clear();
}

export type { Quote, HistoricalPrice };

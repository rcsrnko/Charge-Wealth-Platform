import { useState, useEffect } from 'react';
import styles from './MarketPulse.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

interface SectorData {
  name: string;
  changePercent: number;
}

interface MarketData {
  indices: IndexData[];
  gainers: StockMover[];
  losers: StockMover[];
  sectors: SectorData[];
  lastUpdated: string;
}

export default function MarketPulse() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      
      const endpoint = forceRefresh ? '/api/market-data/refresh' : '/api/market-data';
      const method = forceRefresh ? 'POST' : 'GET';
      
      const response = await fetchWithAuth(endpoint, { method });
      
      if (!response.ok) throw new Error('Failed to fetch market data');
      
      const data = await response.json();
      setMarketData(data);
      setError(null);
    } catch (err) {
      setError('Unable to load market data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, isCrypto = false) => {
    if (isCrypto || price > 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(2);
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error || 'No data available'}</p>
          <button onClick={() => fetchData()} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Market Pulse</h1>
          <p className={styles.subtitle}>Real-time market overview</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.lastUpdated}>
            Last updated: {getTimeAgo(marketData.lastUpdated)}
          </span>
          <button 
            onClick={() => fetchData(true)} 
            className={styles.refreshBtn}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <section className={styles.indicesSection}>
        <h2 className={styles.sectionTitle}>Major Indices & Crypto</h2>
        <div className={styles.indicesGrid}>
          {marketData.indices.map((index) => (
            <div key={index.symbol} className={styles.indexCard}>
              <div className={styles.indexName}>{index.name}</div>
              <div className={styles.indexPrice}>
                {index.symbol.includes('BTC') || index.symbol.includes('ETH') ? '$' : ''}
                {formatPrice(index.price, index.symbol.includes('USD'))}
              </div>
              <div className={`${styles.indexChange} ${index.changePercent >= 0 ? styles.positive : styles.negative}`}>
                {formatChange(index.changePercent)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.moversRow}>
        <section className={styles.moversSection}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.gainersIcon}>▲</span> Top Gainers
          </h2>
          <div className={styles.moversList}>
            {marketData.gainers.length > 0 ? (
              marketData.gainers.map((stock, i) => (
                <div key={stock.symbol} className={styles.moverItem}>
                  <div className={styles.moverRank}>{i + 1}</div>
                  <div className={styles.moverInfo}>
                    <span className={styles.moverSymbol}>{stock.symbol}</span>
                    <span className={styles.moverName}>{stock.name}</span>
                  </div>
                  <div className={styles.moverData}>
                    <span className={styles.moverPrice}>${formatPrice(stock.price)}</span>
                    <span className={`${styles.moverChange} ${styles.positive}`}>
                      {formatChange(stock.changePercent)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noData}>No data available</p>
            )}
          </div>
        </section>

        <section className={styles.moversSection}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.losersIcon}>▼</span> Top Losers
          </h2>
          <div className={styles.moversList}>
            {marketData.losers.length > 0 ? (
              marketData.losers.map((stock, i) => (
                <div key={stock.symbol} className={styles.moverItem}>
                  <div className={styles.moverRank}>{i + 1}</div>
                  <div className={styles.moverInfo}>
                    <span className={styles.moverSymbol}>{stock.symbol}</span>
                    <span className={styles.moverName}>{stock.name}</span>
                  </div>
                  <div className={styles.moverData}>
                    <span className={styles.moverPrice}>${formatPrice(stock.price)}</span>
                    <span className={`${styles.moverChange} ${styles.negative}`}>
                      {formatChange(stock.changePercent)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noData}>No data available</p>
            )}
          </div>
        </section>
      </div>

      <section className={styles.sectorsSection}>
        <h2 className={styles.sectionTitle}>Sector Performance</h2>
        <div className={styles.sectorsGrid}>
          {marketData.sectors.map((sector) => (
            <div 
              key={sector.name} 
              className={`${styles.sectorCard} ${sector.changePercent >= 0 ? styles.sectorPositive : styles.sectorNegative}`}
            >
              <span className={styles.sectorName}>{sector.name}</span>
              <span className={styles.sectorChange}>
                {formatChange(sector.changePercent)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.commentarySection}>
        <div className={styles.commentaryCard}>
          <div className={styles.commentaryHeader}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.commentaryIcon}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <h3>What We're Watching</h3>
          </div>
          <p className={styles.commentaryText}>
            Market analysis updating...
          </p>
          <span className={styles.commentaryNote}>AI-powered insights coming soon</span>
        </div>
      </section>
    </div>
  );
}

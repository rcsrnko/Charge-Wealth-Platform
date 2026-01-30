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

interface WatchlistItem {
  id: number;
  category: string;
  label: string;
  description?: string;
  sortOrder: number;
}

interface Watchlist {
  stocks: WatchlistItem[];
  sectors: WatchlistItem[];
  themes: WatchlistItem[];
  watching: WatchlistItem[];
}

export default function MarketPulse() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newItem, setNewItem] = useState({ category: '', label: '', description: '' });

  const fetchWatchlist = async () => {
    try {
      const response = await fetchWithAuth('/api/market-data/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  };

  const addWatchlistItem = async (category: string, label: string, description?: string) => {
    try {
      const response = await fetchWithAuth('/api/market-data/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, label, description }),
      });
      if (response.ok) {
        fetchWatchlist();
        setNewItem({ category: '', label: '', description: '' });
      }
    } catch (err) {
      console.error('Failed to add watchlist item:', err);
    }
  };

  const deleteWatchlistItem = async (id: number) => {
    try {
      const response = await fetchWithAuth(`/api/market-data/watchlist/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchWatchlist();
      }
    } catch (err) {
      console.error('Failed to delete watchlist item:', err);
    }
  };

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
    fetchWatchlist();
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

      {/* Sector Performance - moved above gainers/losers */}
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

      {/* What CFOAnon is Watching */}
      <section className={styles.watchingSection}>
        <div className={styles.watchingHeader}>
          <div className={styles.watchingTitleGroup}>
            <h2 className={styles.sectionTitle}>👀 What CFOAnon is Watching</h2>
            <a 
              href="https://x.com/CFOAnon" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.twitterLink}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @CFOAnon
            </a>
          </div>
          <button 
            className={styles.editBtn} 
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className={styles.watchingGrid}>
          {watchlist?.watching.map((item) => (
            <div key={item.id} className={styles.watchingCard}>
              <span className={styles.watchingEmoji}>📊</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
              {editMode && (
                <button 
                  className={styles.deleteBtn}
                  onClick={() => deleteWatchlistItem(item.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {marketData.indices.some(idx => idx.name === 'VIX' && idx.price > 20) && (
            <div className={styles.watchingCard}>
              <span className={styles.watchingEmoji}>🔴</span>
              <div>
                <strong>Elevated Volatility</strong>
                <p>VIX above 20 suggests uncertainty. Consider rebalancing.</p>
              </div>
            </div>
          )}
          {editMode && (
            <div className={styles.addItemCard}>
              <input
                type="text"
                placeholder="Title"
                value={newItem.category === 'watching' ? newItem.label : ''}
                onChange={(e) => setNewItem({ ...newItem, category: 'watching', label: e.target.value })}
                className={styles.addInput}
              />
              <input
                type="text"
                placeholder="Description"
                value={newItem.category === 'watching' ? newItem.description : ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className={styles.addInput}
              />
              <button 
                className={styles.addBtn}
                onClick={() => newItem.label && addWatchlistItem('watching', newItem.label, newItem.description)}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CFOAnon's Watchlist - stocks/sectors we're tracking */}
      <section className={styles.watchlistSection}>
        <h2 className={styles.sectionTitle}>📌 CFOAnon's Watchlist</h2>
        <div className={styles.watchlistGrid}>
          <div className={styles.watchlistCategory}>
            <h3 className={styles.watchlistCategoryTitle}>Stocks</h3>
            <div className={styles.watchlistTickers}>
              {watchlist?.stocks.map((item) => (
                <span key={item.id} className={styles.watchlistTicker}>
                  {item.label}
                  {editMode && (
                    <button className={styles.tickerDelete} onClick={() => deleteWatchlistItem(item.id)}>×</button>
                  )}
                </span>
              ))}
              {editMode && (
                <input
                  type="text"
                  placeholder="+ Add"
                  className={styles.tickerInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addWatchlistItem('stocks', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              )}
            </div>
          </div>
          <div className={styles.watchlistCategory}>
            <h3 className={styles.watchlistCategoryTitle}>Sectors</h3>
            <div className={styles.watchlistTickers}>
              {watchlist?.sectors.map((item) => (
                <span key={item.id} className={styles.watchlistTicker}>
                  {item.label}
                  {editMode && (
                    <button className={styles.tickerDelete} onClick={() => deleteWatchlistItem(item.id)}>×</button>
                  )}
                </span>
              ))}
              {editMode && (
                <input
                  type="text"
                  placeholder="+ Add"
                  className={styles.tickerInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addWatchlistItem('sectors', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              )}
            </div>
          </div>
          <div className={styles.watchlistCategory}>
            <h3 className={styles.watchlistCategoryTitle}>Themes</h3>
            <div className={styles.watchlistTickers}>
              {watchlist?.themes.map((item) => (
                <span key={item.id} className={styles.watchlistTicker}>
                  {item.label}
                  {editMode && (
                    <button className={styles.tickerDelete} onClick={() => deleteWatchlistItem(item.id)}>×</button>
                  )}
                </span>
              ))}
              {editMode && (
                <input
                  type="text"
                  placeholder="+ Add"
                  className={styles.tickerInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addWatchlistItem('themes', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              )}
            </div>
          </div>
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

    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import styles from './ChargeAllocation.module.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { EXPECTED_MARKET_RETURN } from '../constants/rates';

interface Position {
  id: number;
  symbol: string;
  companyName: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  holdingPeriod: string;
  accountType: string;
  source: string;
  lastUpdated: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalUnrealizedGain: number;
  positions: Position[];
  allocation: {
    equity: number;
    fixedIncome: number;
    cash: number;
    alternatives: number;
  };
  riskMetrics: {
    concentrationRisk: string;
    topHoldingWeight: number;
    top3Weight: number;
    taxExposure: number;
  };
  lastUpdated: string;
}

interface PriceHistory {
  date: string;
  close: number;
}

interface PriceAlert {
  id: number;
  symbol: string;
  alertType: string;
  targetPrice: number;
  isActive: boolean;
}

interface Thesis {
  symbol: string;
  thesis: string;
  riskFactors: Array<{ factor: string; severity: string; description: string }>;
  taxConsiderations: {
    holdingPeriod: string;
    unrealizedGain: number;
    taxImpact: string;
  };
  profileFitScore: number;
  profileFitNotes: string;
}

interface PortfolioInsight {
  type: 'action' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: string;
  action: string;
}

export default function ChargeAllocation() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newPosition, setNewPosition] = useState({ symbol: '', shares: '', costBasis: '' });
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [historyDays, setHistoryDays] = useState(30);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlert, setNewAlert] = useState({ symbol: '', alertType: 'price_above', targetPrice: '' });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const generateInsights = (): PortfolioInsight[] => {
    if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) return [];

    const insights: PortfolioInsight[] = [];

    // Concentration risk insight - use real data
    if (portfolio.riskMetrics?.topHoldingWeight > 25) {
      const topPosition = portfolio.positions.reduce((max, p) =>
        (p.currentValue > max.currentValue) ? p : max, portfolio.positions[0]);
      const potentialLoss = Math.round(topPosition.currentValue * 0.2);
      insights.push({
        type: 'warning',
        title: `Concentration Risk: ${topPosition.symbol} is ${portfolio.riskMetrics.topHoldingWeight.toFixed(0)}% of portfolio`,
        description: `Your largest position exceeds the 25% threshold. A 20% drop would cost you ${formatCurrency(potentialLoss)}.`,
        impact: 'Reduce volatility',
        action: 'Review Rebalance Options'
      });
    }

    // Tax-loss harvesting insight - use real positions with losses
    const positionsWithLosses = portfolio.positions.filter(p => p.unrealizedGain < 0);
    if (positionsWithLosses.length > 0) {
      const totalLosses = positionsWithLosses.reduce((sum, p) => sum + Math.abs(p.unrealizedGain), 0);
      const potentialTaxSavings = Math.round(totalLosses * 0.24); // Estimate at 24% bracket
      insights.push({
        type: 'opportunity',
        title: 'Tax-loss harvesting available',
        description: `${positionsWithLosses.length} position${positionsWithLosses.length > 1 ? 's have' : ' has'} losses you can harvest to offset gains.`,
        impact: `Potential savings: ${formatCurrency(potentialTaxSavings)}`,
        action: 'See Tax Strategy'
      });
    }

    // Cash allocation insight - use real data
    if (portfolio.allocation?.cash > 10) {
      const excessCash = portfolio.totalValue * ((portfolio.allocation.cash - 5) / 100);
      const potentialReturn = Math.round(excessCash * EXPECTED_MARKET_RETURN);
      insights.push({
        type: 'action',
        title: 'Cash allocation above target',
        description: `You have ${portfolio.allocation.cash.toFixed(0)}% in cash vs. 5% target. Deploying excess could earn more.`,
        impact: `Potential: +${formatCurrency(potentialReturn)}/year`,
        action: 'Deploy Cash'
      });
    }

    // Tax exposure warning - use real data
    if (portfolio.riskMetrics?.taxExposure > 10000) {
      insights.push({
        type: 'warning',
        title: 'Significant unrealized tax liability',
        description: `You have ${formatCurrency(portfolio.riskMetrics.taxExposure)} in potential capital gains taxes if you sold today.`,
        impact: 'Plan for tax impact',
        action: 'Review Tax Strategy'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const loadPortfolio = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const response = await fetchWithAuth('/api/allocation/portfolio');
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.portfolio);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const loadPriceAlerts = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/price-alerts');
      if (response.ok) {
        const data = await response.json();
        setPriceAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Failed to load price alerts:', err);
    }
  }, []);

  const loadPriceHistory = useCallback(async (symbol: string, days: number) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetchWithAuth(`/api/allocation/history/${symbol}?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load price history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
    loadPriceAlerts();
    
    const interval = setInterval(() => {
      loadPortfolio(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadPortfolio, loadPriceAlerts]);

  useEffect(() => {
    if (selectedPosition) {
      loadPriceHistory(selectedPosition.symbol, historyDays);
    }
  }, [selectedPosition, historyDays, loadPriceHistory]);

  const analyzePosition = async (position: Position) => {
    setSelectedPosition(position);
    setIsAnalyzing(true);
    setThesis(null);

    try {
      const response = await fetchWithAuth('/api/allocation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: position.symbol, positionId: position.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setThesis(data.thesis);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addPosition = async () => {
    if (!newPosition.symbol || !newPosition.shares) return;

    try {
      const response = await fetchWithAuth('/api/allocation/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newPosition.symbol.toUpperCase(),
          shares: parseFloat(newPosition.shares),
          costBasis: parseFloat(newPosition.costBasis) || 0,
        }),
      });

      if (response.ok) {
        loadPortfolio();
        setShowAddPosition(false);
        setNewPosition({ symbol: '', shares: '', costBasis: '' });
      }
    } catch (err) {
      console.error('Failed to add position:', err);
    }
  };

  const createPriceAlert = async () => {
    if (!newAlert.symbol || !newAlert.targetPrice) return;

    try {
      const response = await fetchWithAuth('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newAlert.symbol.toUpperCase(),
          alertType: newAlert.alertType,
          targetPrice: parseFloat(newAlert.targetPrice),
        }),
      });

      if (response.ok) {
        loadPriceAlerts();
        setShowAlertModal(false);
        setNewAlert({ symbol: '', alertType: 'price_above', targetPrice: '' });
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  const deletePriceAlert = async (alertId: number) => {
    try {
      await fetchWithAuth(`/api/price-alerts/${alertId}`, {
        method: 'DELETE',
      });
      loadPriceAlerts();
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTimeAgo = (date: Date | null) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Portfolio Command Center</h1>
          <p className={styles.subtitle}>Real-time prices updated every 5 minutes</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.refreshStatus}>
            {isRefreshing && <span className={styles.refreshingBadge}>Refreshing...</span>}
            {lastRefresh && !isRefreshing && (
              <span className={styles.lastRefresh}>Updated {getTimeAgo(lastRefresh)}</span>
            )}
            <button 
              className={styles.refreshButton}
              onClick={() => loadPortfolio(true)}
              disabled={isRefreshing}
            >
              Refresh
            </button>
          </div>
          <button 
            className={styles.alertButton}
            onClick={() => setShowAlertModal(true)}
          >
            Set Alert
          </button>
          <button 
            className={styles.addButton}
            onClick={() => setShowAddPosition(true)}
          >
            + Add Position
          </button>
        </div>
      </div>

      {showAddPosition && (
        <div className={styles.addPositionModal}>
          <div className={styles.modalContent}>
            <h3>Add Position</h3>
            <p className={styles.modalSubtext}>We'll calculate your gain/loss and tax exposure automatically</p>
            <div className={styles.formGrid}>
              <label>
                Ticker Symbol
                <input
                  type="text"
                  value={newPosition.symbol}
                  onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value})}
                  placeholder="AAPL"
                />
              </label>
              <label>
                Shares Owned
                <input
                  type="number"
                  value={newPosition.shares}
                  onChange={(e) => setNewPosition({...newPosition, shares: e.target.value})}
                  placeholder="100"
                />
              </label>
              <label>
                Total Cost Basis
                <input
                  type="number"
                  value={newPosition.costBasis}
                  onChange={(e) => setNewPosition({...newPosition, costBasis: e.target.value})}
                  placeholder="15000"
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowAddPosition(false)}>Cancel</button>
              <button className={styles.primaryButton} onClick={addPosition}>Add & Analyze</button>
            </div>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className={styles.addPositionModal}>
          <div className={styles.modalContent}>
            <h3>Set Price Alert</h3>
            <p className={styles.modalSubtext}>Get notified when a stock or crypto hits your target</p>
            <div className={styles.formGrid}>
              <label>
                Symbol
                <input
                  type="text"
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({...newAlert, symbol: e.target.value})}
                  placeholder="AAPL or BTC"
                />
              </label>
              <label>
                Alert Type
                <select
                  value={newAlert.alertType}
                  onChange={(e) => setNewAlert({...newAlert, alertType: e.target.value})}
                >
                  <option value="price_above">Price goes above</option>
                  <option value="price_below">Price goes below</option>
                </select>
              </label>
              <label>
                Target Price
                <input
                  type="number"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
                  placeholder="150.00"
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowAlertModal(false)}>Cancel</button>
              <button className={styles.primaryButton} onClick={createPriceAlert}>Create Alert</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.mainPanel}>
          {portfolio ? (
            <>
              <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Portfolio Value</span>
                  <span className={styles.summaryValue}>{formatCurrency(portfolio.totalValue)}</span>
                  <span className={`${styles.summaryChange} ${portfolio.totalUnrealizedGain >= 0 ? styles.positive : styles.negative}`}>
                    {formatPercent(portfolio.totalValue > 0 ? (portfolio.totalUnrealizedGain / (portfolio.totalValue - portfolio.totalUnrealizedGain)) * 100 : 0)} total
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Unrealized Gains</span>
                  <span className={`${styles.summaryValue} ${portfolio.totalUnrealizedGain >= 0 ? styles.positive : styles.negative}`}>
                    {formatCurrency(portfolio.totalUnrealizedGain)}
                  </span>
                  <span className={styles.summarySubtext}>Taxable if sold</span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Tax Exposure</span>
                  <span className={styles.summaryValue}>{formatCurrency(portfolio.riskMetrics.taxExposure)}</span>
                  <span className={styles.summarySubtext}>If you sell everything</span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Concentration</span>
                  <span className={`${styles.summaryValue} ${portfolio.riskMetrics.concentrationRisk === 'high' ? styles.warning : ''}`}>
                    {portfolio.riskMetrics.concentrationRisk}
                  </span>
                  <span className={styles.summarySubtext}>
                    Top 3: {portfolio.riskMetrics.top3Weight?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>

              {priceAlerts.length > 0 && (
                <div className={styles.alertsSection}>
                  <h3 className={styles.sectionTitle}>Active Price Alerts</h3>
                  <div className={styles.alertsList}>
                    {priceAlerts.filter(a => a.isActive).map((alert) => (
                      <div key={alert.id} className={styles.alertItem}>
                        <span className={styles.alertSymbol}>{alert.symbol}</span>
                        <span className={styles.alertCondition}>
                          {alert.alertType === 'price_above' ? 'Above' : 'Below'} {formatPrice(alert.targetPrice)}
                        </span>
                        <button className={styles.alertDelete} onClick={() => deletePriceAlert(alert.id)}>x</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.length > 0 && (
                <div className={styles.insightsSection}>
                  <h3 className={styles.sectionTitle}>What You Should Know</h3>
                  <div className={styles.insightsList}>
                    {insights.map((insight, i) => (
                      <div key={i} className={`${styles.insightCard} ${styles[insight.type]}`}>
                        <div className={styles.insightContent}>
                          <h4>{insight.title}</h4>
                          <p>{insight.description}</p>
                        </div>
                        <div className={styles.insightAction}>
                          <span className={styles.insightImpact}>{insight.impact}</span>
                          <button className={styles.insightCta}>{insight.action}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.allocationSection}>
                <h3 className={styles.sectionTitle}>Asset Allocation</h3>
                <div className={styles.allocationContent}>
                  <div className={styles.allocationBar}>
                    <div 
                      className={styles.equitySegment} 
                      style={{ width: `${portfolio.allocation.equity}%` }}
                    />
                    <div 
                      className={styles.fixedSegment} 
                      style={{ width: `${portfolio.allocation.fixedIncome}%` }}
                    />
                    <div 
                      className={styles.cashSegment} 
                      style={{ width: `${portfolio.allocation.cash}%` }}
                    />
                    <div 
                      className={styles.altSegment} 
                      style={{ width: `${portfolio.allocation.alternatives}%` }}
                    />
                  </div>
                  <div className={styles.allocationLegend}>
                    <span><span className={styles.equityDot}></span> Stocks {portfolio.allocation.equity}%</span>
                    <span><span className={styles.fixedDot}></span> Bonds {portfolio.allocation.fixedIncome}%</span>
                    <span><span className={styles.cashDot}></span> Cash {portfolio.allocation.cash}%</span>
                    <span><span className={styles.altDot}></span> Other {portfolio.allocation.alternatives}%</span>
                  </div>
                </div>
              </div>

              <div className={styles.positionsSection}>
                <div className={styles.positionsHeader}>
                  <h3 className={styles.sectionTitle}>Your Holdings</h3>
                  <span className={styles.positionsCount}>{portfolio.positions.length} positions</span>
                </div>
                <div className={styles.positionsTable}>
                  <div className={styles.tableHeader}>
                    <span>Position</span>
                    <span>Price</span>
                    <span>Today</span>
                    <span>Value</span>
                    <span>Gain/Loss</span>
                    <span></span>
                  </div>
                  {portfolio.positions.map((position) => {
                    const weight = portfolio.totalValue > 0 
                      ? (position.currentValue / portfolio.totalValue) * 100 
                      : 0;
                    return (
                      <div key={position.id}>
                        <div 
                          className={`${styles.tableRow} ${selectedPosition?.id === position.id ? styles.selected : ''}`}
                        >
                          <span className={styles.symbolCell}>
                            <strong>{position.symbol}</strong>
                            <small>{position.shares} shares</small>
                          </span>
                          <span className={styles.priceCell}>
                            <span>{formatPrice(position.currentPrice || 0)}</span>
                            <small className={styles.sourceLabel}>{position.source || 'cached'}</small>
                          </span>
                          <span className={`${styles.dailyCell} ${position.priceChange >= 0 ? styles.positive : styles.negative}`}>
                            <span>{position.priceChange >= 0 ? '+' : ''}{formatPrice(position.priceChange || 0)}</span>
                            <small>{formatPercent(position.priceChangePercent || 0)}</small>
                          </span>
                          <span className={styles.valueCell}>
                            <span>{formatCurrency(position.currentValue || 0)}</span>
                            <small>{weight.toFixed(1)}% of portfolio</small>
                          </span>
                          <span className={`${styles.gainCell} ${position.unrealizedGain >= 0 ? styles.positive : styles.negative}`}>
                            <span>{formatCurrency(position.unrealizedGain || 0)}</span>
                            <small>{formatPercent(position.unrealizedGainPercent || 0)}</small>
                          </span>
                          <span>
                            <button 
                              className={styles.analyzeButton}
                              onClick={() => analyzePosition(position)}
                            >
                              Deep Dive
                            </button>
                          </span>
                        </div>
                        <div className={styles.positionCard}>
                          <div className={styles.positionCardHeader}>
                            <div>
                              <span className={styles.positionCardSymbol}>{position.symbol}</span>
                              <span className={styles.positionCardShares}>{position.shares} shares</span>
                            </div>
                            <div className={styles.positionCardPrice}>
                              <span className={styles.positionCardCurrentPrice}>{formatPrice(position.currentPrice || 0)}</span>
                              <span className={`${styles.positionCardChange} ${position.priceChange >= 0 ? styles.positive : styles.negative}`}>
                                {position.priceChange >= 0 ? '+' : ''}{formatPrice(position.priceChange || 0)} ({formatPercent(position.priceChangePercent || 0)})
                              </span>
                            </div>
                          </div>
                          <div className={styles.positionCardStats}>
                            <div className={styles.positionCardStat}>
                              <span className={styles.positionCardStatLabel}>Value</span>
                              <span className={styles.positionCardStatValue}>{formatCurrency(position.currentValue || 0)}</span>
                            </div>
                            <div className={styles.positionCardStat}>
                              <span className={styles.positionCardStatLabel}>Weight</span>
                              <span className={styles.positionCardStatValue}>{weight.toFixed(1)}%</span>
                            </div>
                            <div className={styles.positionCardStat}>
                              <span className={styles.positionCardStatLabel}>Gain/Loss</span>
                              <span className={`${styles.positionCardStatValue} ${position.unrealizedGain >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(position.unrealizedGain || 0)}
                              </span>
                            </div>
                            <div className={styles.positionCardStat}>
                              <span className={styles.positionCardStatLabel}>Return</span>
                              <span className={`${styles.positionCardStatValue} ${position.unrealizedGainPercent >= 0 ? styles.positive : styles.negative}`}>
                                {formatPercent(position.unrealizedGainPercent || 0)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.positionCardActions}>
                            <button 
                              className={styles.analyzeButton}
                              onClick={() => analyzePosition(position)}
                            >
                              Deep Dive
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.blurredChartPreview}>
                <svg viewBox="0 0 200 200" className={styles.samplePieChart}>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(201,169,98,0.1)" strokeWidth="40"/>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(201,169,98,0.3)" strokeWidth="40" strokeDasharray="150 503" strokeDashoffset="0"/>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(201,169,98,0.5)" strokeWidth="40" strokeDasharray="100 503" strokeDashoffset="-150"/>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(201,169,98,0.7)" strokeWidth="40" strokeDasharray="80 503" strokeDashoffset="-250"/>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(201,169,98,0.9)" strokeWidth="40" strokeDasharray="70 503" strokeDashoffset="-330"/>
                </svg>
                <div className={styles.chartOverlay}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.lockChartIcon}>
                    <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
              </div>
              
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>See Exactly What Your Money Is Doing</h3>
              <p>
                Add your holdings to get AI-powered insights on concentration risk, 
                tax exposure, and optimization opportunities worth thousands.
              </p>
              
              <div className={styles.hiddenFeesHook}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>See how much you're paying in hidden fees</span>
              </div>
              
              <div className={styles.emptyBenefits}>
                <span>Know your true tax exposure</span>
                <span>Spot concentration risks</span>
                <span>Find rebalancing opportunities</span>
              </div>
              <button 
                className={styles.addButtonLarge}
                onClick={() => setShowAddPosition(true)}
              >
                Add Your First Position
              </button>
              <span className={styles.emptyFootnote}>Takes 30 seconds. Worth thousands.</span>
            </div>
          )}
        </div>

        {(selectedPosition || thesis) && (
          <div className={styles.analysisPanel}>
            <div className={styles.analysisPanelHeader}>
              <h3>{selectedPosition?.symbol} Deep Dive</h3>
              <button 
                className={styles.closeButton}
                onClick={() => { setSelectedPosition(null); setThesis(null); }}
              >
                &times;
              </button>
            </div>

            {selectedPosition && (
              <div className={styles.priceChartSection}>
                <div className={styles.chartHeader}>
                  <h4>Price History</h4>
                  <div className={styles.chartPeriodButtons}>
                    <button 
                      className={historyDays === 7 ? styles.active : ''} 
                      onClick={() => setHistoryDays(7)}
                    >7D</button>
                    <button 
                      className={historyDays === 30 ? styles.active : ''} 
                      onClick={() => setHistoryDays(30)}
                    >1M</button>
                    <button 
                      className={historyDays === 90 ? styles.active : ''} 
                      onClick={() => setHistoryDays(90)}
                    >3M</button>
                  </div>
                </div>
                {isLoadingHistory ? (
                  <div className={styles.chartLoading}>
                    <LoadingSpinner size="small" text="Loading chart..." />
                  </div>
                ) : priceHistory.length > 0 ? (
                  <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={priceHistory}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#888', fontSize: 10 }}
                          tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tick={{ fill: '#888', fontSize: 10 }}
                          tickFormatter={(val) => `$${val.toFixed(0)}`}
                        />
                        <Tooltip 
                          contentStyle={{ background: '#1A1D28', border: '1px solid #333', borderRadius: 8 }}
                          labelStyle={{ color: '#C9A962' }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#C9A962" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className={styles.noChartData}>No price history available</div>
                )}
              </div>
            )}

            {isAnalyzing ? (
              <div className={styles.loadingState}>
                <LoadingSpinner size="medium" text="Analyzing position..." />
              </div>
            ) : thesis ? (
              <div className={styles.thesisContent}>
                <div className={styles.fitScore}>
                  <div className={styles.fitScoreCircle}>
                    <span className={styles.fitScoreValue}>{thesis.profileFitScore}</span>
                    <span className={styles.fitScoreLabel}>Fit Score</span>
                  </div>
                  <p className={styles.fitScoreDescription}>
                    {thesis.profileFitScore >= 70 ? 'Strong fit for your profile' : 
                     thesis.profileFitScore >= 50 ? 'Moderate fit—review risks' : 
                     'Consider reducing exposure'}
                  </p>
                </div>

                <div className={styles.thesisSection}>
                  <h4>The Bottom Line</h4>
                  <p>{thesis.thesis}</p>
                </div>

                <div className={styles.thesisSection}>
                  <h4>Key Risks to Watch</h4>
                  <div className={styles.riskList}>
                    {thesis.riskFactors.map((risk, i) => (
                      <div key={i} className={`${styles.riskItem} ${styles[risk.severity]}`}>
                        <span className={styles.riskFactor}>{risk.factor}</span>
                        <p>{risk.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.thesisSection}>
                  <h4>If You Sell Today</h4>
                  <div className={styles.taxInfo}>
                    <div className={styles.taxRow}>
                      <span>Holding Period</span>
                      <span className={styles.taxValue}>{thesis.taxConsiderations.holdingPeriod}</span>
                    </div>
                    <div className={styles.taxRow}>
                      <span>Taxable Gain</span>
                      <span className={styles.taxValue}>{formatCurrency(thesis.taxConsiderations.unrealizedGain)}</span>
                    </div>
                    <div className={styles.taxRow}>
                      <span>Estimated Tax</span>
                      <span className={styles.taxValue}>{thesis.taxConsiderations.taxImpact}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.thesisSection}>
                  <h4>Recommendation</h4>
                  <p>{thesis.profileFitNotes}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

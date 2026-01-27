import { useState } from 'react';
import styles from './Dashboard.module.css';

const DEMO_CONTEXT = {
  profile: {
    annualIncome: '350000',
    filingStatus: 'married_joint',
    stateOfResidence: 'CA',
    dependents: 2,
    netWorth: '1500000',
    riskTolerance: 'moderate',
    primaryGoal: 'wealth_building'
  },
  tax: {
    taxYear: 2024,
    totalIncome: 350000,
    agi: 320000,
    taxableIncome: 290000,
    totalFederalTax: 62000,
    effectiveTaxRate: 17.7,
    marginalTaxBracket: 32,
    filingStatus: 'married_joint',
    deductionUsed: 'itemized',
    capitalGainsLongTerm: 25000,
    capitalGainsShortTerm: 5000
  },
  portfolio: {
    totalValue: 850000,
    totalUnrealizedGain: 125000,
    positionCount: 8,
    positions: [
      { id: 1, symbol: 'AAPL', shares: 150, costBasis: 22500, currentValue: 28000, unrealizedGain: 5500, unrealizedGainPercent: 24.4, holdingPeriod: 'long_term' },
      { id: 2, symbol: 'GOOGL', shares: 50, costBasis: 70000, currentValue: 85000, unrealizedGain: 15000, unrealizedGainPercent: 21.4, holdingPeriod: 'long_term' },
      { id: 3, symbol: 'MSFT', shares: 100, costBasis: 35000, currentValue: 42000, unrealizedGain: 7000, unrealizedGainPercent: 20.0, holdingPeriod: 'long_term' },
      { id: 4, symbol: 'NVDA', shares: 80, costBasis: 40000, currentValue: 95000, unrealizedGain: 55000, unrealizedGainPercent: 137.5, holdingPeriod: 'short_term' },
      { id: 5, symbol: 'VOO', shares: 200, costBasis: 80000, currentValue: 95000, unrealizedGain: 15000, unrealizedGainPercent: 18.75, holdingPeriod: 'long_term' },
      { id: 6, symbol: 'VTI', shares: 300, costBasis: 60000, currentValue: 72000, unrealizedGain: 12000, unrealizedGainPercent: 20.0, holdingPeriod: 'long_term' },
      { id: 7, symbol: 'TSLA', shares: 40, costBasis: 12000, currentValue: 9500, unrealizedGain: -2500, unrealizedGainPercent: -20.8, holdingPeriod: 'long_term' },
      { id: 8, symbol: 'BTC', shares: 1.5, costBasis: 45000, currentValue: 65000, unrealizedGain: 20000, unrealizedGainPercent: 44.4, holdingPeriod: 'long_term' }
    ]
  },
  opportunities: [
    {
      type: 'tax_loss_harvest',
      title: 'Tax-Loss Harvesting Available',
      description: 'TSLA has $2,500 in unrealized losses. Harvesting could save ~$800 in taxes at your 32% bracket.',
      impact: 800,
      priority: 'high'
    },
    {
      type: 'retirement_contribution',
      title: 'Maximize 401(k) Contributions',
      description: 'At your 32% marginal rate, maxing your 401(k) at $23,000 saves $7,360 in taxes.',
      impact: 7360,
      priority: 'high'
    },
    {
      type: 'concentration_risk',
      title: 'High Concentration in NVDA',
      description: 'NVDA is 11.2% of your portfolio with large short-term gains. Consider staged selling for tax efficiency.',
      impact: 95000,
      priority: 'medium'
    }
  ],
  status: {
    hasProfile: true,
    hasTaxData: true,
    hasPortfolio: true,
    hasLiquidity: true,
    hasAnalyzedDocuments: true
  }
};

type ModuleType = 'overview' | 'ai-advisor' | 'tax-intel' | 'allocation' | 'playbooks';

export default function DemoDashboard() {
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');

  const modules = [
    { id: 'overview' as ModuleType, name: 'Overview', icon: '📊' },
    { id: 'ai-advisor' as ModuleType, name: 'AI Advisor', icon: '🤖' },
    { id: 'tax-intel' as ModuleType, name: 'Tax Advisor', icon: '📋' },
    { id: 'allocation' as ModuleType, name: 'Portfolio', icon: '📈' },
    { id: 'playbooks' as ModuleType, name: 'Playbooks', icon: '📚' },
  ];

  const renderModule = () => {
    return <DemoOverview context={DEMO_CONTEXT} />;
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.demoBanner}>
        <span>Demo Mode</span> - Viewing sample data. <a href="/">Sign up</a> to connect your own financial data.
      </div>
      
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>Charge<span>Wealth</span></h1>
          <span className={styles.demoTag}>DEMO</span>
        </div>
        
        <ul className={styles.navList}>
          {modules.map((module) => (
            <li key={module.id}>
              <button
                className={`${styles.navItem} ${activeModule === module.id ? styles.active : ''}`}
                onClick={() => setActiveModule(module.id)}
              >
                <span className={styles.navIcon}>{module.icon}</span>
                {module.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className={styles.mainContent} id="main-content">
        {renderModule()}
      </main>
    </div>
  );
}

function DemoOverview({ context }: { context: typeof DEMO_CONTEXT }) {
  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;
  
  return (
    <div className={styles.overviewContainer}>
      <header className={styles.overviewHeader}>
        <h2>Financial Overview</h2>
        <p className={styles.subtitle}>Your AI-powered financial command center</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Income</span>
          <span className={styles.statValue}>{formatCurrency(context.tax.totalIncome)}</span>
          <span className={styles.statSubtext}>2024 Tax Year</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Portfolio Value</span>
          <span className={styles.statValue}>{formatCurrency(context.portfolio.totalValue)}</span>
          <span className={styles.statSubtext}>{context.portfolio.positionCount} positions</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Unrealized Gains</span>
          <span className={`${styles.statValue} ${styles.positive}`}>{formatCurrency(context.portfolio.totalUnrealizedGain)}</span>
          <span className={styles.statSubtext}>+{((context.portfolio.totalUnrealizedGain / (context.portfolio.totalValue - context.portfolio.totalUnrealizedGain)) * 100).toFixed(1)}%</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Effective Tax Rate</span>
          <span className={styles.statValue}>{context.tax.effectiveTaxRate}%</span>
          <span className={styles.statSubtext}>{context.tax.marginalTaxBracket}% marginal bracket</span>
        </div>
      </div>

      <section className={styles.opportunitiesSection}>
        <h3>AI-Detected Opportunities</h3>
        <div className={styles.opportunitiesList}>
          {context.opportunities.map((opp, i) => (
            <div key={i} className={`${styles.opportunityCard} ${styles[opp.priority]}`}>
              <div className={styles.oppHeader}>
                <span className={styles.oppBadge}>
                  {opp.type === 'tax_loss_harvest' ? '📊 Tax' : 
                   opp.type === 'retirement_contribution' ? '💰 401k' :
                   opp.type === 'concentration_risk' ? '⚠️ Risk' : '💡'}
                </span>
                <span className={styles.oppImpact}>
                  {opp.impact > 0 ? `Save ${formatCurrency(opp.impact)}` : 'Action Needed'}
                </span>
              </div>
              <h4>{opp.title}</h4>
              <p>{opp.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.portfolioPreview}>
        <h3>Portfolio Positions</h3>
        <div className={styles.positionsTable}>
          <div className={styles.tableHeader}>
            <span>Symbol</span>
            <span>Shares</span>
            <span>Value</span>
            <span>Gain/Loss</span>
          </div>
          {context.portfolio.positions.map((pos) => (
            <div key={pos.id} className={styles.tableRow}>
              <span className={styles.symbol}>{pos.symbol}</span>
              <span>{pos.shares}</span>
              <span>{formatCurrency(pos.currentValue)}</span>
              <span className={pos.unrealizedGain >= 0 ? styles.positive : styles.negative}>
                {pos.unrealizedGain >= 0 ? '+' : ''}{formatCurrency(pos.unrealizedGain)} ({pos.unrealizedGainPercent.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

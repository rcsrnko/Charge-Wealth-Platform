import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './OpportunityCostCounter.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface CostBreakdown {
  source: string;
  dailyCost: number;
  description: string;
  ctaText: string;
  ctaLink: string;
}

const MAX_401K = 23000;
const MAX_HSA_FAMILY = 8300;
const MAX_HSA_SINGLE = 4150;

function getMarginalTaxRate(income: number, filingStatus: string): number {
  const brackets = filingStatus === 'married_joint' 
    ? [
        { limit: 23200, rate: 0.10 },
        { limit: 94300, rate: 0.12 },
        { limit: 201050, rate: 0.22 },
        { limit: 383900, rate: 0.24 },
        { limit: 487450, rate: 0.32 },
        { limit: 731200, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
      ]
    : [
        { limit: 11600, rate: 0.10 },
        { limit: 47150, rate: 0.12 },
        { limit: 100525, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243725, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
      ];

  for (const bracket of brackets) {
    if (income <= bracket.limit) return bracket.rate;
  }
  return 0.37;
}

function getStateTaxRate(state: string): number {
  const rates: Record<string, number> = {
    'CA': 0.133, 'NY': 0.109, 'NJ': 0.1075, 'OR': 0.099, 'MN': 0.0985,
    'DC': 0.0975, 'VT': 0.0875, 'HI': 0.11, 'WI': 0.0765, 'ME': 0.0715,
    'CT': 0.0699, 'MA': 0.05, 'IL': 0.0495, 'PA': 0.0307,
    'TX': 0, 'FL': 0, 'WA': 0, 'NV': 0, 'WY': 0, 'SD': 0, 'AK': 0, 'TN': 0, 'NH': 0,
  };
  return rates[state] || 0.05;
}

export default function OpportunityCostCounter() {
  const [displayMode, setDisplayMode] = useState<'daily' | 'yearly'>(() => {
    const stored = sessionStorage.getItem('opportunityCostMode');
    return stored === 'yearly' ? 'yearly' : 'daily';
  });
  const [showModal, setShowModal] = useState(false);
  const [animatedCost, setAnimatedCost] = useState(0);
  const [isDismissed, setIsDismissed] = useState(() => {
    const dismissed = localStorage.getItem('opportunityCostDismissed');
    if (!dismissed) return false;
    const dismissedDate = new Date(dismissed);
    const now = new Date();
    const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed < 7;
  });

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem('opportunityCostDismissed', new Date().toISOString());
    fetchWithAuth('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'opportunity_cost_dismissed' }),
    }).catch(() => {});
  };

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/financial-profile'],
  });

  const { data: portfolio } = useQuery<any>({
    queryKey: ['/api/allocation/portfolio'],
  });

  const { data: taxData } = useQuery<any>({
    queryKey: ['/api/tax-intel/current'],
  });

  const calculateCosts = (): { total: number; breakdown: CostBreakdown[] } => {
    const breakdown: CostBreakdown[] = [];
    
    const income = parseFloat(profile?.annualIncome) || 250000;
    const filingStatus = profile?.filingStatus || 'single';
    const state = profile?.stateOfResidence || 'CA';
    const contribution401k = parseFloat(taxData?.taxData?.retirement401k) || 0;
    const hsaContribution = parseFloat(taxData?.taxData?.hsaContribution) || 0;
    const portfolioValue = portfolio?.portfolio?.totalValue || 0;
    
    const federalRate = getMarginalTaxRate(income, filingStatus);
    const stateRate = getStateTaxRate(state);
    const combinedRate = federalRate + stateRate;

    if (contribution401k < MAX_401K) {
      const unused401k = MAX_401K - contribution401k;
      const dailyCost = (unused401k * combinedRate) / 365;
      if (dailyCost > 0.5) {
        breakdown.push({
          source: 'Unmaxed 401(k)',
          dailyCost,
          description: `$${unused401k.toLocaleString()} in unused contributions at ${(combinedRate * 100).toFixed(1)}% combined tax rate`,
          ctaText: 'Max Your 401k Now',
          ctaLink: '/dashboard/playbooks',
        });
      }
    }

    const maxHSA = filingStatus === 'married_joint' ? MAX_HSA_FAMILY : MAX_HSA_SINGLE;
    if (hsaContribution < maxHSA) {
      const unusedHSA = maxHSA - hsaContribution;
      const dailyCost = (unusedHSA * (combinedRate + 0.0765)) / 365;
      if (dailyCost > 0.5) {
        breakdown.push({
          source: 'Unused HSA',
          dailyCost,
          description: `$${unusedHSA.toLocaleString()} in triple-tax-advantaged savings`,
          ctaText: 'Learn HSA Strategy',
          ctaLink: '/dashboard/tax-intel',
        });
      }
    }

    if (portfolioValue > 50000) {
      const taxDrag = portfolioValue * 0.01;
      const dailyCost = taxDrag / 365;
      breakdown.push({
        source: 'Portfolio Tax Drag',
        dailyCost,
        description: `Est. 1% annual drag on $${portfolioValue.toLocaleString()} from suboptimal positioning`,
        ctaText: 'Optimize Portfolio',
        ctaLink: '/dashboard/allocation',
      });
    }

    if (portfolioValue > 100000) {
      const advisorFee = portfolioValue * 0.01;
      const dailyCost = advisorFee / 365;
      breakdown.push({
        source: 'Typical Advisor Fees',
        dailyCost,
        description: `What a 1% AUM advisor would charge on $${portfolioValue.toLocaleString()}`,
        ctaText: 'See How We Compare',
        ctaLink: '/dashboard/ai',
      });
    }

    const total = breakdown.reduce((sum, item) => sum + item.dailyCost, 0);
    return { total, breakdown };
  };

  const { total, breakdown } = calculateCosts();

  useEffect(() => {
    if (total <= 0) return;
    
    const interval = setInterval(() => {
      setAnimatedCost(prev => {
        const increment = total / 86400;
        return prev + increment;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [total]);

  useEffect(() => {
    setAnimatedCost(total);
  }, [total]);

  const handleClick = () => {
    setShowModal(true);
    fetchWithAuth('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'opportunity_cost_clicked', mode: displayMode }),
    }).catch(() => {});
  };

  if (total < 1 || isDismissed) return null;

  const displayValue = displayMode === 'daily' ? animatedCost : animatedCost * 365;
  const monthlyValue = total * 30;

  return (
    <>
      <div className={styles.counter} onClick={handleClick}>
        <button className={styles.dismissBtn} onClick={handleDismiss} title="Dismiss for 7 days">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <div className={styles.mainDisplay}>
          <span className={styles.emoji}>💸</span>
          <span className={styles.label}>Opportunity Cost:</span>
          <span className={styles.amount}>
            ${displayValue.toFixed(2)}{displayMode === 'daily' ? '/day' : '/year'}
          </span>
        </div>
        <div className={styles.subtext}>
          That's ${monthlyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} this month in missed savings
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            
            <h2 className={styles.modalTitle}>Your Opportunity Cost Breakdown</h2>
            <p className={styles.modalSubtitle}>
              Every day you wait, you're leaving money on the table
            </p>

            <div className={styles.totalSection}>
              <div className={styles.totalLabel}>Total Daily Loss</div>
              <div className={styles.totalAmount}>${total.toFixed(2)}/day</div>
              <div className={styles.totalAnnual}>${(total * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year</div>
            </div>

            <div className={styles.breakdownList}>
              {breakdown.map((item, index) => (
                <div key={index} className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.breakdownSource}>{item.source}</span>
                    <span className={styles.breakdownCost}>${item.dailyCost.toFixed(2)}/day</span>
                  </div>
                  <p className={styles.breakdownDesc}>{item.description}</p>
                  <a href={item.ctaLink} className={styles.breakdownCta}>
                    {item.ctaText}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              ))}
            </div>

            <div className={styles.modeToggle}>
              <button 
                className={`${styles.toggleBtn} ${displayMode === 'daily' ? styles.active : ''}`}
                onClick={() => { setDisplayMode('daily'); sessionStorage.setItem('opportunityCostMode', 'daily'); }}
              >
                Daily View
              </button>
              <button 
                className={`${styles.toggleBtn} ${displayMode === 'yearly' ? styles.active : ''}`}
                onClick={() => { setDisplayMode('yearly'); sessionStorage.setItem('opportunityCostMode', 'yearly'); }}
              >
                Annual View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import styles from './Optimizer401k.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

interface PaystubData {
  annualSalary: number;
  current401k: number;
  currentPercent: number;
  payFrequency: string;
  marginalBracket: number;
}

export default function Optimizer401k() {
  const [paystubData, setPaystubData] = useState<PaystubData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form fields (pre-filled from paystub if available)
  const [annualSalary, setAnnualSalary] = useState<number>(0);
  const [currentContribution, setCurrentContribution] = useState<number>(0);
  const [employerMatchPercent, setEmployerMatchPercent] = useState<number>(50);
  const [employerMatchCap, setEmployerMatchCap] = useState<number>(6);
  const [marginalBracket, setMarginalBracket] = useState<number>(24);
  
  // Results
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    loadPaystubData();
  }, []);

  const loadPaystubData = async () => {
    try {
      const response = await fetchWithAuth('/api/tax-intel/projection');
      if (response.ok) {
        const data = await response.json();
        if (data.hasProjection && data.projections) {
          const salary = data.projections.annualGross || 0;
          const current401k = data.currentPeriod?.retirement401k || 0;
          const periodsPerYear = data.periodsPerYear || 24;
          const annual401k = current401k * periodsPerYear;
          const currentPct = salary > 0 ? (annual401k / salary) * 100 : 0;
          
          setPaystubData({
            annualSalary: salary,
            current401k: annual401k,
            currentPercent: currentPct,
            payFrequency: data.payFrequency || 'biweekly',
            marginalBracket: data.rates?.marginalBracket || 24,
          });
          
          setAnnualSalary(salary);
          setCurrentContribution(Math.round(currentPct * 10) / 10);
          setMarginalBracket(data.rates?.marginalBracket || 24);
        }
      }
    } catch (err) {
      console.error('Failed to load paystub data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculate = () => {
    const MAX_401K_2026 = 23500; // 2026 limit
    const CATCH_UP_50_PLUS = 7500;
    
    // Current situation
    const currentAnnualContribution = (currentContribution / 100) * annualSalary;
    
    // Employer match calculation
    // e.g., "50% match up to 6% of salary" means employer matches 50 cents per dollar up to 6% of salary
    const maxEmployeeContributionForMatch = (employerMatchCap / 100) * annualSalary;
    const currentEmployerMatch = Math.min(currentAnnualContribution, maxEmployeeContributionForMatch) * (employerMatchPercent / 100);
    
    // Optimal contribution to max employer match
    const optimalForMatch = employerMatchCap;
    const optimalAnnualForMatch = (optimalForMatch / 100) * annualSalary;
    const maxEmployerMatch = optimalAnnualForMatch * (employerMatchPercent / 100);
    
    // Money left on table
    const missedMatch = maxEmployerMatch - currentEmployerMatch;
    
    // Tax savings
    const currentTaxSavings = currentAnnualContribution * (marginalBracket / 100);
    const optimalTaxSavings = Math.min(optimalAnnualForMatch, MAX_401K_2026) * (marginalBracket / 100);
    const additionalTaxSavings = optimalTaxSavings - currentTaxSavings;
    
    // Max out scenario
    const maxContribution = Math.min(MAX_401K_2026, annualSalary);
    const maxTaxSavings = maxContribution * (marginalBracket / 100);
    
    // How much more per paycheck
    const periodsPerYear = paystubData?.payFrequency === 'weekly' ? 52 : 
                          paystubData?.payFrequency === 'biweekly' ? 26 : 
                          paystubData?.payFrequency === 'monthly' ? 12 : 24;
    
    const additionalAnnual = optimalAnnualForMatch - currentAnnualContribution;
    const additionalPerPaycheck = additionalAnnual / periodsPerYear;
    
    setResults({
      currentContributionDollars: currentAnnualContribution,
      currentEmployerMatch,
      currentTaxSavings,
      
      optimalPercent: optimalForMatch,
      optimalContributionDollars: optimalAnnualForMatch,
      maxEmployerMatch,
      optimalTaxSavings,
      
      missedMatch,
      additionalTaxSavings,
      additionalPerPaycheck,
      totalBenefit: missedMatch + additionalTaxSavings,
      
      maxOutContribution: maxContribution,
      maxOutTaxSavings: maxTaxSavings,
      
      periodsPerYear,
    });
  };

  useEffect(() => {
    if (annualSalary > 0) {
      calculate();
    }
  }, [annualSalary, currentContribution, employerMatchPercent, employerMatchCap, marginalBracket]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>401(k) Optimizer</h1>
        <p className={styles.subtitle}>Maximize your employer match and tax savings</p>
      </div>

      {paystubData && (
        <div className={styles.dataSource}>
          <span className={styles.dataSourceIcon}>✓</span>
          <span>Pre-filled from your uploaded paystub</span>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.inputSection}>
          <h2 className={styles.sectionTitle}>Your Information</h2>
          
          <div className={styles.inputGroup}>
            <label>Annual Salary</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputPrefix}>$</span>
              <input
                type="number"
                value={annualSalary || ''}
                onChange={(e) => setAnnualSalary(Number(e.target.value))}
                placeholder="150,000"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Current 401(k) Contribution</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                value={currentContribution || ''}
                onChange={(e) => setCurrentContribution(Number(e.target.value))}
                placeholder="6"
                step="0.5"
              />
              <span className={styles.inputSuffix}>%</span>
            </div>
            {annualSalary > 0 && (
              <span className={styles.inputHint}>
                = {formatCurrency((currentContribution / 100) * annualSalary)}/year
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Your Tax Bracket</label>
            <div className={styles.inputWrapper}>
              <select
                value={marginalBracket}
                onChange={(e) => setMarginalBracket(Number(e.target.value))}
              >
                <option value={10}>10%</option>
                <option value={12}>12%</option>
                <option value={22}>22%</option>
                <option value={24}>24%</option>
                <option value={32}>32%</option>
                <option value={35}>35%</option>
                <option value={37}>37%</option>
              </select>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Employer Match</h2>
          
          <div className={styles.matchInputs}>
            <div className={styles.inputGroup}>
              <label>Match Rate</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  value={employerMatchPercent || ''}
                  onChange={(e) => setEmployerMatchPercent(Number(e.target.value))}
                  placeholder="50"
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
            </div>
            
            <span className={styles.matchConnector}>up to</span>
            
            <div className={styles.inputGroup}>
              <label>Of Salary</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  value={employerMatchCap || ''}
                  onChange={(e) => setEmployerMatchCap(Number(e.target.value))}
                  placeholder="6"
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
            </div>
          </div>
          
          <p className={styles.matchExample}>
            Example: "50% match up to 6%" means your employer contributes 50¢ for every $1 you contribute, up to 6% of your salary.
          </p>
        </div>

        {results && (
          <div className={styles.resultsSection}>
            {results.missedMatch > 0 ? (
              <div className={styles.alertCard}>
                <div className={styles.alertIcon}>⚠️</div>
                <div className={styles.alertContent}>
                  <span className={styles.alertTitle}>You're leaving money on the table</span>
                  <span className={styles.alertAmount}>{formatCurrency(results.missedMatch)}/year</span>
                  <span className={styles.alertSubtext}>in missed employer match</span>
                </div>
              </div>
            ) : (
              <div className={styles.successCard}>
                <div className={styles.successIcon}>✅</div>
                <div className={styles.successContent}>
                  <span className={styles.successTitle}>You're maximizing your match!</span>
                  <span className={styles.successSubtext}>Getting {formatCurrency(results.currentEmployerMatch)}/year in free money</span>
                </div>
              </div>
            )}

            <div className={styles.comparisonGrid}>
              <div className={styles.comparisonCard}>
                <h3>Current</h3>
                <div className={styles.comparisonRow}>
                  <span>Your contribution</span>
                  <span>{formatCurrency(results.currentContributionDollars)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Employer match</span>
                  <span>{formatCurrency(results.currentEmployerMatch)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Tax savings</span>
                  <span>{formatCurrency(results.currentTaxSavings)}</span>
                </div>
                <div className={styles.comparisonTotal}>
                  <span>Total benefit</span>
                  <span>{formatCurrency(results.currentContributionDollars + results.currentEmployerMatch + results.currentTaxSavings)}</span>
                </div>
              </div>

              <div className={`${styles.comparisonCard} ${styles.optimal}`}>
                <h3>Optimal (Max Match)</h3>
                <div className={styles.comparisonRow}>
                  <span>Your contribution ({results.optimalPercent}%)</span>
                  <span>{formatCurrency(results.optimalContributionDollars)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Employer match</span>
                  <span className={styles.highlight}>{formatCurrency(results.maxEmployerMatch)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Tax savings</span>
                  <span>{formatCurrency(results.optimalTaxSavings)}</span>
                </div>
                <div className={styles.comparisonTotal}>
                  <span>Total benefit</span>
                  <span className={styles.highlight}>{formatCurrency(results.optimalContributionDollars + results.maxEmployerMatch + results.optimalTaxSavings)}</span>
                </div>
              </div>
            </div>

            {results.missedMatch > 0 && (
              <div className={styles.actionCard}>
                <h3>💡 How to Fix This</h3>
                <p>
                  Increase your contribution from <strong>{currentContribution}%</strong> to <strong>{results.optimalPercent}%</strong>
                </p>
                <div className={styles.actionDetails}>
                  <div className={styles.actionItem}>
                    <span className={styles.actionLabel}>Extra per paycheck</span>
                    <span className={styles.actionValue}>{formatCurrency(results.additionalPerPaycheck)}</span>
                  </div>
                  <div className={styles.actionItem}>
                    <span className={styles.actionLabel}>Free money gained</span>
                    <span className={styles.actionValue}>{formatCurrency(results.missedMatch)}/yr</span>
                  </div>
                  <div className={styles.actionItem}>
                    <span className={styles.actionLabel}>Additional tax savings</span>
                    <span className={styles.actionValue}>{formatCurrency(results.additionalTaxSavings)}/yr</span>
                  </div>
                </div>
                <div className={styles.totalBenefit}>
                  <span>Total annual benefit</span>
                  <span className={styles.totalAmount}>{formatCurrency(results.totalBenefit)}</span>
                </div>
              </div>
            )}

            <div className={styles.maxOutCard}>
              <h3>🚀 Max Out Scenario</h3>
              <p>The 2026 401(k) limit is <strong>$23,500</strong></p>
              <div className={styles.maxOutDetails}>
                <div className={styles.maxOutRow}>
                  <span>Max contribution</span>
                  <span>{formatCurrency(results.maxOutContribution)}</span>
                </div>
                <div className={styles.maxOutRow}>
                  <span>Tax savings at {marginalBracket}% bracket</span>
                  <span className={styles.highlight}>{formatCurrency(results.maxOutTaxSavings)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

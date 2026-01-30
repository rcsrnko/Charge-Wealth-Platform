import { useState, useEffect } from 'react';
import styles from './ScenarioPlanner.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { EXPECTED_MARKET_RETURN } from '../constants/rates';
import { NATIONAL_MORTGAGE_RATE, getPropertyTaxRate, getIncomeTaxRate, getStateData } from '../constants/stateData';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

type ScenarioType = 'job_change' | 'home_purchase' | 'retirement' | 'side_income';

interface BaselineData {
  annualIncome: number;
  marginalBracket: number;
  effectiveRate: number;
  current401k: number;
  filingStatus: string;
  stateOfResidence?: string;
}

interface ScenarioResult {
  newTaxBracket: number;
  newEffectiveRate: number;
  taxDifference: number;
  netIncomeDifference: number;
  recommendations: string[];
}

export default function ScenarioPlanner() {
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('job_change');
  const [result, setResult] = useState<ScenarioResult | null>(null);

  // Scenario inputs
  const [jobChange, setJobChange] = useState({ newSalary: 0, hasBonus: false, bonusAmount: 0 });
  const [homePurchase, setHomePurchase] = useState({ 
    price: 500000, 
    downPayment: 20, 
    interestRate: NATIONAL_MORTGAGE_RATE, 
    propertyTax: 1.1 // Will be updated based on user's state
  });
  const [retirement, setRetirement] = useState({ targetAge: 65, currentAge: 35, monthlyExpenses: 8000, currentSavings: 200000 });
  const [sideIncome, setSideIncome] = useState({ monthlyRevenue: 5000, expenses: 1000, isLLC: false });

  useEffect(() => {
    loadBaseline();
  }, []);

  const loadBaseline = async () => {
    try {
      // Fetch tax projection data
      const response = await fetchWithAuth('/api/tax-intel/projection');
      let stateCode = '';
      
      if (response.ok) {
        const data = await response.json();
        stateCode = data.stateOfResidence || '';
        
        setBaseline({
          annualIncome: data.projections?.annualGross || 150000,
          marginalBracket: data.rates?.marginalBracket || 24,
          effectiveRate: data.rates?.effectiveRate || 18,
          current401k: (data.currentPeriod?.retirement401k || 0) * (data.periodsPerYear || 24),
          filingStatus: data.filingStatus || 'single',
          stateOfResidence: stateCode,
        });
        setJobChange(prev => ({ ...prev, newSalary: data.projections?.annualGross || 150000 }));
      }
      
      // Also try to get state from financial profile if not in projection
      if (!stateCode) {
        try {
          const profileResponse = await fetchWithAuth('/api/charge-ai/context');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            stateCode = profileData.profile?.stateOfResidence || '';
            if (stateCode) {
              setBaseline(prev => prev ? { ...prev, stateOfResidence: stateCode } : null);
            }
          }
        } catch (e) {
          // Profile fetch failed, continue with defaults
        }
      }
      
      // Update home purchase defaults based on user's state
      if (stateCode) {
        const statePropertyTax = getPropertyTaxRate(stateCode);
        setHomePurchase(prev => ({
          ...prev,
          interestRate: NATIONAL_MORTGAGE_RATE,
          propertyTax: statePropertyTax,
        }));
      }
    } catch (err) {
      console.error('Failed to load baseline:', err);
      setBaseline({
        annualIncome: 150000,
        marginalBracket: 24,
        effectiveRate: 18,
        current401k: 12000,
        filingStatus: 'single',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateScenario = () => {
    if (!baseline) return;

    let newIncome = baseline.annualIncome;
    let taxDiff = 0;
    let netDiff = 0;
    let recommendations: string[] = [];
    let newBracket = baseline.marginalBracket;
    let newEffective = baseline.effectiveRate;

    switch (selectedScenario) {
      case 'job_change': {
        const totalNew = jobChange.newSalary + (jobChange.hasBonus ? jobChange.bonusAmount : 0);
        const incomeDiff = totalNew - baseline.annualIncome;
        
        // Calculate new bracket
        newBracket = totalNew > 243725 ? 35 : 
                     totalNew > 191950 ? 32 :
                     totalNew > 100525 ? 24 :
                     totalNew > 47150 ? 22 :
                     totalNew > 11600 ? 12 : 10;
        
        // Estimate tax difference (simplified)
        const currentTax = baseline.annualIncome * (baseline.effectiveRate / 100);
        const newTax = totalNew * (newBracket * 0.8 / 100); // Rough effective rate
        taxDiff = newTax - currentTax;
        netDiff = incomeDiff - taxDiff;
        
        newEffective = totalNew > 0 ? (newTax / totalNew) * 100 : 0;
        
        if (incomeDiff > 0) {
          recommendations.push(`Gross income increase: +$${incomeDiff.toLocaleString()}/year`);
          recommendations.push(`Estimated additional tax: ~$${Math.round(taxDiff).toLocaleString()}/year`);
          recommendations.push(`Net take-home increase: ~$${Math.round(netDiff).toLocaleString()}/year`);
          
          if (newBracket > baseline.marginalBracket) {
            recommendations.push(`⚠️ You'll move from ${baseline.marginalBracket}% to ${newBracket}% bracket`);
            recommendations.push(`💡 Max out 401(k) to $23,500 to reduce taxable income`);
          }
          if (jobChange.hasBonus && jobChange.bonusAmount > 10000) {
            recommendations.push(`💡 Bonus withholding is typically 22% flat - you may owe more at tax time`);
          }
        } else if (incomeDiff < 0) {
          recommendations.push(`Income decrease: $${Math.abs(incomeDiff).toLocaleString()}/year`);
          recommendations.push(`Potential tax savings: ~$${Math.abs(Math.round(taxDiff)).toLocaleString()}/year`);
        }
        break;
      }

      case 'home_purchase': {
        const loanAmount = homePurchase.price * (1 - homePurchase.downPayment / 100);
        const annualInterest = loanAmount * (homePurchase.interestRate / 100);
        const annualPropertyTax = homePurchase.price * (homePurchase.propertyTax / 100);
        const totalDeductions = annualInterest + annualPropertyTax;
        
        // Standard deduction comparison
        const standardDeduction = baseline.filingStatus === 'married_joint' ? 31400 : 15700;
        const itemizedBenefit = totalDeductions > standardDeduction ? totalDeductions - standardDeduction : 0;
        
        taxDiff = -(itemizedBenefit * (baseline.marginalBracket / 100));
        
        const monthlyPayment = (loanAmount * (homePurchase.interestRate / 100 / 12)) / 
                              (1 - Math.pow(1 + homePurchase.interestRate / 100 / 12, -360));
        
        recommendations.push(`Loan amount: $${loanAmount.toLocaleString()}`);
        recommendations.push(`Estimated monthly payment: $${Math.round(monthlyPayment).toLocaleString()}`);
        recommendations.push(`Year 1 mortgage interest: ~$${Math.round(annualInterest).toLocaleString()}`);
        recommendations.push(`Annual property tax: ~$${Math.round(annualPropertyTax).toLocaleString()}`);
        
        if (itemizedBenefit > 0) {
          recommendations.push(`💡 Itemizing could save ~$${Math.round(Math.abs(taxDiff)).toLocaleString()}/year in taxes`);
        } else {
          recommendations.push(`📋 Standard deduction ($${standardDeduction.toLocaleString()}) is better than itemizing`);
        }
        
        recommendations.push(`💡 Down payment needed: $${(homePurchase.price * homePurchase.downPayment / 100).toLocaleString()}`);
        break;
      }

      case 'retirement': {
        const yearsToRetirement = retirement.targetAge - retirement.currentAge;
        const annualExpenses = retirement.monthlyExpenses * 12;
        const targetNestEgg = annualExpenses * 25; // 4% rule
        
        // Using expected market return from centralized config
        const r = EXPECTED_MARKET_RETURN;
        const annualContribution = baseline.current401k;
        const futureValue = retirement.currentSavings * Math.pow(1 + r, yearsToRetirement) +
                          annualContribution * ((Math.pow(1 + r, yearsToRetirement) - 1) / r);
        
        const gap = targetNestEgg - futureValue;
        const additionalMonthly = gap > 0 ? 
          (gap * r) / ((Math.pow(1 + r, yearsToRetirement) - 1)) / 12 : 0;
        
        recommendations.push(`Target retirement nest egg: $${targetNestEgg.toLocaleString()}`);
        recommendations.push(`Projected savings at ${retirement.targetAge}: $${Math.round(futureValue).toLocaleString()}`);
        
        if (gap > 0) {
          recommendations.push(`⚠️ Gap to target: $${Math.round(gap).toLocaleString()}`);
          recommendations.push(`💡 Save additional $${Math.round(additionalMonthly).toLocaleString()}/month to close gap`);
        } else {
          recommendations.push(`✅ On track! Projected surplus: $${Math.round(Math.abs(gap)).toLocaleString()}`);
        }
        
        recommendations.push(`💡 Max 401(k): $23,500/year = $${Math.round(23500 * Math.pow(1.07, yearsToRetirement)).toLocaleString()} at retirement`);
        break;
      }

      case 'side_income': {
        const netRevenue = (sideIncome.monthlyRevenue - sideIncome.expenses) * 12;
        const selfEmploymentTax = netRevenue * 0.153; // 15.3% SE tax
        const incomeTax = netRevenue * (baseline.marginalBracket / 100);
        const totalTax = selfEmploymentTax + incomeTax;
        const netIncome = netRevenue - totalTax;
        
        taxDiff = totalTax;
        netDiff = netIncome;
        
        recommendations.push(`Gross annual revenue: $${(sideIncome.monthlyRevenue * 12).toLocaleString()}`);
        recommendations.push(`Business expenses: $${(sideIncome.expenses * 12).toLocaleString()}`);
        recommendations.push(`Net business income: $${netRevenue.toLocaleString()}`);
        recommendations.push(`Self-employment tax (15.3%): $${Math.round(selfEmploymentTax).toLocaleString()}`);
        recommendations.push(`Income tax at ${baseline.marginalBracket}%: $${Math.round(incomeTax).toLocaleString()}`);
        recommendations.push(`💰 Net take-home: $${Math.round(netIncome).toLocaleString()}/year`);
        
        if (netRevenue > 50000) {
          recommendations.push(`💡 Consider S-Corp election to reduce SE tax`);
        }
        if (!sideIncome.isLLC) {
          recommendations.push(`💡 Form an LLC for liability protection and easier deductions`);
        }
        recommendations.push(`💡 Set aside ~${Math.round((totalTax / netRevenue) * 100)}% of revenue for taxes`);
        break;
      }
    }

    setResult({
      newTaxBracket: newBracket,
      newEffectiveRate: Math.round(newEffective * 10) / 10,
      taxDifference: Math.round(taxDiff),
      netIncomeDifference: Math.round(netDiff),
      recommendations,
    });
  };

  useEffect(() => {
    if (baseline) {
      calculateScenario();
    }
  }, [selectedScenario, jobChange, homePurchase, retirement, sideIncome, baseline]);

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
        <div className={styles.loading}>Loading your financial data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>What If? Scenario Planner</h1>
        <p className={styles.subtitle}>See how life changes affect your finances</p>
      </div>

      {baseline && (
        <div className={styles.baseline}>
          <span className={styles.baselineLabel}>Your current situation:</span>
          <span className={styles.baselineValue}>
            {formatCurrency(baseline.annualIncome)} income • {baseline.marginalBracket}% bracket • {baseline.filingStatus.replace('_', ' ')}
          </span>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.scenarioSelector}>
          <h2 className={styles.sectionTitle}>Choose a Scenario</h2>
          <div className={styles.scenarioButtons}>
            <button 
              className={`${styles.scenarioBtn} ${selectedScenario === 'job_change' ? styles.active : ''}`}
              onClick={() => setSelectedScenario('job_change')}
            >
              <span className={styles.scenarioIcon}>💼</span>
              <span>Job Change</span>
            </button>
            <button 
              className={`${styles.scenarioBtn} ${selectedScenario === 'home_purchase' ? styles.active : ''}`}
              onClick={() => setSelectedScenario('home_purchase')}
            >
              <span className={styles.scenarioIcon}>🏠</span>
              <span>Buy a Home</span>
            </button>
            <button 
              className={`${styles.scenarioBtn} ${selectedScenario === 'retirement' ? styles.active : ''}`}
              onClick={() => setSelectedScenario('retirement')}
            >
              <span className={styles.scenarioIcon}>🏖️</span>
              <span>Retirement</span>
            </button>
            <button 
              className={`${styles.scenarioBtn} ${selectedScenario === 'side_income' ? styles.active : ''}`}
              onClick={() => setSelectedScenario('side_income')}
            >
              <span className={styles.scenarioIcon}>💸</span>
              <span>Side Income</span>
            </button>
          </div>
        </div>

        <div className={styles.inputsAndResults}>
          <div className={styles.inputsSection}>
            <h2 className={styles.sectionTitle}>
              {selectedScenario === 'job_change' && '💼 New Job Details'}
              {selectedScenario === 'home_purchase' && '🏠 Home Purchase Details'}
              {selectedScenario === 'retirement' && '🏖️ Retirement Planning'}
              {selectedScenario === 'side_income' && '💸 Side Business Details'}
            </h2>

            {selectedScenario === 'job_change' && (
              <div className={styles.inputsGrid}>
                <div className={styles.inputGroup}>
                  <label>New Base Salary</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      type="number"
                      value={jobChange.newSalary || ''}
                      onChange={(e) => setJobChange({ ...jobChange, newSalary: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={jobChange.hasBonus}
                      onChange={(e) => setJobChange({ ...jobChange, hasBonus: e.target.checked })}
                    />
                    Includes Signing/Annual Bonus
                  </label>
                </div>
                {jobChange.hasBonus && (
                  <div className={styles.inputGroup}>
                    <label>Bonus Amount</label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputPrefix}>$</span>
                      <input
                        type="number"
                        value={jobChange.bonusAmount || ''}
                        onChange={(e) => setJobChange({ ...jobChange, bonusAmount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedScenario === 'home_purchase' && (
              <div className={styles.inputsGrid}>
                {baseline?.stateOfResidence && (
                  <div className={styles.stateNote}>
                    <span className={styles.stateNoteIcon}>📍</span>
                    <span>Using {getStateData(baseline.stateOfResidence)?.name || baseline.stateOfResidence} rates from your profile</span>
                  </div>
                )}
                <div className={styles.inputGroup}>
                  <label>Home Price</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      type="number"
                      value={homePurchase.price || ''}
                      onChange={(e) => setHomePurchase({ ...homePurchase, price: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Down Payment</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      value={homePurchase.downPayment || ''}
                      onChange={(e) => setHomePurchase({ ...homePurchase, downPayment: Number(e.target.value) })}
                    />
                    <span className={styles.inputSuffix}>%</span>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Interest Rate</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      step="0.125"
                      value={homePurchase.interestRate || ''}
                      onChange={(e) => setHomePurchase({ ...homePurchase, interestRate: Number(e.target.value) })}
                    />
                    <span className={styles.inputSuffix}>%</span>
                  </div>
                  <span className={styles.inputHint}>Current national avg: {NATIONAL_MORTGAGE_RATE}%</span>
                </div>
                <div className={styles.inputGroup}>
                  <label>Property Tax Rate</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      step="0.1"
                      value={homePurchase.propertyTax || ''}
                      onChange={(e) => setHomePurchase({ ...homePurchase, propertyTax: Number(e.target.value) })}
                    />
                    <span className={styles.inputSuffix}>%</span>
                  </div>
                  {baseline?.stateOfResidence && (
                    <span className={styles.inputHint}>
                      {getStateData(baseline.stateOfResidence)?.name} avg: {getPropertyTaxRate(baseline.stateOfResidence)}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedScenario === 'retirement' && (
              <div className={styles.inputsGrid}>
                <div className={styles.inputGroup}>
                  <label>Current Age</label>
                  <input
                    type="number"
                    value={retirement.currentAge || ''}
                    onChange={(e) => setRetirement({ ...retirement, currentAge: Number(e.target.value) })}
                    className={styles.simpleInput}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Target Retirement Age</label>
                  <input
                    type="number"
                    value={retirement.targetAge || ''}
                    onChange={(e) => setRetirement({ ...retirement, targetAge: Number(e.target.value) })}
                    className={styles.simpleInput}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Monthly Expenses in Retirement</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      type="number"
                      value={retirement.monthlyExpenses || ''}
                      onChange={(e) => setRetirement({ ...retirement, monthlyExpenses: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Current Retirement Savings</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      type="number"
                      value={retirement.currentSavings || ''}
                      onChange={(e) => setRetirement({ ...retirement, currentSavings: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedScenario === 'side_income' && (
              <div className={styles.inputsGrid}>
                <div className={styles.inputGroup}>
                  <label>Monthly Revenue</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      type="number"
                      value={sideIncome.monthlyRevenue || ''}
                      onChange={(e) => setSideIncome({ ...sideIncome, monthlyRevenue: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Monthly Business Expenses</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>$</span>
                    <input
                      type="number"
                      value={sideIncome.expenses || ''}
                      onChange={(e) => setSideIncome({ ...sideIncome, expenses: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={sideIncome.isLLC}
                      onChange={(e) => setSideIncome({ ...sideIncome, isLLC: e.target.checked })}
                    />
                    Already have LLC/Business Entity
                  </label>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className={styles.resultsSection}>
              <h2 className={styles.sectionTitle}>📊 Analysis</h2>
              <div className={styles.resultsList}>
                {result.recommendations.map((rec, i) => (
                  <div key={i} className={styles.resultItem}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

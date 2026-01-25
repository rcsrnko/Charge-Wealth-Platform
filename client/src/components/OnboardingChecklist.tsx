import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './OnboardingChecklist.module.css';

interface OnboardingStatus {
  financialProfile: boolean;
  taxReturn: boolean;
  portfolioPositions: boolean;
  cashFlow: boolean;
  completionPercentage: number;
}

export default function OnboardingChecklist() {
  const queryClient = useQueryClient();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const res = await fetch('/api/onboarding/status', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch onboarding status');
      return res.json();
    }
  });

  const completedCount = status ? Object.values(status).filter(v => v === true).length : 0;
  const percentage = status?.completionPercentage ?? 0;

  if (isLoading) {
    return (
      <div className={styles.checklist}>
        <div className={styles.header}>
          <h3>Unlock Full Capabilities</h3>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: '0%' }} />
          </div>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (percentage === 100) {
    return null;
  }

  const checklistItems = [
    {
      key: 'financialProfile',
      title: 'Complete Financial Profile',
      description: 'Income, filing status, state, and financial goals',
      unlocks: 'Personalized analysis across all products',
      icon: '👤',
    },
    {
      key: 'taxReturn',
      title: 'Upload Tax Return',
      description: 'Form 1040 from your most recent tax year',
      unlocks: 'Full Tax Intel with what-if scenarios',
      icon: '📄',
    },
    {
      key: 'portfolioPositions',
      title: 'Add Portfolio Positions',
      description: 'Your current investment holdings',
      unlocks: 'Allocation analysis and investment theses',
      icon: '📊',
    },
    {
      key: 'cashFlow',
      title: 'Enter Cash Flow Data',
      description: 'Monthly income and expenses',
      unlocks: 'Liquidity analysis and runway planning',
      icon: '💵',
    }
  ];

  return (
    <div className={styles.checklist}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3>Unlock Full Capabilities</h3>
          <span className={styles.progressText}>{completedCount} of 4 complete</span>
        </div>
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>

      <div className={styles.items}>
        {checklistItems.map((item) => {
          const isComplete = status?.[item.key as keyof OnboardingStatus] === true;
          const isExpanded = expandedItem === item.key;
          
          return (
            <div 
              key={item.key} 
              className={`${styles.item} ${isComplete ? styles.complete : ''} ${isExpanded ? styles.expanded : ''}`}
            >
              <div 
                className={styles.itemHeader}
                onClick={() => !isComplete && setExpandedItem(isExpanded ? null : item.key)}
              >
                <div className={styles.itemIcon}>
                  {isComplete ? (
                    <span className={styles.checkmark}>✓</span>
                  ) : (
                    <span>{item.icon}</span>
                  )}
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemDescription}>{item.description}</div>
                  {!isComplete && !isExpanded && (
                    <div className={styles.itemUnlocks}>
                      Unlocks: {item.unlocks}
                    </div>
                  )}
                </div>
                {!isComplete && (
                  <button className={styles.expandBtn}>
                    {isExpanded ? '−' : '+'}
                  </button>
                )}
              </div>
              
              {isExpanded && !isComplete && (
                <div className={styles.formSection}>
                  {item.key === 'financialProfile' && (
                    <FinancialProfileForm onComplete={() => {
                      setExpandedItem(null);
                      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
                    }} />
                  )}
                  {item.key === 'taxReturn' && (
                    <TaxReturnForm onComplete={() => {
                      setExpandedItem(null);
                      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
                    }} />
                  )}
                  {item.key === 'portfolioPositions' && (
                    <PortfolioForm onComplete={() => {
                      setExpandedItem(null);
                      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
                    }} />
                  )}
                  {item.key === 'cashFlow' && (
                    <CashFlowForm onComplete={() => {
                      setExpandedItem(null);
                      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
                    }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinancialProfileForm({ onComplete }: { onComplete: () => void }) {
  const [formData, setFormData] = useState({
    annualIncome: '',
    filingStatus: '',
    stateOfResidence: '',
    primaryGoal: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/financial-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inlineForm}>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Annual Income</label>
          <input
            type="number"
            placeholder="e.g., 250000"
            value={formData.annualIncome}
            onChange={(e) => setFormData({...formData, annualIncome: e.target.value})}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Filing Status</label>
          <select
            value={formData.filingStatus}
            onChange={(e) => setFormData({...formData, filingStatus: e.target.value})}
            required
          >
            <option value="">Select...</option>
            <option value="single">Single</option>
            <option value="married_joint">Married Filing Jointly</option>
            <option value="married_separate">Married Filing Separately</option>
            <option value="head_of_household">Head of Household</option>
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>State of Residence</label>
          <input
            type="text"
            placeholder="e.g., CA"
            maxLength={2}
            value={formData.stateOfResidence}
            onChange={(e) => setFormData({...formData, stateOfResidence: e.target.value.toUpperCase()})}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Primary Financial Goal</label>
          <select
            value={formData.primaryGoal}
            onChange={(e) => setFormData({...formData, primaryGoal: e.target.value})}
            required
          >
            <option value="">Select...</option>
            <option value="retirement">Retirement Planning</option>
            <option value="wealth_growth">Wealth Growth</option>
            <option value="tax_optimization">Tax Optimization</option>
            <option value="estate_planning">Estate Planning</option>
            <option value="liquidity">Liquidity Management</option>
          </select>
        </div>
      </div>
      {error && <div className={styles.formError}>{error}</div>}
      <button type="submit" className={styles.formSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

function TaxReturnForm({ onComplete }: { onComplete: () => void }) {
  const [formData, setFormData] = useState({
    taxYear: new Date().getFullYear() - 1,
    totalIncome: '',
    agi: '',
    federalTax: '',
    filingStatus: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/tax-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inlineForm}>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Tax Year</label>
          <select
            value={formData.taxYear}
            onChange={(e) => setFormData({...formData, taxYear: parseInt(e.target.value)})}
            required
          >
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label>Filing Status</label>
          <select
            value={formData.filingStatus}
            onChange={(e) => setFormData({...formData, filingStatus: e.target.value})}
            required
          >
            <option value="">Select...</option>
            <option value="single">Single</option>
            <option value="married_joint">Married Filing Jointly</option>
            <option value="married_separate">Married Filing Separately</option>
            <option value="head_of_household">Head of Household</option>
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Total Income (Line 9)</label>
          <input
            type="number"
            placeholder="e.g., 350000"
            value={formData.totalIncome}
            onChange={(e) => setFormData({...formData, totalIncome: e.target.value})}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>AGI (Line 11)</label>
          <input
            type="number"
            placeholder="e.g., 320000"
            value={formData.agi}
            onChange={(e) => setFormData({...formData, agi: e.target.value})}
            required
          />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Total Federal Tax (Line 24)</label>
          <input
            type="number"
            placeholder="e.g., 75000"
            value={formData.federalTax}
            onChange={(e) => setFormData({...formData, federalTax: e.target.value})}
            required
          />
        </div>
        <div className={styles.formField}></div>
      </div>
      {error && <div className={styles.formError}>{error}</div>}
      <button type="submit" className={styles.formSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Tax Data'}
      </button>
    </form>
  );
}

function PortfolioForm({ onComplete }: { onComplete: () => void }) {
  const [formData, setFormData] = useState({
    symbol: '',
    companyName: '',
    shares: '',
    costBasis: '',
    currentValue: '',
    accountType: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/portfolio-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inlineForm}>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Symbol</label>
          <input
            type="text"
            placeholder="e.g., AAPL"
            value={formData.symbol}
            onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Company Name</label>
          <input
            type="text"
            placeholder="e.g., Apple Inc."
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Shares</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g., 100"
            value={formData.shares}
            onChange={(e) => setFormData({...formData, shares: e.target.value})}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Cost Basis ($)</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g., 15000"
            value={formData.costBasis}
            onChange={(e) => setFormData({...formData, costBasis: e.target.value})}
            required
          />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Current Value ($)</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g., 22000"
            value={formData.currentValue}
            onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Account Type</label>
          <select
            value={formData.accountType}
            onChange={(e) => setFormData({...formData, accountType: e.target.value})}
            required
          >
            <option value="">Select...</option>
            <option value="taxable">Taxable Brokerage</option>
            <option value="ira">Traditional IRA</option>
            <option value="roth_ira">Roth IRA</option>
            <option value="401k">401(k)</option>
          </select>
        </div>
      </div>
      {error && <div className={styles.formError}>{error}</div>}
      <button type="submit" className={styles.formSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Add Position'}
      </button>
    </form>
  );
}

function CashFlowForm({ onComplete }: { onComplete: () => void }) {
  const [formData, setFormData] = useState({
    monthlyEssentialExpenses: '',
    currentCash: '',
    targetReserveMonths: '6',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/cash-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inlineForm}>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Monthly Essential Expenses</label>
          <input
            type="number"
            placeholder="e.g., 8000"
            value={formData.monthlyEssentialExpenses}
            onChange={(e) => setFormData({...formData, monthlyEssentialExpenses: e.target.value})}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Current Cash/Savings</label>
          <input
            type="number"
            placeholder="e.g., 150000"
            value={formData.currentCash}
            onChange={(e) => setFormData({...formData, currentCash: e.target.value})}
            required
          />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label>Target Reserve (Months)</label>
          <select
            value={formData.targetReserveMonths}
            onChange={(e) => setFormData({...formData, targetReserveMonths: e.target.value})}
            required
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="9">9 months</option>
            <option value="12">12 months</option>
            <option value="18">18 months</option>
            <option value="24">24 months</option>
          </select>
        </div>
        <div className={styles.formField}></div>
      </div>
      {error && <div className={styles.formError}>{error}</div>}
      <button type="submit" className={styles.formSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Cash Flow'}
      </button>
    </form>
  );
}

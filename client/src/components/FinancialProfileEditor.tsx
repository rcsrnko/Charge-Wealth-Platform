import { useState, useEffect } from 'react';
import styles from './FinancialProfileEditor.module.css';
import { useToast } from './Toast';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface FinancialProfile {
  annualIncome: number;
  filingStatus: string;
  stateOfResidence: string;
  primaryGoal: string;
  monthlyExpenses?: number;
  currentCash?: number;
  targetReserveMonths?: number;
}

interface FinancialProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const stateTaxRates: Record<string, { name: string; rate: number }> = {
  'CA': { name: 'California', rate: 13.3 },
  'NY': { name: 'New York', rate: 10.9 },
  'NJ': { name: 'New Jersey', rate: 10.75 },
  'TX': { name: 'Texas', rate: 0 },
  'FL': { name: 'Florida', rate: 0 },
  'WA': { name: 'Washington', rate: 0 },
  'NV': { name: 'Nevada', rate: 0 },
  'IL': { name: 'Illinois', rate: 4.95 },
  'CO': { name: 'Colorado', rate: 4.4 },
  'MA': { name: 'Massachusetts', rate: 5 },
  'PA': { name: 'Pennsylvania', rate: 3.07 },
  'OH': { name: 'Ohio', rate: 3.99 },
  'GA': { name: 'Georgia', rate: 5.49 },
  'NC': { name: 'North Carolina', rate: 4.75 },
  'AZ': { name: 'Arizona', rate: 2.5 },
  'OTHER': { name: 'Other State', rate: 5 }
};

export default function FinancialProfileEditor({ isOpen, onClose, onSave }: FinancialProfileEditorProps) {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'cashflow'>('income');

  const [profile, setProfile] = useState<FinancialProfile>({
    annualIncome: 0,
    filingStatus: 'single',
    stateOfResidence: 'TX',
    primaryGoal: 'tax_optimization',
    monthlyExpenses: 0,
    currentCash: 0,
    targetReserveMonths: 6
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/charge-ai/context');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile({
            annualIncome: data.profile.annualIncome || 0,
            filingStatus: data.profile.filingStatus || 'single',
            stateOfResidence: data.profile.stateOfResidence || 'TX',
            primaryGoal: data.profile.primaryGoal || 'tax_optimization',
            monthlyExpenses: data.profile.monthlyExpenses || 0,
            currentCash: data.profile.currentCash || 0,
            targetReserveMonths: data.profile.targetReserveMonths || 6
          });
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save income/tax profile
      const profileResponse = await fetchWithAuth('/api/financial-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annualIncome: profile.annualIncome,
          filingStatus: profile.filingStatus,
          stateOfResidence: profile.stateOfResidence,
          primaryGoal: profile.primaryGoal
        })
      });

      // Save cash flow data if provided
      if (profile.monthlyExpenses && profile.monthlyExpenses > 0) {
        await fetchWithAuth('/api/cash-flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlyEssentialExpenses: profile.monthlyExpenses,
            currentCash: profile.currentCash || 0,
            targetReserveMonths: profile.targetReserveMonths || 6
          })
        });
      }

      if (profileResponse.ok) {
        showSuccess('Financial profile updated successfully');
        onSave();
        onClose();
      } else {
        showError('Failed to save profile');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      showError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Financial Profile</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'income' ? styles.active : ''}`}
            onClick={() => setActiveTab('income')}
          >
            Income & Taxes
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'cashflow' ? styles.active : ''}`}
            onClick={() => setActiveTab('cashflow')}
          >
            Cash Flow
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading your profile...</div>
        ) : (
          <div className={styles.content}>
            {activeTab === 'income' && (
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label>Annual Income</label>
                  <div className={styles.inputWithPrefix}>
                    <span>$</span>
                    <input
                      type="number"
                      value={profile.annualIncome || ''}
                      onChange={(e) => setProfile({ ...profile, annualIncome: parseInt(e.target.value) || 0 })}
                      placeholder="250000"
                    />
                  </div>
                  <span className={styles.hint}>Your total annual income from all sources</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Filing Status</label>
                  <select
                    value={profile.filingStatus}
                    onChange={(e) => setProfile({ ...profile, filingStatus: e.target.value })}
                  >
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_household">Head of Household</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>State of Residence</label>
                  <select
                    value={profile.stateOfResidence}
                    onChange={(e) => setProfile({ ...profile, stateOfResidence: e.target.value })}
                  >
                    {Object.entries(stateTaxRates).map(([code, { name, rate }]) => (
                      <option key={code} value={code}>
                        {name} ({rate === 0 ? 'No state tax' : `${rate}% state tax`})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Primary Financial Goal</label>
                  <select
                    value={profile.primaryGoal}
                    onChange={(e) => setProfile({ ...profile, primaryGoal: e.target.value })}
                  >
                    <option value="tax_optimization">Minimize Taxes</option>
                    <option value="wealth_growth">Grow Wealth</option>
                    <option value="retirement">Retirement Planning</option>
                    <option value="debt_payoff">Pay Off Debt</option>
                    <option value="emergency_fund">Build Emergency Fund</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'cashflow' && (
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label>Monthly Expenses</label>
                  <div className={styles.inputWithPrefix}>
                    <span>$</span>
                    <input
                      type="number"
                      value={profile.monthlyExpenses || ''}
                      onChange={(e) => setProfile({ ...profile, monthlyExpenses: parseInt(e.target.value) || 0 })}
                      placeholder="8000"
                    />
                  </div>
                  <span className={styles.hint}>Average monthly spending including rent, bills, etc.</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Current Cash / Savings</label>
                  <div className={styles.inputWithPrefix}>
                    <span>$</span>
                    <input
                      type="number"
                      value={profile.currentCash || ''}
                      onChange={(e) => setProfile({ ...profile, currentCash: parseInt(e.target.value) || 0 })}
                      placeholder="50000"
                    />
                  </div>
                  <span className={styles.hint}>Total cash in checking and savings accounts</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Target Emergency Reserve (months)</label>
                  <select
                    value={profile.targetReserveMonths}
                    onChange={(e) => setProfile({ ...profile, targetReserveMonths: parseInt(e.target.value) })}
                  >
                    <option value={3}>3 months</option>
                    <option value={6}>6 months (recommended)</option>
                    <option value={9}>9 months</option>
                    <option value={12}>12 months</option>
                  </select>
                  <span className={styles.hint}>How many months of expenses you want in reserve</span>
                </div>

                {profile.monthlyExpenses > 0 && profile.currentCash > 0 && (
                  <div className={styles.cashFlowSummary}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Current Reserve</span>
                      <span className={styles.summaryValue}>
                        {(profile.currentCash / profile.monthlyExpenses).toFixed(1)} months
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Target Reserve</span>
                      <span className={styles.summaryValue}>
                        ${(profile.monthlyExpenses * (profile.targetReserveMonths || 6)).toLocaleString()}
                      </span>
                    </div>
                    {profile.currentCash < profile.monthlyExpenses * (profile.targetReserveMonths || 6) && (
                      <div className={styles.summaryAlert}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>
                          You need ${((profile.monthlyExpenses * (profile.targetReserveMonths || 6)) - profile.currentCash).toLocaleString()} more to reach your target
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

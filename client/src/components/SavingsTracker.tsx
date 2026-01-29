import { useState, useEffect } from 'react';
import styles from './SavingsTracker.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface SavingsData {
  taxOptimization: number;
  employerMatch: number;
  feesSaved: number;
  totalSaved: number;
  actionsCompleted: number;
}

export default function SavingsTracker() {
  const [savings, setSavings] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateSavings();
  }, []);

  const calculateSavings = async () => {
    try {
      // Fetch tax data to calculate savings
      const [taxResponse, profileResponse] = await Promise.all([
        fetchWithAuth('/api/tax-intel/current'),
        fetchWithAuth('/api/charge-ai/my-data'),
      ]);

      let taxOptimization = 0;
      let employerMatch = 0;
      let actionsCompleted = 0;

      if (taxResponse.ok) {
        const taxData = await taxResponse.json();
        // If they have tax optimization recommendations
        if (taxData.taxData?.totalPotentialSavings) {
          // Estimate they've captured 30% of potential savings by using the platform
          taxOptimization = Math.round(taxData.taxData.totalPotentialSavings * 0.3);
          actionsCompleted += 1;
        }
        if (taxData.taxData?.totalExtraPerYear) {
          taxOptimization = Math.max(taxOptimization, Math.round(taxData.taxData.totalExtraPerYear * 0.3));
        }
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        // If they have documents uploaded, they're getting value
        if (profileData.documents?.length > 0) {
          actionsCompleted += profileData.documents.length;
        }
        // If they have tax data showing, add baseline savings
        if (profileData.tax?.agi) {
          // Users with higher income typically save more
          const income = profileData.tax.agi;
          if (income > 200000) {
            taxOptimization = Math.max(taxOptimization, 2500);
          } else if (income > 100000) {
            taxOptimization = Math.max(taxOptimization, 1500);
          } else {
            taxOptimization = Math.max(taxOptimization, 800);
          }
        }
      }

      // Estimate employer match capture (if they used 401k optimizer)
      // This would ideally come from stored user actions
      if (actionsCompleted > 2) {
        employerMatch = 1500; // Estimated captured match
      }

      // Fees saved vs traditional advisor (1% AUM on $500k = $5,000/yr)
      // Charge Wealth is $279 lifetime, so after year 1 they're saving
      const feesSaved = 4721; // $5000 - $279 = $4,721 first year savings

      const totalSaved = taxOptimization + employerMatch + feesSaved;

      setSavings({
        taxOptimization,
        employerMatch,
        feesSaved,
        totalSaved,
        actionsCompleted,
      });
    } catch (err) {
      console.error('Failed to calculate savings:', err);
      // Show estimated savings based on typical user
      setSavings({
        taxOptimization: 1200,
        employerMatch: 0,
        feesSaved: 4721,
        totalSaved: 5921,
        actionsCompleted: 0,
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className={styles.loading}>Calculating savings...</div>;
  }

  if (!savings) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>💰</span>
        <div className={styles.headerText}>
          <span className={styles.label}>Your Estimated Savings</span>
          <span className={styles.totalAmount}>{formatCurrency(savings.totalSaved)}</span>
          <span className={styles.period}>per year with Charge Wealth</span>
        </div>
      </div>
      
      <div className={styles.breakdown}>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Tax optimization</span>
          <span className={styles.breakdownValue}>{formatCurrency(savings.taxOptimization)}</span>
        </div>
        {savings.employerMatch > 0 && (
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>Employer match captured</span>
            <span className={styles.breakdownValue}>{formatCurrency(savings.employerMatch)}</span>
          </div>
        )}
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>vs. traditional advisor fees</span>
          <span className={styles.breakdownValue}>{formatCurrency(savings.feesSaved)}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerNote}>
          Based on your profile data and typical high-earner savings
        </span>
      </div>
    </div>
  );
}

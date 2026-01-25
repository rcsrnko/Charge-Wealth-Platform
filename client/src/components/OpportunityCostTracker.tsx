import styles from './OpportunityCostTracker.module.css';
import LockedFeatureOverlay from './LockedFeatureOverlay';

interface OpportunityCost {
  id: string;
  title: string;
  costPerMonth: number;
  costPerYear: number;
  daysSinceIdentified: number;
  description: string;
  action: string;
}

interface OpportunityCostTrackerProps {
  hasTaxData: boolean;
  hasPositions: boolean;
  hasCashFlow: boolean;
}

export default function OpportunityCostTracker({ hasTaxData, hasPositions, hasCashFlow }: OpportunityCostTrackerProps) {
  const hasAnyData = hasTaxData || hasPositions || hasCashFlow;
  const isLocked = !hasAnyData;

  const onboardingSteps = [
    {
      id: 'tax',
      label: 'Upload Tax Return',
      description: 'Find hidden tax savings',
      actionLabel: 'Upload',
      actionPath: '/dashboard/tax-intel',
      completed: hasTaxData
    },
    {
      id: 'portfolio',
      label: 'Add Portfolio',
      description: 'Track opportunity costs',
      actionLabel: 'Add',
      actionPath: '/dashboard/allocation',
      completed: hasPositions
    }
  ];

  const demoCosts: OpportunityCost[] = [
    {
      id: '1',
      title: 'Excess Cash Sitting Idle',
      costPerMonth: 175,
      costPerYear: 2100,
      daysSinceIdentified: 45,
      description: '$42K above emergency fund threshold earning 0.5% instead of 7% market return',
      action: 'Deploy Cash'
    },
    {
      id: '2',
      title: 'Unharvested Tax Losses',
      costPerMonth: 0,
      costPerYear: 3200,
      daysSinceIdentified: 12,
      description: '3 positions with $10,800 in unrealized losses expiring end of tax year',
      action: 'Harvest Now'
    },
    {
      id: '3',
      title: 'Delayed Rebalancing',
      costPerMonth: 85,
      costPerYear: 1020,
      daysSinceIdentified: 90,
      description: 'Tech overweight of 9% increases portfolio volatility by 15%',
      action: 'Rebalance'
    }
  ];

  const totalMonthly = demoCosts.reduce((acc, c) => acc + c.costPerMonth, 0);
  const totalYearly = demoCosts.reduce((acc, c) => acc + c.costPerYear, 0);

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      {isLocked && (
        <LockedFeatureOverlay
          title="Stop Losing Money"
          description="See exactly how much inaction is costing you each month."
          requiredSteps={onboardingSteps}
          benefit="Avg user finds $350/mo in hidden costs"
        />
      )}
      {!isLocked ? (
        <>
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>Opportunity Cost Tracker</h3>
              <p className={styles.subtitle}>What inaction is costing you</p>
            </div>
            <div className={styles.totals}>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>${totalMonthly}/mo</span>
                <span className={styles.totalLabel}>Monthly</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>${totalYearly.toLocaleString()}/yr</span>
                <span className={styles.totalLabel}>Annual</span>
              </div>
            </div>
          </div>
          <div className={styles.costsList}>
            {demoCosts.map((cost) => (
              <div key={cost.id} className={styles.costCard}>
                <div className={styles.costInfo}>
                  <div className={styles.costHeader}>
                    <h4 className={styles.costTitle}>{cost.title}</h4>
                    <span className={styles.daysCounter}>{cost.daysSinceIdentified} days</span>
                  </div>
                  <p className={styles.costDescription}>{cost.description}</p>
                </div>
                <div className={styles.costImpact}>
                  <span className={styles.costValue}>-${cost.costPerYear.toLocaleString()}/yr</span>
                  <button className={styles.costAction}>{cost.action}</button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.footer}>
            <span className={styles.footerText}>
              Every day you wait costs approximately <strong>${Math.round(totalYearly / 365)}</strong>
            </span>
          </div>
        </>
      ) : (
        <div className={styles.lockedPlaceholder}>
          <div className={styles.header}>
            <h3 className={styles.title}>Opportunity Cost Tracker</h3>
            <p className={styles.subtitle}>What inaction is costing you</p>
          </div>
        </div>
      )}
    </div>
  );
}

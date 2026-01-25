import styles from './MoneyMovesEngine.module.css';

interface MoneyMove {
  id: string;
  action: string;
  category: 'tax' | 'allocation' | 'cash' | 'risk';
  impact: number;
  urgency: 'now' | 'soon' | 'plan';
  description: string;
  cta: string;
}

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  benefit: string;
  path: string;
  completed: boolean;
}

interface MoneyMovesEngineProps {
  hasTaxData: boolean;
  hasPositions: boolean;
  hasProfile: boolean;
  hasCashFlow: boolean;
}

export default function MoneyMovesEngine({ hasTaxData, hasPositions, hasProfile, hasCashFlow }: MoneyMovesEngineProps) {
  const hasAnyData = hasTaxData || hasPositions || hasProfile || hasCashFlow;

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'tax',
      label: 'Upload Your Tax Return',
      description: 'We analyze your 1040 to find tax-saving opportunities',
      benefit: 'Avg savings: $3,200/year',
      path: '/dashboard/tax-intel',
      completed: hasTaxData
    },
    {
      id: 'portfolio',
      label: 'Add Your Portfolio',
      description: 'Import positions to see allocation and risk insights',
      benefit: 'Avg optimization: $2,800/year',
      path: '/dashboard/allocation',
      completed: hasPositions
    }
  ];

  const incompleteSteps = onboardingSteps.filter(step => !step.completed);

  const demoMoves: MoneyMove[] = [
    {
      id: '1',
      action: 'Harvest Tax Losses Before Year-End',
      category: 'tax',
      impact: 4200,
      urgency: 'now',
      description: 'Offset $14,000 in capital gains with strategic loss harvesting across 3 positions.',
      cta: 'See Tax Impact'
    },
    {
      id: '2',
      action: 'Rebalance Concentrated Tech Position',
      category: 'risk',
      impact: 0,
      urgency: 'soon',
      description: 'Your NVDA position is 34% of portfolio. Reduce concentration risk without triggering excess taxes.',
      cta: 'View Strategy'
    },
    {
      id: '3',
      action: 'Deploy Excess Cash to Index Fund',
      category: 'cash',
      impact: 2800,
      urgency: 'plan',
      description: 'Your $45K cash position is earning 0.5%. Expected gain of $2,800/year in broad market exposure.',
      cta: 'See Comparison'
    }
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'tax': return 'Tax Savings';
      case 'allocation': return 'Return Optimization';
      case 'risk': return 'Risk Reduction';
      case 'cash': return 'Cash Optimization';
      default: return category;
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'now': return 'Act Now';
      case 'soon': return 'This Month';
      case 'plan': return 'Plan Ahead';
      default: return urgency;
    }
  };

  if (!hasAnyData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>Next Best Money Moves</h2>
            <p className={styles.subtitle}>Actions ranked by estimated dollar impact</p>
          </div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>Stop Leaving Money on the Table</h3>
          <p className={styles.emptyDescription}>
            Stop paying for "advice" that's just a sales pitch. Unlock your private decision engine to see exactly where you're overpaying taxes and holding too much cash.
          </p>
          
          <div className={styles.onboardingSteps}>
            <div className={styles.readinessMeter}>
              <div className={styles.meterLabel}>Wealth Readiness Score</div>
              <div className={styles.meterTrack}>
                <div className={styles.meterFill} style={{ width: '15%' }}></div>
              </div>
              <div className={styles.meterValue}>15% - Guessing Phase</div>
            </div>
            {incompleteSteps.map((step) => (
              <a key={step.id} href={step.path} className={styles.onboardingCard}>
                <div className={styles.onboardingContent}>
                  <span className={styles.onboardingLabel}>{step.label}</span>
                  <span className={styles.onboardingDesc}>{step.description}</span>
                </div>
                <div className={styles.onboardingRight}>
                  <span className={styles.onboardingBenefit}>{step.benefit}</span>
                  <span className={styles.onboardingCta}>Start</span>
                </div>
              </a>
            ))}
          </div>
          
          <div className={styles.emptyActions}>
            <span className={styles.emptyImpact}>Average first-year impact: $5,200</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Next Best Money Moves</h2>
          <p className={styles.subtitle}>Actions ranked by estimated dollar impact</p>
        </div>
        <div className={styles.totalImpact}>
          <span className={styles.totalLabel}>Total Opportunity</span>
          <span className={styles.totalValue}>$7,000+</span>
        </div>
      </div>

      <div className={styles.movesList}>
        {demoMoves.map((move, index) => (
          <div key={move.id} className={styles.moveCard}>
            <div className={styles.moveRank}>{index + 1}</div>
            <div className={styles.moveContent}>
              <div className={styles.moveHeader}>
                <h3 className={styles.moveAction}>{move.action}</h3>
                <div className={styles.moveMeta}>
                  <span className={`${styles.categoryBadge} ${styles[move.category]}`}>
                    {getCategoryLabel(move.category)}
                  </span>
                  <span className={`${styles.urgencyBadge} ${styles[move.urgency]}`}>
                    {getUrgencyLabel(move.urgency)}
                  </span>
                </div>
              </div>
              <p className={styles.moveDescription}>{move.description}</p>
            </div>
            <div className={styles.moveImpact}>
              {move.impact > 0 ? (
                <>
                  <span className={styles.impactValue}>+${move.impact.toLocaleString()}</span>
                  <span className={styles.impactLabel}>estimated</span>
                </>
              ) : (
                <span className={styles.impactLabel}>Risk Protection</span>
              )}
              <button className={styles.moveCta}>{move.cta}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

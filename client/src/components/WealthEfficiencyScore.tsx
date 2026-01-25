import styles from './WealthEfficiencyScore.module.css';
import LockedFeatureOverlay from './LockedFeatureOverlay';

interface ScoreComponent {
  label: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
  insight: string;
  action: string;
}

interface WealthEfficiencyScoreProps {
  hasTaxData: boolean;
  hasPositions: boolean;
  hasProfile: boolean;
  hasCashFlow: boolean;
}

export default function WealthEfficiencyScore({ hasTaxData, hasPositions, hasProfile, hasCashFlow }: WealthEfficiencyScoreProps) {
  const hasAnyData = hasTaxData || hasPositions || hasProfile || hasCashFlow;
  const isLocked = !hasAnyData;

  const components: ScoreComponent[] = [
    {
      label: 'Tax Efficiency',
      score: hasTaxData ? 72 : 0,
      status: hasTaxData ? 'warning' : 'critical',
      insight: hasTaxData ? 'You could save ~$3,200 with better tax-loss harvesting' : 'Upload tax return to analyze',
      action: hasTaxData ? 'Optimize Tax Strategy' : 'Upload 1040'
    },
    {
      label: 'Allocation Efficiency',
      score: hasPositions ? 85 : 0,
      status: hasPositions ? 'good' : 'critical',
      insight: hasPositions ? 'Slight overweight in tech sector (34% vs target 25%)' : 'Add positions to analyze',
      action: hasPositions ? 'Review Allocation' : 'Add Portfolio'
    },
    {
      label: 'Cash Drag',
      score: hasCashFlow ? 58 : 0,
      status: hasCashFlow ? 'warning' : 'critical',
      insight: hasCashFlow ? '$42K excess cash earning 0.5% costs you ~$2,100/year' : 'Add cash flow data',
      action: hasCashFlow ? 'Deploy Cash' : 'Add Cash Flow'
    },
    {
      label: 'Risk Concentration',
      score: hasPositions ? 68 : 0,
      status: hasPositions ? 'warning' : 'critical',
      insight: hasPositions ? 'Top 3 holdings = 58% of portfolio. Consider diversifying.' : 'Add positions to analyze',
      action: hasPositions ? 'Reduce Risk' : 'Add Portfolio'
    }
  ];

  const overallScore = hasAnyData 
    ? Math.round(components.reduce((acc, c) => acc + c.score, 0) / components.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--gold-sand)';
    return 'var(--error)';
  };

  const onboardingSteps = [
    {
      id: 'tax',
      label: 'Upload Tax Return',
      description: 'Analyze tax efficiency opportunities',
      actionLabel: 'Upload',
      actionPath: '/dashboard/tax-intel',
      completed: hasTaxData
    },
    {
      id: 'portfolio',
      label: 'Add Portfolio Positions',
      description: 'Evaluate allocation and concentration',
      actionLabel: 'Add',
      actionPath: '/dashboard/allocation',
      completed: hasPositions
    }
  ];

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      {isLocked && (
        <LockedFeatureOverlay
          title="Unlock Your Efficiency Score"
          description="See how efficiently your wealth is working across tax, allocation, cash, and risk."
          requiredSteps={onboardingSteps}
          benefit="Average score improvement: 23 points"
        />
      )}
      <div className={styles.header}>
        <div className={styles.scoreCircle}>
          <svg viewBox="0 0 100 100" className={styles.scoreRing}>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--border, #2A3142)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={getScoreColor(overallScore)}
              strokeWidth="8"
              strokeDasharray={`${(overallScore / 100) * 264} 264`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className={styles.scoreValue}>
            <span className={styles.scoreNumber}>{overallScore}</span>
            <span className={styles.scoreLabel}>Score</span>
          </div>
        </div>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Wealth Efficiency Score</h3>
          <p className={styles.subtitle}>
            {overallScore >= 80 && 'Your wealth is working efficiently. Minor optimizations available.'}
            {overallScore >= 60 && overallScore < 80 && 'Room for improvement. Address yellow items to boost score.'}
            {overallScore < 60 && hasAnyData && 'Significant opportunities to optimize. Take action on red items.'}
            {!hasAnyData && 'Upload your data to see how efficiently your wealth is working.'}
          </p>
        </div>
      </div>

      <div className={styles.components}>
        {components.map((component) => (
          <div key={component.label} className={styles.componentRow}>
            <div className={styles.componentInfo}>
              <div className={styles.componentHeader}>
                <span className={`${styles.statusDot} ${styles[component.status]}`}></span>
                <span className={styles.componentLabel}>{component.label}</span>
                <span className={styles.componentScore}>{component.score}/100</span>
              </div>
              <p className={styles.componentInsight}>{component.insight}</p>
            </div>
            <button className={styles.componentAction}>{component.action}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

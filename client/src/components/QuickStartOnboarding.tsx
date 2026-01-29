import { useState } from 'react';
import styles from './QuickStartOnboarding.module.css';

interface QuickStartOnboardingProps {
  onComplete: () => void;
}

// Sample insights to show immediately - no input required
const DEMO_INSIGHTS = [
  {
    id: 1,
    type: 'opportunity',
    title: 'You might be overpaying taxes',
    description: 'Most people earning $100K+ leave $3,000-$8,000 on the table each year. Upload a paystub to see your specific opportunities.',
    impact: '$3,000+',
    action: 'Find My Savings',
  },
  {
    id: 2,
    type: 'warning',
    title: '401(k) match = free money',
    description: "If your employer matches and you're not maxing it out, you're literally turning down part of your salary.",
    impact: '50-100% return',
    action: 'Check My 401(k)',
  },
  {
    id: 3,
    type: 'insight',
    title: 'Your tax bracket matters more than you think',
    description: 'Knowing your marginal rate unlocks strategies that can save you thousands. Takes 30 seconds to calculate.',
    impact: 'Unlock strategies',
    action: 'Calculate My Rate',
  },
];

export default function QuickStartOnboarding({ onComplete }: QuickStartOnboardingProps) {
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInsightClick = async (insightId: number) => {
    setSelectedInsight(insightId);
    setIsLoading(true);
    
    // Mark onboarding as complete and redirect to relevant tool
    try {
      await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
    }
    
    // Redirect based on which insight they clicked
    setTimeout(() => {
      switch (insightId) {
        case 1:
          window.location.href = '/dashboard/tax';
          break;
        case 2:
          window.location.href = '/dashboard/tools';
          break;
        case 3:
          window.location.href = '/dashboard/tools';
          break;
        default:
          onComplete();
      }
    }, 500);
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
    }
    onComplete();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.welcomeBadge}>Welcome to Charge Wealth</div>
          <h1 className={styles.title}>Your AI CFO is ready</h1>
          <p className={styles.subtitle}>
            Here's what we found that could help you right now. Pick one to get started.
          </p>
        </div>

        <div className={styles.insights}>
          {DEMO_INSIGHTS.map((insight) => (
            <button
              key={insight.id}
              className={`${styles.insightCard} ${selectedInsight === insight.id ? styles.selected : ''}`}
              onClick={() => handleInsightClick(insight.id)}
              disabled={isLoading}
            >
              <div className={styles.insightHeader}>
                <span className={`${styles.insightType} ${styles[insight.type]}`}>
                  {insight.type === 'opportunity' && '💰'}
                  {insight.type === 'warning' && '⚠️'}
                  {insight.type === 'insight' && '💡'}
                </span>
                <span className={styles.insightImpact}>{insight.impact}</span>
              </div>
              <h3 className={styles.insightTitle}>{insight.title}</h3>
              <p className={styles.insightDescription}>{insight.description}</p>
              <span className={styles.insightAction}>
                {selectedInsight === insight.id && isLoading ? 'Loading...' : insight.action}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.skipButton} onClick={handleSkip}>
            Skip for now, take me to dashboard
          </button>
          <p className={styles.footerNote}>
            You can always explore these later. Your AI CFO learns more as you use it.
          </p>
        </div>
      </div>
    </div>
  );
}

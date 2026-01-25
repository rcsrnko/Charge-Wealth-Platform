import styles from './LockedFeatureOverlay.module.css';

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  completed: boolean;
}

interface LockedFeatureOverlayProps {
  title: string;
  description: string;
  requiredSteps: OnboardingStep[];
  benefit: string;
}

export default function LockedFeatureOverlay({ 
  title, 
  description, 
  requiredSteps,
  benefit 
}: LockedFeatureOverlayProps) {
  const incompleteSteps = requiredSteps.filter(step => !step.completed);

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.lockIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>Stop making expensive mistakes. Most high earners don't lack income—they lack unbiased support at the moments that matter. Connect your data to stop hoping and start executing.</p>
        
        <div className={styles.stepsSection}>
          <span className={styles.stepsLabel}>Eliminate Uncertainty:</span>
          <div className={styles.stepsList}>
            {incompleteSteps.map((step) => (
              <a 
                key={step.id} 
                href={step.actionPath}
                className={styles.stepCard}
              >
                <div className={styles.stepInfo}>
                  <span className={styles.stepLabel}>{step.label}</span>
                  <span className={styles.stepDescription}>{step.description}</span>
                </div>
                <span className={styles.stepAction}>{step.actionLabel}</span>
              </a>
            ))}
          </div>
        </div>
        
        <div className={styles.benefitBadge}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          {benefit}
        </div>
      </div>
    </div>
  );
}

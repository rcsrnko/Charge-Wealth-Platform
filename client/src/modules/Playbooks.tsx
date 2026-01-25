import styles from './Playbooks.module.css';

export default function Playbooks() {
  return (
    <div className={styles.container}>
      <div className={styles.comingSoonWrapper}>
        <div className={styles.comingSoonContent}>
          <div className={styles.comingSoonIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h1 className={styles.comingSoonTitle}>Custom Playbooks</h1>
          <p className={styles.comingSoonSubtitle}>Coming Soon</p>
          <p className={styles.comingSoonDesc}>
            Step-by-step financial action plans personalized to your goals. 
            Create, track, and complete playbooks for tax optimization, 
            debt payoff, retirement planning, and more.
          </p>
          <div className={styles.comingSoonFeatures}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📋</span>
              <span>Pre-built templates from CFP experts</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>✅</span>
              <span>Track progress step-by-step</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🎯</span>
              <span>Custom playbooks for your goals</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🔔</span>
              <span>Deadline reminders & alerts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import styles from './ErrorState.module.css';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

const DEFAULT_MESSAGES = [
  "Something went wrong.",
  "We couldn't complete your request.",
  "There was a hiccup on our end."
];

export default function ErrorState({ 
  message, 
  onRetry,
  compact = false 
}: ErrorStateProps) {
  const displayMessage = message || DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)];

  if (compact) {
    return (
      <div className={styles.compactError}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{displayMessage}</span>
        {onRetry && (
          <button onClick={onRetry} className={styles.compactRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
      <h3 className={styles.errorMessage}>{displayMessage}</h3>
      <p className={styles.errorHint}>Our team has been notified.</p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Tap to retry
        </button>
      )}
    </div>
  );
}

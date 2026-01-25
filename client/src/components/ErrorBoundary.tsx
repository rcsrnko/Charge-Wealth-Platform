import { Component, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  moduleName?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  'portfolio': "Couldn't load your portfolio.",
  'tax': "Couldn't load your tax data.",
  'ai': "Couldn't connect to your AI Advisor.",
  'referrals': "Couldn't load your referral stats.",
  'default': "Something went wrong."
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error?.message, error?.stack);
    console.error('Component stack:', errorInfo?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  getFriendlyMessage(): string {
    const { moduleName } = this.props;
    if (moduleName && FRIENDLY_MESSAGES[moduleName]) {
      return FRIENDLY_MESSAGES[moduleName];
    }
    return FRIENDLY_MESSAGES.default;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            <h3 className={styles.errorTitle}>{this.getFriendlyMessage()}</h3>
            <p className={styles.errorSubtitle}>
              Our team has been notified. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <button className={styles.retryButton} onClick={this.handleRetry}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

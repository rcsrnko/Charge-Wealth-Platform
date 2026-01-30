import { useEffect, useState } from 'react';
import styles from './WealthReadinessModal.module.css';

interface WealthReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasTaxData: boolean;
  hasPositions: boolean;
  hasProfile: boolean;
  hasCashFlow: boolean;
  onStepClick?: (step: string) => void;
}

interface ReadinessStep {
  id: string;
  label: string;
  description: string;
  unlocks: string;
  points: number;
  completed: boolean;
  path: string;
  actionText: string;
}

export default function WealthReadinessModal({ 
  isOpen,
  onClose,
  hasTaxData, 
  hasPositions, 
  hasProfile,
  hasCashFlow,
  onStepClick 
}: WealthReadinessModalProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const steps: ReadinessStep[] = [
    {
      id: 'profile',
      label: 'Complete Financial Profile',
      description: 'Income, goals, and risk tolerance',
      unlocks: 'Personalized analysis',
      points: 20,
      completed: hasProfile,
      path: '#profile',
      actionText: 'Set up profile'
    },
    {
      id: 'tax',
      label: 'Upload Tax Return',
      description: 'Your 1040 reveals opportunities',
      unlocks: 'Tax Advisor insights',
      points: 30,
      completed: hasTaxData,
      path: '/dashboard/tax-intel',
      actionText: 'Upload taxes'
    },
    {
      id: 'portfolio',
      label: 'Add Portfolio Positions',
      description: 'Import your holdings',
      unlocks: 'Portfolio analysis',
      points: 30,
      completed: hasPositions,
      path: '/dashboard/my-data',
      actionText: 'Add holdings'
    },
    {
      id: 'cashflow',
      label: 'Set Up Cash Flow',
      description: 'Monthly income and expenses',
      unlocks: 'Cash optimization',
      points: 20,
      completed: hasCashFlow,
      path: '#cashflow',
      actionText: 'Add cash flow'
    }
  ];

  const completedPoints = steps.filter(s => s.completed).reduce((sum, s) => sum + s.points, 0);
  const totalPoints = steps.reduce((sum, s) => sum + s.points, 0);
  const readinessScore = Math.round((completedPoints / totalPoints) * 100);
  const completedCount = steps.filter(s => s.completed).length;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAnimatedScore(readinessScore);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedScore(0);
    }
  }, [isOpen, readinessScore]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getScoreLabel = () => {
    if (readinessScore === 0) return 'Getting Started';
    if (readinessScore < 30) return 'Building Foundation';
    if (readinessScore < 60) return 'Gaining Clarity';
    if (readinessScore < 100) return 'Nearly Complete';
    return 'Fully Optimized';
  };

  const getScoreColor = () => {
    if (readinessScore < 30) return '#E74C3C';
    if (readinessScore < 60) return '#F39C12';
    if (readinessScore < 100) return '#3B82F6';
    return '#10B981';
  };

  const handleStepAction = (step: ReadinessStep) => {
    if (step.completed) return;
    
    if (step.path.startsWith('#')) {
      onStepClick?.(step.id);
      onClose();
    } else {
      window.location.href = step.path;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={styles.header}>
          <div className={styles.scoreSection}>
            <div className={styles.scoreRing}>
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={getScoreColor()}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${animatedScore * 2.64} 264`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                />
              </svg>
              <div className={styles.scoreValue}>
                <span className={styles.scoreNumber}>{animatedScore}</span>
                <span className={styles.scorePercent}>%</span>
              </div>
            </div>
            <div className={styles.scoreInfo}>
              <h2 className={styles.title}>Wealth Readiness</h2>
              <span className={styles.scoreLabel} style={{ color: getScoreColor() }}>
                {getScoreLabel()}
              </span>
              <span className={styles.completedCount}>
                {completedCount} of {steps.length} completed
              </span>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.subtitle}>
            Complete these steps to unlock personalized insights and get the most out of Charge Wealth.
          </p>

          <div className={styles.checklist}>
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`${styles.checklistItem} ${step.completed ? styles.completed : styles.incomplete}`}
              >
                <div className={styles.checkIcon}>
                  {step.completed ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  ) : (
                    <div className={styles.emptyCircle} />
                  )}
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemLabel}>{step.label}</span>
                    <span className={styles.itemPoints}>
                      {step.completed ? 'Done' : `+${step.points}%`}
                    </span>
                  </div>
                  <span className={styles.itemDescription}>
                    {step.completed ? step.unlocks : step.description}
                  </span>
                </div>
                {!step.completed && (
                  <button 
                    className={styles.actionButton}
                    onClick={() => handleStepAction(step)}
                  >
                    {step.actionText}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {readinessScore === 100 && (
          <div className={styles.celebrationBanner}>
            <span className={styles.celebrationIcon}>🎉</span>
            <span>You're fully set up! Explore all features.</span>
          </div>
        )}
      </div>
    </div>
  );
}

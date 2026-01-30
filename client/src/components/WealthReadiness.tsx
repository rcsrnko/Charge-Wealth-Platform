import { useEffect, useState } from 'react';
import styles from './WealthReadiness.module.css';

interface WealthReadinessProps {
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
}

export default function WealthReadiness({ 
  hasTaxData, 
  hasPositions, 
  hasProfile,
  hasCashFlow,
  onStepClick 
}: WealthReadinessProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const steps: ReadinessStep[] = [
    {
      id: 'profile',
      label: 'Complete Financial Profile',
      description: 'Income, goals, and risk tolerance',
      unlocks: 'Personalized analysis',
      points: 20,
      completed: hasProfile,
      path: '#profile' // Opens profile editor modal
    },
    {
      id: 'tax',
      label: 'Upload Tax Return',
      description: 'Your 1040 reveals opportunities',
      unlocks: 'Tax Advisor unlocked',
      points: 30,
      completed: hasTaxData,
      path: '/dashboard/tax-intel'
    },
    {
      id: 'portfolio',
      label: 'Add Portfolio Positions',
      description: 'Import your holdings',
      unlocks: 'Portfolio Engine unlocked',
      points: 30,
      completed: hasPositions,
      path: '/dashboard/allocation'
    },
    {
      id: 'cashflow',
      label: 'Add Cash Flow Data',
      description: 'Monthly income and expenses',
      unlocks: 'Cash optimization',
      points: 20,
      completed: hasCashFlow,
      path: '#cashflow' // Opens profile editor modal
    }
  ];

  const completedPoints = steps.filter(s => s.completed).reduce((sum, s) => sum + s.points, 0);
  const totalPoints = steps.reduce((sum, s) => sum + s.points, 0);
  const readinessScore = Math.round((completedPoints / totalPoints) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(readinessScore);
    }, 100);
    return () => clearTimeout(timer);
  }, [readinessScore]);

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
    if (readinessScore < 100) return '#3498DB';
    return '#F6DBA6';
  };

  const incompleteSteps = steps.filter(s => !s.completed);
  const nextStep = incompleteSteps[0];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.scoreSection}>
          <div className={styles.scoreRing}>
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getScoreColor()}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${animatedScore * 2.83} 283`}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 1s ease-out' }}
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
          </div>
        </div>
      </div>

      {nextStep && (
        <div className={styles.nextAction}>
          <div className={styles.nextLabel}>Next Step</div>
          {nextStep.path.startsWith('#') ? (
            <button
              className={styles.nextCard}
              onClick={(e) => {
                e.preventDefault();
                onStepClick?.(nextStep.id);
              }}
            >
              <div className={styles.nextContent}>
                <span className={styles.nextTitle}>{nextStep.label}</span>
                <span className={styles.nextDesc}>{nextStep.description}</span>
              </div>
              <div className={styles.nextReward}>
                <span className={styles.points}>+{nextStep.points}%</span>
              </div>
              <svg className={styles.nextArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          ) : (
            <a href={nextStep.path} className={styles.nextCard} onClick={() => onStepClick?.(nextStep.id)}>
              <div className={styles.nextContent}>
                <span className={styles.nextTitle}>{nextStep.label}</span>
                <span className={styles.nextDesc}>{nextStep.description}</span>
              </div>
              <div className={styles.nextReward}>
                <span className={styles.points}>+{nextStep.points}%</span>
              </div>
              <svg className={styles.nextArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          )}
        </div>
      )}

      <div className={styles.stepsGrid}>
        {steps.map((step) => (
          step.path.startsWith('#') ? (
            <button
              key={step.id}
              className={`${styles.stepCard} ${step.completed ? styles.completed : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onStepClick?.(step.id);
              }}
            >
              <div className={styles.stepCheck}>
                {step.completed ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  <span className={styles.stepPoints}>+{step.points}%</span>
                )}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepUnlocks}>{step.completed ? 'Completed' : step.unlocks}</span>
              </div>
            </button>
          ) : (
            <a
              key={step.id}
              href={step.path}
              className={`${styles.stepCard} ${step.completed ? styles.completed : ''}`}
              onClick={() => onStepClick?.(step.id)}
            >
              <div className={styles.stepCheck}>
                {step.completed ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  <span className={styles.stepPoints}>+{step.points}%</span>
                )}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepUnlocks}>{step.completed ? 'Completed' : step.unlocks}</span>
              </div>
            </a>
          )
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import styles from './TaxDeadlines.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface Deadline {
  id: string;
  date: Date;
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  urgency: 'urgent' | 'soon' | 'upcoming';
  category: 'filing' | 'payment' | 'contribution' | 'planning';
  personalNote?: string;
}

interface UserTaxContext {
  filingStatus?: string;
  hasEstimatedPayments?: boolean;
  owesAtTaxTime?: boolean;
  amountOwed?: number;
  has401k?: boolean;
  hasHSA?: boolean;
  hasIRA?: boolean;
}

export default function TaxDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [userContext, setUserContext] = useState<UserTaxContext>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      const response = await fetchWithAuth('/api/tax-intel/projection');
      if (response.ok) {
        const data = await response.json();
        const context: UserTaxContext = {
          filingStatus: data.filingStatus,
          hasEstimatedPayments: data.withholding?.status === 'under',
          owesAtTaxTime: data.withholding?.status === 'under',
          amountOwed: data.withholding?.federalDifference ? Math.abs(data.withholding.federalDifference) : 0,
          has401k: data.currentPeriod?.retirement401k > 0,
          hasHSA: data.currentPeriod?.hsaContribution > 0,
        };
        setUserContext(context);
        generateDeadlines(context);
      } else {
        generateDeadlines({});
      }
    } catch (err) {
      console.error('Failed to load tax context:', err);
      generateDeadlines({});
    } finally {
      setLoading(false);
    }
  };

  const generateDeadlines = (context: UserTaxContext) => {
    const now = new Date();
    const year = now.getFullYear();
    const allDeadlines: Deadline[] = [];

    // Q1 Estimated Payment - Jan 15
    const q4EstDate = new Date(year, 0, 15);
    if (q4EstDate > now || (now.getMonth() === 0 && now.getDate() <= 15)) {
      allDeadlines.push({
        id: 'q4-est',
        date: q4EstDate > now ? q4EstDate : new Date(year, 0, 15),
        title: 'Q4 Estimated Tax Payment',
        description: 'Final quarterly estimated tax payment for previous year',
        category: 'payment',
        urgency: getUrgency(q4EstDate),
        personalNote: context.owesAtTaxTime 
          ? `You may owe ~$${Math.round((context.amountOwed || 0) / 4).toLocaleString()} this quarter`
          : undefined,
        action: 'Pay Now',
        actionUrl: 'https://www.irs.gov/payments',
      });
    }

    // Tax Filing Deadline - Apr 15
    const filingDate = new Date(year, 3, 15);
    if (filingDate > now) {
      allDeadlines.push({
        id: 'filing',
        date: filingDate,
        title: 'Tax Filing Deadline',
        description: 'File your tax return or extension',
        category: 'filing',
        urgency: getUrgency(filingDate),
        personalNote: context.owesAtTaxTime 
          ? `Estimated amount owed: $${(context.amountOwed || 0).toLocaleString()}`
          : undefined,
      });
    }

    // IRA Contribution Deadline - Apr 15
    const iraDate = new Date(year, 3, 15);
    if (iraDate > now) {
      allDeadlines.push({
        id: 'ira',
        date: iraDate,
        title: 'IRA Contribution Deadline',
        description: `Last day to contribute to IRA for ${year - 1}`,
        category: 'contribution',
        urgency: getUrgency(iraDate),
        personalNote: 'Max contribution: $7,000 ($8,000 if 50+)',
        action: 'Contribute Now',
      });
    }

    // Q1 Estimated Payment - Apr 15
    const q1EstDate = new Date(year, 3, 15);
    if (q1EstDate > now && context.hasEstimatedPayments) {
      allDeadlines.push({
        id: 'q1-est',
        date: q1EstDate,
        title: 'Q1 Estimated Tax Payment',
        description: 'First quarterly estimated payment for current year',
        category: 'payment',
        urgency: getUrgency(q1EstDate),
        action: 'Calculate Payment',
      });
    }

    // Q2 Estimated Payment - Jun 15
    const q2EstDate = new Date(year, 5, 15);
    if (q2EstDate > now && context.hasEstimatedPayments) {
      allDeadlines.push({
        id: 'q2-est',
        date: q2EstDate,
        title: 'Q2 Estimated Tax Payment',
        description: 'Second quarterly estimated payment',
        category: 'payment',
        urgency: getUrgency(q2EstDate),
      });
    }

    // Q3 Estimated Payment - Sep 15
    const q3EstDate = new Date(year, 8, 15);
    if (q3EstDate > now && context.hasEstimatedPayments) {
      allDeadlines.push({
        id: 'q3-est',
        date: q3EstDate,
        title: 'Q3 Estimated Tax Payment',
        description: 'Third quarterly estimated payment',
        category: 'payment',
        urgency: getUrgency(q3EstDate),
      });
    }

    // HSA Contribution Deadline - Apr 15
    if (context.hasHSA) {
      const hsaDate = new Date(year, 3, 15);
      if (hsaDate > now) {
        allDeadlines.push({
          id: 'hsa',
          date: hsaDate,
          title: 'HSA Contribution Deadline',
          description: `Last day to contribute to HSA for ${year - 1}`,
          category: 'contribution',
          urgency: getUrgency(hsaDate),
          personalNote: 'Max: $4,150 individual / $8,300 family',
        });
      }
    }

    // 401k Max Out Reminder - Dec 1 (reminder before year end)
    const k401Reminder = new Date(year, 11, 1);
    if (k401Reminder > now && context.has401k) {
      allDeadlines.push({
        id: '401k-reminder',
        date: k401Reminder,
        title: '401(k) Max Out Reminder',
        description: 'Last chance to increase contributions before year end',
        category: 'contribution',
        urgency: getUrgency(k401Reminder),
        personalNote: '2026 limit: $23,500',
        action: 'Check Status',
        actionUrl: '/dashboard/401k-optimizer',
      });
    }

    // Tax-Loss Harvesting - Dec 31
    const tlhDate = new Date(year, 11, 31);
    if (tlhDate > now) {
      allDeadlines.push({
        id: 'tlh',
        date: tlhDate,
        title: 'Tax-Loss Harvesting Deadline',
        description: 'Last day to realize losses to offset gains',
        category: 'planning',
        urgency: getUrgency(tlhDate),
        personalNote: 'Review portfolio for harvesting opportunities',
      });
    }

    // Sort by date
    allDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Only show next 5 deadlines
    setDeadlines(allDeadlines.slice(0, 5));
  };

  const getUrgency = (date: Date): 'urgent' | 'soon' | 'upcoming' => {
    const now = new Date();
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 7) return 'urgent';
    if (daysUntil <= 30) return 'soon';
    return 'upcoming';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Passed';
    return `${days} days`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'filing': return '📄';
      case 'payment': return '💰';
      case 'contribution': return '💵';
      case 'planning': return '📊';
      default: return '📅';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading deadlines...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📅 Upcoming Tax Deadlines</h3>
      </div>
      
      <div className={styles.deadlinesList}>
        {deadlines.map((deadline) => (
          <div 
            key={deadline.id} 
            className={`${styles.deadlineItem} ${styles[deadline.urgency]}`}
          >
            <div className={styles.dateColumn}>
              <span className={styles.dateMonth}>{formatDate(deadline.date).split(' ')[0]}</span>
              <span className={styles.dateDay}>{formatDate(deadline.date).split(' ')[1]}</span>
              <span className={styles.daysUntil}>{getDaysUntil(deadline.date)}</span>
            </div>
            <div className={styles.infoColumn}>
              <div className={styles.deadlineHeader}>
                <span className={styles.categoryIcon}>{getCategoryIcon(deadline.category)}</span>
                <span className={styles.deadlineTitle}>{deadline.title}</span>
              </div>
              <p className={styles.deadlineDesc}>{deadline.description}</p>
              {deadline.personalNote && (
                <p className={styles.personalNote}>💡 {deadline.personalNote}</p>
              )}
            </div>
            {deadline.action && (
              <div className={styles.actionColumn}>
                {deadline.actionUrl?.startsWith('/') ? (
                  <a href={deadline.actionUrl} className={styles.actionBtn}>
                    {deadline.action}
                  </a>
                ) : deadline.actionUrl ? (
                  <a href={deadline.actionUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                    {deadline.action}
                  </a>
                ) : (
                  <button className={styles.actionBtn}>{deadline.action}</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

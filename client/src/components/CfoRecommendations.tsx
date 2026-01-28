import { useState, useEffect } from 'react';
import styles from './CfoRecommendations.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface Recommendation {
  id: number;
  category: string;
  strategy: string;
  title: string;
  description: string;
  cfpRationale?: string;
  estimatedSavings?: string;
  complexity: string;
  timeHorizon: string;
  priority: string;
  status: string;
  pointValue: number;
}

interface Stats {
  points: number;
  level: number;
  nextLevelPoints: number;
  progressToNextLevel: number;
  recommendations: {
    completed: number;
    pending: number;
    inProgress: number;
    total: number;
  };
}

export default function CfoRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recsRes, statsRes] = await Promise.all([
        fetchWithAuth('/api/cfo/recommendations'),
        fetchWithAuth('/api/cfo/stats')
      ]);
      
      if (recsRes.ok) {
        const data = await recsRes.json();
        setRecommendations(data.recommendations || []);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const response = await fetchWithAuth('/api/cfo/generate-recommendations', {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetchWithAuth(`/api/cfo/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to update recommendation:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tax':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
        );
      case 'investment':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18"/>
            <path d="M18 9l-5 5-4-4-4 4"/>
          </svg>
        );
      case 'savings':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="8"/>
            <path d="M12 8v4l2 2"/>
          </svg>
        );
      case 'insurance':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2l8 4v6c0 5.55-3.84 10.74-8 12-4.16-1.26-8-6.45-8-12V6l8-4z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const pendingRecs = recommendations.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedRecs = recommendations.filter(r => r.status === 'completed');

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your CFO recommendations...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            CFO Action Items
          </h3>
          <p className={styles.subtitle}>CFP-vetted strategies personalized for you</p>
        </div>
        
        {stats && (
          <div className={styles.pointsBadge}>
            <span className={styles.pointsValue}>{stats.points}</span>
            <span className={styles.pointsLabel}>points</span>
          </div>
        )}
      </div>

      {stats && (
        <div className={styles.progressSection}>
          <div className={styles.levelInfo}>
            <span className={styles.levelBadge}>Level {stats.level}</span>
            <span className={styles.levelProgress}>
              {stats.points % 100} / 100 to next level
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${stats.progressToNextLevel}%` }}
            />
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.recommendations.completed}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.recommendations.pending}</span>
              <span className={styles.statLabel}>Pending</span>
            </div>
          </div>
        </div>
      )}

      {pendingRecs.length === 0 && completedRecs.length === 0 ? (
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <h4>Get Personalized Recommendations</h4>
          <p>Generate CFP-vetted action items based on your financial profile</p>
          <button 
            className={styles.generateButton}
            onClick={generateRecommendations}
            disabled={generating}
          >
            {generating ? 'Analyzing your profile...' : 'Generate Recommendations'}
          </button>
        </div>
      ) : (
        <>
          {pendingRecs.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Action Items</h4>
              <div className={styles.recList}>
                {pendingRecs.map(rec => (
                  <div 
                    key={rec.id} 
                    className={`${styles.recCard} ${expandedId === rec.id ? styles.expanded : ''}`}
                  >
                    <div 
                      className={styles.recHeader}
                      onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                    >
                      <div className={styles.recIcon} style={{ color: getPriorityColor(rec.priority) }}>
                        {getCategoryIcon(rec.category)}
                      </div>
                      <div className={styles.recInfo}>
                        <h5 className={styles.recTitle}>{rec.title}</h5>
                        <div className={styles.recMeta}>
                          <span className={styles.recPriority} style={{ backgroundColor: getPriorityColor(rec.priority) }}>
                            {rec.priority}
                          </span>
                          {rec.estimatedSavings && (
                            <span className={styles.recSavings}>
                              Save ${parseFloat(rec.estimatedSavings).toLocaleString()}
                            </span>
                          )}
                          <span className={styles.recPoints}>+{rec.pointValue} pts</span>
                        </div>
                      </div>
                      <svg className={styles.expandIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                    
                    {expandedId === rec.id && (
                      <div className={styles.recDetails}>
                        <p className={styles.recDescription}>{rec.description}</p>
                        {rec.cfpRationale && (
                          <div className={styles.cfpNote}>
                            <strong>Why a CFP recommends this:</strong> {rec.cfpRationale}
                          </div>
                        )}
                        <div className={styles.recActions}>
                          <button 
                            className={styles.completeButton}
                            onClick={() => updateStatus(rec.id, 'completed')}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                            Mark Complete
                          </button>
                          <button 
                            className={styles.dismissButton}
                            onClick={() => updateStatus(rec.id, 'dismissed')}
                          >
                            Not for me
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedRecs.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                Completed ({completedRecs.length})
              </h4>
              <div className={styles.completedList}>
                {completedRecs.slice(0, 3).map(rec => (
                  <div key={rec.id} className={styles.completedItem}>
                    <span className={styles.completedTitle}>{rec.title}</span>
                    <span className={styles.completedPoints}>+{rec.pointValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            className={styles.refreshButton}
            onClick={generateRecommendations}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Get More Recommendations'}
          </button>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './ReferralDashboard.module.css';
import LoadingSpinner from '../components/LoadingSpinner';

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  referralEarnings: string;
  pendingReferrals: number;
  completedReferrals: number;
  recentReferrals: Array<{
    id: number;
    referredEmail: string | null;
    status: string;
    rewardAmount: string | null;
    createdAt: string;
    convertedAt: string | null;
  }>;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  referralCount: number;
  earnings: string;
}

export default function ReferralDashboard() {
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ['/api/referrals/stats'],
  });

  const { data: leaderboardData } = useQuery<{ leaderboard: LeaderboardEntry[] }>({
    queryKey: ['/api/referrals/leaderboard'],
  });

  const handleCopyLink = async () => {
    if (stats?.referralLink) {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'email') => {
    if (!stats?.referralLink) return;

    const message = `I'm using Charge Wealth to save on taxes and optimize my investments. Get $30 off with my link:`;
    const url = stats.referralLink;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=Get $30 off Charge Wealth&body=${encodeURIComponent(`${message}\n\n${url}`)}`;
        break;
    }
  };

  if (statsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Loading referral data..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Referral Program</h1>
        <p className={styles.subtitle}>Share Charge Wealth and earn $50 for every friend who joins</p>
      </div>

      <div className={styles.rewardsInfo}>
        <div className={styles.rewardCard}>
          <div className={styles.rewardIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className={styles.rewardContent}>
            <span className={styles.rewardLabel}>You Earn</span>
            <span className={styles.rewardValue}>$50 Credit</span>
          </div>
        </div>
        <div className={styles.rewardCard}>
          <div className={styles.rewardIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7"/>
              <polyline points="12 3 12 15"/>
              <polyline points="17 8 12 3 7 8"/>
            </svg>
          </div>
          <div className={styles.rewardContent}>
            <span className={styles.rewardLabel}>Friend Gets</span>
            <span className={styles.rewardValue}>$30 Off</span>
          </div>
        </div>
      </div>

      <div className={styles.linkSection}>
        <label className={styles.linkLabel}>Your Unique Referral Link</label>
        <div className={styles.linkContainer}>
          <input
            type="text"
            value={stats?.referralLink || ''}
            readOnly
            className={styles.linkInput}
          />
          <button onClick={handleCopyLink} className={styles.copyButton}>
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        <div className={styles.shareButtons}>
          <button onClick={() => handleShare('twitter')} className={styles.shareButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Share on X
          </button>
          <button onClick={() => handleShare('linkedin')} className={styles.shareButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </button>
          <button onClick={() => handleShare('email')} className={styles.shareButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.referralCount || 0}</span>
          <span className={styles.statLabel}>Friends Referred</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>${stats?.referralEarnings || '0'}</span>
          <span className={styles.statLabel}>Total Earned</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.pendingReferrals || 0}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.completedReferrals || 0}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
      </div>

      {leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 && (
        <div className={styles.leaderboard}>
          <h2 className={styles.sectionTitle}>Top Referrers This Month</h2>
          <div className={styles.leaderboardList}>
            {leaderboardData.leaderboard.map((entry) => (
              <div key={entry.rank} className={styles.leaderboardItem}>
                <div className={styles.leaderboardRank}>
                  {entry.rank <= 3 ? (
                    <span className={`${styles.medal} ${styles[`medal${entry.rank}`]}`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className={styles.rankNumber}>#{entry.rank}</span>
                  )}
                </div>
                <span className={styles.leaderboardName}>{entry.name}</span>
                <span className={styles.leaderboardCount}>{entry.referralCount} referrals</span>
                <span className={styles.leaderboardEarnings}>${entry.earnings}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
        <div className={styles.recentActivity}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <div className={styles.activityList}>
            {stats.recentReferrals.map((referral) => (
              <div key={referral.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {referral.status === 'completed' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  )}
                </div>
                <div className={styles.activityContent}>
                  <span className={styles.activityEmail}>
                    {referral.referredEmail || 'Anonymous visitor'}
                  </span>
                  <span className={styles.activityStatus}>
                    {referral.status === 'completed' ? 'Joined!' : 'Clicked your link'}
                  </span>
                </div>
                {referral.status === 'completed' && referral.rewardAmount && (
                  <span className={styles.activityReward}>+${referral.rewardAmount}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

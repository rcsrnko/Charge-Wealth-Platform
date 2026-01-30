import { useState, useEffect, ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import styles from './Sidebar.module.css';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
  description: string;
  lockedDescription: string;
  badge?: string;
  requiredScore: number;
}

const navItems: NavItem[] = [
  { 
    id: 'command-center', 
    label: 'Overview', 
    path: '/dashboard',
    description: 'The big picture',
    lockedDescription: 'The big picture',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  { 
    id: 'ai-advisor', 
    label: 'AI Advisor', 
    path: '/dashboard/ai',
    description: 'Ask me anything',
    lockedDescription: 'Ask me anything',
    badge: 'Start Here',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
        <circle cx="8" cy="14" r="1.5"/>
        <circle cx="16" cy="14" r="1.5"/>
      </svg>
    )
  },
  { 
    id: 'tax-intel', 
    label: 'Tax Strategy', 
    path: '/dashboard/tax-intel',
    description: 'Find money you\'re leaving on the table',
    lockedDescription: 'Unlock tax savings',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    )
  },
  { 
    id: 'market-pulse', 
    label: 'Markets', 
    path: '/dashboard/market-pulse',
    description: 'What\'s moving today',
    lockedDescription: 'Live market data',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )
  },
  { 
    id: '401k-optimizer', 
    label: '401(k)', 
    path: '/dashboard/401k-optimizer',
    description: 'Get your full match',
    lockedDescription: 'Retirement optimization',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )
  },
  { 
    id: 'scenarios', 
    label: 'What If?', 
    path: '/dashboard/scenarios',
    description: 'Run the numbers',
    lockedDescription: 'Life change calculator',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  },
  // Playbooks hidden until feature is built
  // { 
  //   id: 'playbooks', 
  //   label: 'Playbooks', 
  //   path: '/dashboard/playbooks',
  //   description: 'Action Plans',
  //   lockedDescription: 'Step-by-Step Actions',
  //   requiredScore: 20,
  //   icon: (...)
  // },
  { 
    id: 'my-data', 
    label: 'My Data', 
    path: '/dashboard/my-data',
    description: 'Your financial profile',
    lockedDescription: 'Your financial profile',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )
  },
  { 
    id: 'referrals', 
    label: 'Referrals', 
    path: '/dashboard/referrals',
    description: 'Get $50 per invite',
    lockedDescription: 'Share & earn',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    path: '/dashboard/settings',
    description: '',
    lockedDescription: '',
    requiredScore: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  },
];

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
  wealthScore?: number;
}

export default function Sidebar({ onCollapse, wealthScore = 0 }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isPathActive = (path: string) => location === path;
  
  const isItemLocked = (item: NavItem) => wealthScore < item.requiredScore;

  const handleLockedClick = (e: React.MouseEvent, item: NavItem) => {
    if (isItemLocked(item)) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: NavItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isItemLocked(item)) {
        window.location.href = item.path;
      }
    }
  };

  return (
    <>
      {isMobile && (
        <button 
          className={styles.hamburgerButton}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.header}>
          {!isCollapsed && (
            <Link href="/dashboard">
              <a className={styles.logoLink}>
                <h1 className={styles.logo}>Charge</h1>
                <span className={styles.tagline}>Wealth</span>
                <span className={styles.betaBadge}>Beta</span>
              </a>
            </Link>
          )}
          {isMobile ? (
            <button
              className={styles.closeBtn}
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          ) : (
            <button
              className={styles.toggleBtn}
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
              aria-expanded={!isCollapsed}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`${styles.toggleIcon} ${isCollapsed ? styles.rotated : ''}`}
              >
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          )}
        </div>

        <nav className={styles.nav} role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const locked = isItemLocked(item);
            return (
              <Link key={item.id} href={locked ? '#' : item.path}>
                <a 
                  className={`${styles.navItem} ${isPathActive(item.path) ? styles.active : ''} ${item.badge ? styles.hasBadge : ''} ${locked ? styles.locked : ''}`}
                  onClick={(e) => handleLockedClick(e, item)}
                  onKeyDown={(e) => handleKeyDown(e, item)}
                  tabIndex={0}
                  role="menuitem"
                  aria-label={`${item.label}: ${item.description}`}
                  aria-current={isPathActive(item.path) ? 'page' : undefined}
                  aria-disabled={locked}
                >
                  <div className={styles.navIcon}>
                    {item.icon}
                    {locked && (
                      <div className={styles.lockIcon}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C9.24 2 7 4.24 7 7v2H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  {(!isCollapsed || isMobile) && (
                    <div className={styles.navText}>
                      <div className={styles.labelRow}>
                        <span className={styles.label}>{item.label}</span>
                        {item.badge && !locked && <span className={styles.badge}>{item.badge}</span>}
                        {locked && <span className={styles.lockedBadge}>Locked</span>}
                      </div>
                      <span className={styles.description}>
                        {locked ? item.lockedDescription : item.description}
                      </span>
                    </div>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {(!isCollapsed || isMobile) && (
          <div className={styles.footer}>
            <div className={styles.scorePreview}>
              <div className={styles.scoreMini}>
                <span className={styles.scoreValue}>{wealthScore}%</span>
                <span className={styles.scoreLabel}>Wealth Readiness</span>
              </div>
              <div className={styles.scoreBar}>
                <div 
                  className={styles.scoreProgress} 
                  style={{ width: `${wealthScore}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

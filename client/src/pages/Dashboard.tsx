import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useTheme } from '../contexts/ThemeContext';
import { Route, Switch, useLocation } from 'wouter';
import Sidebar from '../components/Sidebar';
import WealthReadiness from '../components/WealthReadiness';
import CfoRecommendations from '../components/CfoRecommendations';
import OnboardingWizard from '../components/OnboardingWizard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import FinancialProfileEditor from '../components/FinancialProfileEditor';
import styles from './Dashboard.module.css';

const ChargeAI = lazy(() => import('../modules/ChargeAI'));
const ChargeTaxIntel = lazy(() => import('../modules/ChargeTaxIntel'));
const ChargeAllocation = lazy(() => import('../modules/ChargeAllocation'));
const Playbooks = lazy(() => import('../modules/Playbooks'));
const ReferralDashboard = lazy(() => import('../modules/ReferralDashboard'));

function ModuleLoader() {
  return (
    <div className={styles.moduleLoader}>
      <div className={styles.loaderSpinner} />
      <span>Loading...</span>
    </div>
  );
}

function ThemeToggleItem() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme} className={styles.dropdownItem}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

interface UserDataState {
  hasTaxData: boolean;
  hasPositions: boolean;
  hasProfile: boolean;
  hasCashFlow: boolean;
}

export default function Dashboard() {
  const { user: supabaseUser } = useSupabaseAuth();
  
  // Get user data from Supabase auth
  const user = supabaseUser ? {
    firstName: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.full_name?.split(' ')[0] || supabaseUser.user_metadata?.name?.split(' ')[0] || '',
    lastName: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    email: supabaseUser.email,
  } : null;
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [userData, setUserData] = useState<UserDataState>({
    hasTaxData: false,
    hasPositions: false,
    hasProfile: false,
    hasCashFlow: false
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserData = async () => {
      setIsLoading(true);
      try {
        const [contextRes, portfolioRes, taxRes] = await Promise.all([
          fetch('/api/charge-ai/context', { credentials: 'include' }),
          fetch('/api/allocation/portfolio', { credentials: 'include' }),
          fetch('/api/tax-intel/current', { credentials: 'include' })
        ]);
        
        const contextData = contextRes.ok ? await contextRes.json() : null;
        const portfolioData = portfolioRes.ok ? await portfolioRes.json() : null;
        const taxData = taxRes.ok ? await taxRes.json() : null;
        
        const hasProfile = !!contextData?.hasProfile;
        const hasPositions = portfolioData?.portfolio?.positions?.length > 0;
        const hasTaxData = !!taxData?.taxData || !!contextData?.hasTaxData;
        const hasCashFlow = !!(contextData?.profile?.monthlyExpenses && contextData?.profile?.currentCash);

        setUserData({
          hasTaxData,
          hasPositions,
          hasProfile,
          hasCashFlow
        });
      } catch (err) {
        console.error('Failed to check user data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserData();
  }, []);

  useEffect(() => {
    // Check if we should show onboarding from URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('showOnboarding') === 'true') {
      setShowOnboarding(true);
      // Clean up URL without page reload
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Close user menu on outside click, ESC key, or route change
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  // Close user menu on route change
  useEffect(() => {
    setShowUserMenu(false);
  }, [location]);

  // Page transition effect
  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  // Dynamic page titles
  useEffect(() => {
    const titles: Record<string, string> = {
      '/dashboard': 'Command Center | Charge Wealth',
      '/dashboard/ai': 'AI Advisor | Charge Wealth',
      '/dashboard/tax-intel': 'Tax Advisor | Charge Wealth',
      '/dashboard/allocation': 'Portfolio Engine | Charge Wealth',
      '/dashboard/playbooks': 'Playbooks | Charge Wealth',
      '/dashboard/referrals': 'Referral Program | Charge Wealth',
    };
    document.title = titles[location] || 'Charge Wealth';
  }, [location]);

  const { signOut: supabaseSignOut } = useSupabaseAuth();
  
  const handleLogout = async () => {
    try {
      await supabaseSignOut();
    } catch (e) {
      // Ignore Supabase signout errors
    }
    window.location.href = '/api/logout';
  };

  const isMainDashboard = location === '/dashboard';
  
  const calculateWealthScore = () => {
    let score = 0;
    if (userData.hasProfile) score += 20;
    if (userData.hasTaxData) score += 30;
    if (userData.hasPositions) score += 30;
    if (userData.hasCashFlow) score += 20;
    return score;
  };
  
  const wealthScore = calculateWealthScore();

  const getPageTitle = () => {
    if (isMainDashboard) return 'Command Center';
    if (location.includes('/ai')) return 'AI Advisor';
    if (location.includes('tax-intel')) return 'Tax Advisor';
    if (location.includes('allocation')) return 'Portfolio Engine';
    if (location.includes('playbooks')) return 'Playbooks';
    if (location.includes('referrals')) return 'Referral Program';
    return 'Charge Wealth';
  };

  const isModuleLocked = (module: string) => {
    if (module === 'ai' || module === 'command-center') return false;
    if (module === 'playbooks') return wealthScore < 20;
    // Tax Advisor and Portfolio Engine are always accessible so users can add data
    return false;
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Handle profile editor save
  const handleProfileSave = async () => {
    // Refresh user data after save
    try {
      const contextRes = await fetch('/api/charge-ai/context', { credentials: 'include' });
      if (contextRes.ok) {
        const contextData = await contextRes.json();
        const hasCashFlow = !!(contextData?.profile?.monthlyExpenses && contextData?.profile?.currentCash);
        setUserData(prev => ({
          ...prev,
          hasProfile: !!contextData?.hasProfile,
          hasCashFlow
        }));
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  // Handle WealthReadiness step clicks
  const handleStepClick = (step: string) => {
    if (step === 'profile' || step === 'cashflow') {
      setShowProfileEditor(true);
    }
  };

  // Show onboarding wizard if triggered
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar onCollapse={setSidebarCollapsed} wealthScore={wealthScore} />

      <FinancialProfileEditor
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        onSave={handleProfileSave}
      />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <header className={styles.topHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
            </div>
            <div className={styles.userSection} ref={userMenuRef}>
              <button 
                className={styles.userMenuTrigger}
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className={styles.userAvatar}>
                  {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
                <span className={styles.userName}>
                  {user?.firstName || user?.email?.split('@')[0]}
                </span>
                <svg 
                  className={`${styles.chevron} ${showUserMenu ? styles.open : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              
              {showUserMenu && (
                <div className={styles.userDropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownEmail}>{user?.email}</span>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <ThemeToggleItem />
                  <a href="/dashboard/referrals" className={styles.dropdownItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    Refer & Earn $50
                  </a>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div id="main-content" className={`${styles.pageContent} ${isTransitioning ? styles.transitioning : ''}`}>
          {isLoading ? (
            <div className={styles.dashboardLoading}>
              <LoadingSpinner size="large" text="Loading your dashboard..." />
            </div>
          ) : (
          <Switch>
            <Route path="/dashboard">
              <ErrorBoundary moduleName="default">
              <div className={styles.commandCenter}>
                <div className={styles.onboardingLayout}>
                  <div className={styles.primaryColumn}>
                    <div className={styles.aiAdvisorPromo}>
                      <div className={styles.promoHeader}>
                        <div className={styles.promoIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                            <circle cx="8" cy="14" r="1.5"/>
                            <circle cx="16" cy="14" r="1.5"/>
                          </svg>
                        </div>
                        <div className={styles.promoText}>
                          <h2 className={styles.promoTitle}>Your AI Advisor</h2>
                          <p className={styles.promoDesc}>
                            Ask any financial question. Get clear answers based on your actual data.
                          </p>
                        </div>
                      </div>
                      <a href="/dashboard/ai" className={styles.startButton}>
                        Start Conversation
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </a>
                    </div>

                    <WealthReadiness
                      hasTaxData={userData.hasTaxData}
                      hasPositions={userData.hasPositions}
                      hasProfile={userData.hasProfile}
                      hasCashFlow={userData.hasCashFlow}
                      onStepClick={handleStepClick}
                    />
                    
                    <CfoRecommendations />
                  </div>

                  <div className={styles.secondaryColumn}>
                    <h3 className={styles.columnTitle}>Unlock More Tools</h3>
                    
                    <div className={styles.lockedModules}>
                      <div className={`${styles.modulePreview} ${!isModuleLocked('tax-intel') ? styles.unlocked : ''}`}>
                        <div className={styles.moduleIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                          </svg>
                          {isModuleLocked('tax-intel') && (
                            <div className={styles.moduleLock}>
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C9.24 2 7 4.24 7 7v2H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className={styles.moduleInfo}>
                          <h4 className={styles.moduleName}>Tax Advisor</h4>
                          <p className={styles.moduleUnlock}>
                            {isModuleLocked('tax-intel') 
                              ? 'Upload tax return to unlock' 
                              : 'Find tax-saving opportunities'}
                          </p>
                        </div>
                        {!isModuleLocked('tax-intel') && (
                          <a href="/dashboard/tax-intel" className={styles.moduleLink}>Open</a>
                        )}
                      </div>

                      <div className={`${styles.modulePreview} ${!isModuleLocked('allocation') ? styles.unlocked : ''}`}>
                        <div className={styles.moduleIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2a10 10 0 1 0 10 10"/>
                            <path d="M12 2v10l6.5-3.5"/>
                            <path d="M12 12l6.5 3.5"/>
                          </svg>
                          {isModuleLocked('allocation') && (
                            <div className={styles.moduleLock}>
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C9.24 2 7 4.24 7 7v2H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className={styles.moduleInfo}>
                          <h4 className={styles.moduleName}>Portfolio Engine</h4>
                          <p className={styles.moduleUnlock}>
                            {isModuleLocked('allocation') 
                              ? 'Add positions to unlock' 
                              : 'Analyze risk & allocation'}
                          </p>
                        </div>
                        {!isModuleLocked('allocation') && (
                          <a href="/dashboard/allocation" className={styles.moduleLink}>Open</a>
                        )}
                      </div>

                      <div className={`${styles.modulePreview} ${!isModuleLocked('playbooks') ? styles.unlocked : ''}`}>
                        <div className={styles.moduleIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                            <rect x="9" y="3" width="6" height="4" rx="1"/>
                            <path d="M9 12l2 2 4-4"/>
                          </svg>
                          {isModuleLocked('playbooks') && (
                            <div className={styles.moduleLock}>
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C9.24 2 7 4.24 7 7v2H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className={styles.moduleInfo}>
                          <h4 className={styles.moduleName}>Playbooks</h4>
                          <p className={styles.moduleUnlock}>
                            {isModuleLocked('playbooks') 
                              ? 'Complete profile to unlock' 
                              : 'Step-by-step action plans'}
                          </p>
                        </div>
                        {!isModuleLocked('playbooks') && (
                          <a href="/dashboard/playbooks" className={styles.moduleLink}>Open</a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.disclaimer}>
                  Charge Wealth provides decision support based on your data. We don't sell products, manage money, or give personalized recommendations. Consult qualified professionals before acting.
                </div>
              </div>
              </ErrorBoundary>
            </Route>
            <Route path="/dashboard/ai">
              <ErrorBoundary moduleName="ai">
                <Suspense fallback={<ModuleLoader />}>
                  <ChargeAI />
                </Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/dashboard/tax-intel">
              <ErrorBoundary moduleName="tax">
                <Suspense fallback={<ModuleLoader />}>
                  {isModuleLocked('tax-intel') ? (
                    <LockedModule 
                      title="Tax Advisor"
                      description="Upload your tax return to unlock tax optimization insights."
                      requiredAction="Upload Tax Return"
                      actionPath="/dashboard/ai"
                    />
                  ) : (
                    <ChargeTaxIntel />
                  )}
                </Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/dashboard/allocation">
              <ErrorBoundary moduleName="portfolio">
                <Suspense fallback={<ModuleLoader />}>
                  {isModuleLocked('allocation') ? (
                    <LockedModule 
                      title="Portfolio Engine"
                      description="Add your portfolio positions to unlock CFA-level analysis."
                      requiredAction="Add Portfolio Positions"
                      actionPath="/dashboard/ai"
                    />
                  ) : (
                    <ChargeAllocation />
                  )}
                </Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/dashboard/playbooks">
              <ErrorBoundary moduleName="default">
                <Suspense fallback={<ModuleLoader />}>
                  {isModuleLocked('playbooks') ? (
                    <LockedModule 
                      title="Playbooks"
                      description="Complete your financial profile to unlock step-by-step action plans."
                      requiredAction="Complete Profile"
                      actionPath="/dashboard/ai"
                    />
                  ) : (
                    <Playbooks />
                  )}
                </Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/dashboard/referrals">
              <ErrorBoundary moduleName="referrals">
                <Suspense fallback={<ModuleLoader />}>
                  <ReferralDashboard />
                </Suspense>
              </ErrorBoundary>
            </Route>
          </Switch>
          )}
        </div>
      </div>
    </div>
  );
}

interface LockedModuleProps {
  title: string;
  description: string;
  requiredAction: string;
  actionPath: string;
}

function LockedModule({ title, description, requiredAction, actionPath }: LockedModuleProps) {
  return (
    <div className={styles.lockedModulePage}>
      <div className={styles.lockedContent}>
        <div className={styles.lockedIcon}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9.24 2 7 4.24 7 7v2H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
          </svg>
        </div>
        <h2 className={styles.lockedTitle}>{title}</h2>
        <p className={styles.lockedDesc}>{description}</p>
        <a href={actionPath} className={styles.lockedAction}>
          {requiredAction}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

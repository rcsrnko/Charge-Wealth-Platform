import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Route, Switch, Redirect } from 'wouter';
import { ThemeProvider } from './contexts/ThemeContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import Dashboard from './pages/Dashboard';
import DemoDashboard from './pages/DemoDashboard';
import AccountSetup from './pages/AccountSetup';
import { ToolsPage } from './pages/ToolsPage';
import { PremiumToolsPage } from './pages/PremiumToolsPage';
import { TakeChargeBlog } from './pages/TakeChargeBlog';
import OnboardingWizard from './components/OnboardingWizard';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { useState, useEffect } from 'react';

interface MembershipStatus {
  hasMembership: boolean;
  subscriptionStatus: string;
  subscriptionType: string | null;
  expiresAt: string | null;
  isTestUser: boolean;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Switch>
            {/* Public routes - no auth required */}
            <Route path="/tools/:rest*">
              <ErrorBoundary moduleName="tools">
                <ToolsPage />
              </ErrorBoundary>
            </Route>
            <Route path="/tools">
              <ErrorBoundary moduleName="tools">
                <ToolsPage />
              </ErrorBoundary>
            </Route>
            <Route path="/premium-tools">
              <ErrorBoundary moduleName="premium-tools">
                <PremiumToolsPage />
              </ErrorBoundary>
            </Route>
            <Route path="/take-charge/:rest*">
              <ErrorBoundary moduleName="blog">
                <TakeChargeBlog />
              </ErrorBoundary>
            </Route>
            <Route path="/take-charge">
              <ErrorBoundary moduleName="blog">
                <TakeChargeBlog />
              </ErrorBoundary>
            </Route>
            {/* Redirect /blog to /take-charge */}
            <Route path="/blog/:rest*">
              <Redirect to="/take-charge" />
            </Route>
            <Route path="/blog">
              <Redirect to="/take-charge" />
            </Route>
            <Route path="/demo">
              <ErrorBoundary moduleName="demo">
                <DemoDashboard />
              </ErrorBoundary>
            </Route>
            <Route>
              <ErrorBoundary moduleName="default">
                <AppRoutes />
              </ErrorBoundary>
            </Route>
          </Switch>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function LoginPage({ onBack }: { onBack?: () => void }) {
  const { signInWithGoogle, signInWithEmail } = useSupabaseAuth();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [signinData, setSigninData] = useState({ email: '', password: '' });
  const [signinError, setSigninError] = useState('');
  const [signinLoading, setSigninLoading] = useState(false);
  const [showMemberLogin, setShowMemberLogin] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    
    if (!memberEmail.trim()) {
      setMemberError('Please enter your email');
      return;
    }
    
    setMemberLoading(true);
    try {
      const res = await fetch('/api/auth/member-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: memberEmail }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('testUserAuth', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          subscriptionStatus: data.user.subscriptionStatus,
        }));
        window.location.href = '/dashboard';
      } else {
        setMemberError(data.message || 'Login failed');
        setMemberLoading(false);
      }
    } catch (error) {
      setMemberError('Login failed. Please try again.');
      setMemberLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
      setSocialLoading(null);
    }
  };

  const handleEmailSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninError('');
    
    if (!signinData.email.trim() || !signinData.password) {
      setSigninError('Please enter your email and password');
      return;
    }
    
    setSigninLoading(true);
    try {
      // First try our password-based login (for users who set password after Stripe payment)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: signinData.email, password: signinData.password }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Server session created, reload to pick it up
        window.location.href = '/dashboard';
        return;
      }
      
      // If our API says no password hash, try Supabase auth
      if (data.message?.includes('Google') || data.message?.includes('reset')) {
        try {
          await signInWithEmail(signinData.email, signinData.password);
          return;
        } catch (supabaseError: any) {
          setSigninError(supabaseError.message || 'Sign in failed. Please check your credentials.');
          setSigninLoading(false);
          return;
        }
      }
      
      // Otherwise show the error from our API
      setSigninError(data.message || 'Sign in failed. Please check your credentials.');
      setSigninLoading(false);
    } catch (error: any) {
      setSigninError(error.message || 'Sign in failed. Please check your credentials.');
      setSigninLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
    outline: 'none',
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600' as const,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '0.75rem',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '2rem',
      fontFamily: "'Raleway', -apple-system, sans-serif",
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          fontFamily: "'Lora', Georgia, serif",
        }}>
          Welcome Back
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
        }}>
          Sign in to access your financial tools
        </p>

        {showMemberLogin ? (
          <form onSubmit={handleMemberLogin}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              Already paid? Enter the email you used during checkout.
            </p>
            <input
              type="email"
              placeholder="Email Address"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              style={inputStyle}
            />
            
            {memberError && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {memberError}
              </p>
            )}
            
            <button
              type="submit"
              disabled={memberLoading}
              style={{
                ...buttonStyle,
                background: 'var(--brand-accent)',
                color: 'var(--text-on-honey)',
                opacity: memberLoading ? 0.7 : 1,
              }}
            >
              {memberLoading ? 'Verifying...' : 'Access My Account'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowMemberLogin(false)}
              style={{
                ...buttonStyle,
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
              }}
            >
              Back to login options
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailSignin}>
              <input
                type="email"
                placeholder="Email Address"
                value={signinData.email}
                onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={signinData.password}
                onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
                style={inputStyle}
              />
              
              {signinError && (
                <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {signinError}
                </p>
              )}
              
              <button
                type="submit"
                disabled={signinLoading}
                style={{
                  ...buttonStyle,
                  background: 'var(--brand-accent)',
                  color: 'var(--text-on-honey)',
                  opacity: signinLoading ? 0.7 : 1,
                }}
              >
                {signinLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1rem 0',
              gap: '1rem',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={socialLoading !== null}
              style={{
                ...buttonStyle,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {socialLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowMemberLogin(true)}
              style={{
                ...buttonStyle,
                background: 'transparent',
                color: 'var(--text-on-honey)',
                border: '1px solid var(--brand-accent)',
                marginTop: '0.5rem',
              }}
            >
              Already Paid? Access Account
            </button>
          </>
        )}
        
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.9375rem',
              cursor: 'pointer',
              marginTop: '1.5rem',
              textDecoration: 'underline',
            }}
          >
            ← Back to home
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        textAlign: 'center',
        color: 'var(--text-on-honey)',
      }}>
        <p>Loading...</p>
      </div>
    </div>
  );
}

function PaywallPage() {
  const { signOut } = useSupabaseAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [referralInfo, setReferralInfo] = useState<{ valid: boolean; referrerName: string; discount: number; finalPrice: number } | null>(null);

  // Check for referral code on mount
  useEffect(() => {
    const storedCode = localStorage.getItem('charge_referral_code');
    const timestamp = localStorage.getItem('charge_referral_timestamp');
    
    if (storedCode && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < 30 * 24 * 60 * 60 * 1000) {
        fetch(`/api/referrals/validate/${storedCode}`)
          .then(res => res.json())
          .then(data => {
            if (data.valid) {
              setReferralInfo(data);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const referralCode = localStorage.getItem('charge_referral_code');
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'lifetime',
          referralCode: referralCode || undefined,
        }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout. Please try again.');
        setCheckoutLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      localStorage.removeItem('testUserAuth');
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/';
    }
  };

  const price = referralInfo ? referralInfo.finalPrice : 279;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '2rem',
      fontFamily: "'Raleway', -apple-system, sans-serif",
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          fontFamily: "'Lora', Georgia, serif",
        }}>
          Membership Required
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          To access your AI-powered financial tools, you need an active membership. 
          Join our founding members and unlock lifetime access.
        </p>
        
        {referralInfo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.9375rem',
            color: '#22c55e',
            fontWeight: '500',
          }}>
            🎁 {referralInfo.referrerName} gave you ${referralInfo.discount} off!
          </div>
        )}
        
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ color: 'var(--text-on-honey)', marginBottom: '1rem', fontSize: '1.25rem' }}>
            Founding Member - ${price} Lifetime
            {referralInfo && (
              <span style={{ 
                textDecoration: 'line-through', 
                color: 'var(--text-secondary)', 
                fontSize: '1rem',
                marginLeft: '0.5rem',
              }}>
                $279
              </span>
            )}
          </h3>
          <ul style={{
            textAlign: 'left',
            color: 'var(--text-primary)',
            fontSize: '0.9375rem',
            lineHeight: '1.8',
            listStyle: 'none',
            padding: 0,
          }}>
            <li>✓ Save $5,000+ per year on taxes</li>
            <li>✓ Get instant answers to any financial question</li>
            <li>✓ 24/7 portfolio monitoring and alerts</li>
            <li>✓ Private Discord community access</li>
            <li>✓ Lifetime access, no recurring fees</li>
          </ul>
        </div>

        <button
          onClick={handleCheckout}
          disabled={checkoutLoading}
          style={{
            display: 'inline-block',
            background: checkoutLoading ? 'var(--text-secondary)' : 'var(--brand-accent)',
            color: 'var(--text-on-honey)',
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            cursor: checkoutLoading ? 'wait' : 'pointer',
            marginBottom: '1rem',
            opacity: checkoutLoading ? 0.7 : 1,
          }}
        >
          {checkoutLoading ? 'Loading...' : `Become a Founding Member - $${price}`}
        </button>
        
        <p style={{ marginTop: '1.5rem' }}>
          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Sign out and try a different account
          </button>
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isLoading: supabaseLoading, isAuthenticated: supabaseAuth } = useSupabaseAuth();
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);

  // Check for test user auth in localStorage
  const [testUserAuth, setTestUserAuth] = useState<any>(null);
  
  // Check for server session (set after Stripe payment)
  const [serverSessionAuth, setServerSessionAuth] = useState<boolean | null>(null);
  const [serverSessionUser, setServerSessionUser] = useState<any>(null);
  const [serverSessionLoading, setServerSessionLoading] = useState(true);
  
  useEffect(() => {
    const storedAuth = localStorage.getItem('testUserAuth');
    if (storedAuth) {
      try {
        setTestUserAuth(JSON.parse(storedAuth));
      } catch {
        localStorage.removeItem('testUserAuth');
      }
    }
  }, []);
  
  // Check server session on mount (handles Stripe payment flow)
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setServerSessionAuth(data.authenticated === true);
        if (data.authenticated && data.user) {
          setServerSessionUser(data.user);
          // Store in localStorage so Dashboard can access it
          localStorage.setItem('serverSessionUser', JSON.stringify(data.user));
        }
        setServerSessionLoading(false);
      })
      .catch(() => {
        setServerSessionAuth(false);
        setServerSessionLoading(false);
      });
  }, []);

  const TESTING_MODE = false;
  
  const isLoading = TESTING_MODE ? false : (supabaseLoading || serverSessionLoading);
  const isAuthenticated = TESTING_MODE ? true : (supabaseAuth || serverSessionAuth || !!testUserAuth);

  const { data: onboardingStatus, isLoading: onboardingLoading, refetch } = useQuery<{ onboardingCompleted: boolean }>({
    queryKey: ['/api/user/onboarding-status'],
    enabled: isAuthenticated,
  });

  // For test user, check membership from stored data instead of API
  const testUserHasMembership = testUserAuth?.subscriptionStatus === 'active';
  
  const { data: membershipStatus, isLoading: membershipLoading } = useQuery<MembershipStatus>({
    queryKey: ['/api/user/membership-status'],
    enabled: isAuthenticated && !testUserAuth, // Skip API call for test user
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  // Check for payment errors FIRST
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  if (paymentStatus === 'error' || paymentStatus === 'failed' || paymentStatus === 'cancelled') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {paymentStatus === 'cancelled' ? '🔙' : '⚠️'}
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {paymentStatus === 'cancelled' ? 'Payment Cancelled' : 'Payment Error'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {paymentStatus === 'cancelled' 
              ? "No worries! Your card wasn't charged. Ready to try again when you are."
              : "Something went wrong processing your payment. Please try again or contact support if the issue persists."}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a
              href="/"
              style={{
                padding: '0.875rem 1.5rem',
                background: 'var(--honey)',
                color: 'var(--text-on-honey)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Try Again
            </a>
            <a
              href="mailto:support@chargewealth.co"
              style={{
                padding: '0.875rem 1.5rem',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check for /setup page FIRST - before auth checks
  // This ensures users who just paid can set up their account even if they have an old session
  if (window.location.pathname === '/setup') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      return <AccountSetup />;
    }
  }

  if (!isAuthenticated) {
    // Show landing page for new visitors, login page if they clicked "Sign In"
    if (showLoginPage) {
      return <LoginPage onBack={() => setShowLoginPage(false)} />;
    }
    return <LandingPage onShowLogin={() => setShowLoginPage(true)} />;
  }

  // Show paywall if user doesn't have membership (after loading)
  // For test user, use stored subscription status
  if (testUserAuth) {
    if (!testUserHasMembership) {
      return <PaywallPage />;
    }
  } else if (!membershipLoading) {
    if (!membershipStatus || !membershipStatus.hasMembership) {
      return <PaywallPage />;
    }
  }

  const showWizard = (
    isAuthenticated && 
    !wizardDismissed && 
    !onboardingLoading &&
    onboardingStatus && 
    !onboardingStatus.onboardingCompleted
  );

  const handleWizardComplete = () => {
    setWizardDismissed(true);
    refetch();
  };

  return (
    <>
      {showWizard && (
        <OnboardingWizard onComplete={handleWizardComplete} />
      )}
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/:module" component={Dashboard} />
        <Route>
          <Redirect to="/dashboard" />
        </Route>
      </Switch>
    </>
  );
}

export default App;

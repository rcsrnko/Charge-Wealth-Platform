import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Route, Switch, Redirect } from 'wouter';
import { ThemeProvider } from './contexts/ThemeContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import Dashboard from './pages/Dashboard';
import DemoDashboard from './pages/DemoDashboard';
import { ToolsPage } from './pages/ToolsPage';
import { TakeChargeBlog } from './pages/TakeChargeBlog';
import OnboardingWizard from './components/OnboardingWizard';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
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

function LoginPage() {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail } = useSupabaseAuth();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showEmailSignin, setShowEmailSignin] = useState(false);
  const [signupData, setSignupData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [signinData, setSigninData] = useState({ email: '', password: '' });
  const [signupError, setSignupError] = useState('');
  const [signinError, setSigninError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signinLoading, setSigninLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
      setSocialLoading(null);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    if (!signupData.firstName.trim() || !signupData.lastName.trim() || !signupData.email.trim() || !signupData.password) {
      setSignupError('Please fill in all fields');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      setSignupError('Please enter a valid email address');
      return;
    }
    
    if (signupData.password.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    
    setSignupLoading(true);
    try {
      await signUpWithEmail(signupData.email, signupData.password, signupData.firstName, signupData.lastName);
      setSignupSuccess(true);
    } catch (error: any) {
      setSignupError(error.message || 'Signup failed. Please try again.');
      setSignupLoading(false);
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
      // Check for test account
      if (signinData.email === 'testuser@test.com') {
        const res = await fetch('/api/test-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: signinData.email, password: signinData.password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // Store test user auth in localStorage
          localStorage.setItem('testUserAuth', JSON.stringify(data.user));
          window.location.href = '/dashboard';
          return;
        } else {
          setSigninError(data.message || 'Sign in failed. Please check your credentials.');
          setSigninLoading(false);
          return;
        }
      }
      await signInWithEmail(signinData.email, signinData.password);
    } catch (error: any) {
      setSigninError(error.message || 'Sign in failed. Please check your credentials.');
      setSigninLoading(false);
    }
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.875rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
    marginBottom: '0.75rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '0.9375rem',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.05)',
    color: '#F4F5F7',
    marginBottom: '0.75rem',
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0F1117 0%, #1A1D28 100%)',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#C9A962',
          marginBottom: '0.5rem',
          letterSpacing: '0.05em',
        }}>
          Charge Wealth
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#F4F5F7',
          marginBottom: '0.5rem',
        }}>
          {showSignup ? 'Create your account' : 'Welcome back'}
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '2rem',
          lineHeight: '1.5',
        }}>
          {showSignup ? 'Sign up to get lifetime access to your AI CFO.' : 'Sign in to access your financial decision tools.'}
        </p>

        {signupSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ color: '#C9A962', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Check Your Email</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
              We sent a confirmation link to <strong>{signupData.email}</strong>. Click the link to activate your account.
            </p>
            <button
              onClick={() => { setSignupSuccess(false); setShowSignup(false); setShowEmailSignin(true); }}
              style={{
                ...buttonStyle,
                background: '#C9A962',
                color: '#0F1117',
              }}
            >
              Sign In
            </button>
          </div>
        ) : showSignup ? (
          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="First Name"
              value={signupData.firstName}
              onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={signupData.lastName}
              onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
              style={inputStyle}
            />
            
            {signupError && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {signupError}
              </p>
            )}
            
            <button
              type="submit"
              disabled={signupLoading}
              style={{
                ...buttonStyle,
                background: '#C9A962',
                color: '#0F1117',
                opacity: signupLoading ? 0.7 : 1,
              }}
            >
              {signupLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              gap: '1rem',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={socialLoading !== null}
              style={{
                ...buttonStyle,
                background: '#fff',
                color: '#1f2937',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {socialLoading === 'google' ? 'Signing up...' : 'Sign Up with Google'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowSignup(false)}
              style={{
                ...buttonStyle,
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: 'none',
                marginTop: '0.5rem',
              }}
            >
              Already have an account? Sign in
            </button>
          </form>
        ) : showEmailSignin ? (
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
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {signinError}
              </p>
            )}
            
            <button
              type="submit"
              disabled={signinLoading}
              style={{
                ...buttonStyle,
                background: '#C9A962',
                color: '#0F1117',
                opacity: signinLoading ? 0.7 : 1,
              }}
            >
              {signinLoading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              gap: '1rem',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={socialLoading !== null}
              style={{
                ...buttonStyle,
                background: '#fff',
                color: '#1f2937',
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
              onClick={() => { setShowEmailSignin(false); setShowSignup(true); }}
              style={{
                ...buttonStyle,
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: 'none',
                marginTop: '0.5rem',
              }}
            >
              Don't have an account? Sign up
            </button>
          </form>
        ) : (
          <>
            <button
              onClick={() => setShowSignup(true)}
              style={{
                ...buttonStyle,
                background: '#C9A962',
                color: '#0F1117',
              }}
            >
              Create Account
            </button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              gap: '1rem',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>or sign in</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </div>
            
            <button
              onClick={() => setShowEmailSignin(true)}
              style={{
                ...buttonStyle,
                background: 'transparent',
                color: '#F4F5F7',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Sign In with Email
            </button>
        
            <button
              onClick={handleGoogleLogin}
              disabled={socialLoading !== null}
              style={{
                ...buttonStyle,
                background: '#fff',
                color: '#1f2937',
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
          </>
        )}
        
        <p style={{
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
        }}>
          No 1% AUM fees. No sales. No BS.
        </p>
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
      background: '#0F1117',
    }}>
      <div style={{
        textAlign: 'center',
        color: '#C9A962',
      }}>
        <p>Loading...</p>
      </div>
    </div>
  );
}

function PaywallPage() {
  const { signOut } = useSupabaseAuth();
  
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0F1117 0%, #1A1D28 100%)',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#C9A962',
          marginBottom: '0.5rem',
        }}>
          Membership Required
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          To access your AI-powered financial tools, you need an active membership. 
          Join our founding members and unlock lifetime access.
        </p>
        
        <div style={{
          background: 'rgba(201, 169, 98, 0.1)',
          border: '1px solid rgba(201, 169, 98, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ color: '#C9A962', marginBottom: '1rem', fontSize: '1.25rem' }}>
            Founding Member - $279 Lifetime
          </h3>
          <ul style={{
            textAlign: 'left',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            lineHeight: '1.8',
            listStyle: 'none',
            padding: 0,
          }}>
            <li>✓ AI Advisor - Your personal financial CFO</li>
            <li>✓ Tax Optimizer - Find hidden savings</li>
            <li>✓ Portfolio Monitor - 24/7 opportunity alerts</li>
            <li>✓ Lifetime access - No recurring fees</li>
          </ul>
        </div>

        <a
          href="/#founding-members"
          style={{
            display: 'inline-block',
            background: '#C9A962',
            color: '#0F1117',
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '6px',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          Become a Founding Member
        </a>
        
        <p style={{ marginTop: '1.5rem' }}>
          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
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

  // Check for test user auth in localStorage
  const [testUserAuth, setTestUserAuth] = useState<any>(null);
  
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

  const TESTING_MODE = false;
  
  const isLoading = TESTING_MODE ? false : supabaseLoading;
  const isAuthenticated = TESTING_MODE ? true : (supabaseAuth || !!testUserAuth);

  const { data: onboardingStatus, isLoading: onboardingLoading, refetch } = useQuery<{ onboardingCompleted: boolean }>({
    queryKey: ['/api/user/onboarding-status'],
    enabled: isAuthenticated,
  });

  const { data: membershipStatus, isLoading: membershipLoading } = useQuery<MembershipStatus>({
    queryKey: ['/api/user/membership-status'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show paywall if user doesn't have membership (after loading)
  // CRITICAL: Show paywall unless we explicitly confirm membership
  if (!membershipLoading) {
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

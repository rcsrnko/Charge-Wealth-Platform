import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Route, Switch, Redirect } from 'wouter';
import { ThemeProvider } from './contexts/ThemeContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import OnboardingWizard from './components/OnboardingWizard';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { useState } from 'react';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <ErrorBoundary moduleName="default">
            <AppRoutes />
          </ErrorBoundary>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function LoginPage() {
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
          Welcome back
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '2rem',
          lineHeight: '1.5',
        }}>
          Sign in to access your financial decision tools.
        </p>
        <a
          href="/api/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            background: '#C9A962',
            color: '#0F1117',
            padding: '0.875rem 1.5rem',
            fontSize: '0.9375rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textDecoration: 'none',
          }}
        >
          Sign In with Replit
        </a>
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

function AppRoutes() {
  const { isLoading: supabaseLoading, isAuthenticated: supabaseAuth } = useSupabaseAuth();
  const { isLoading: replitLoading, isAuthenticated: replitAuth } = useAuth();
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const TESTING_MODE = false;
  
  const isLoading = TESTING_MODE ? false : (supabaseLoading && replitLoading);
  const isAuthenticated = TESTING_MODE ? true : (supabaseAuth || replitAuth);

  const { data: onboardingStatus, isLoading: onboardingLoading, refetch } = useQuery<{ onboardingCompleted: boolean }>({
    queryKey: ['/api/user/onboarding-status'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
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

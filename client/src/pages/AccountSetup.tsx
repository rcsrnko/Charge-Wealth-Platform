import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

export default function AccountSetup() {
  const [, setLocation] = useLocation();
  const { signInWithGoogle, linkGoogleAccount } = useSupabaseAuth();
  
  const [step, setStep] = useState<'choice' | 'password' | 'success'>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Get email from URL params (passed from payment success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    // Check if payment was successful
    const paymentStatus = params.get('payment');
    if (paymentStatus !== 'success') {
      // If no successful payment, redirect to home
      setLocation('/');
    }
  }, [setLocation]);

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set password');
      }
      
      // Store user in localStorage immediately so Dashboard can access it
      if (data.user) {
        localStorage.setItem('serverSessionUser', JSON.stringify(data.user));
      }
      
      setStep('success');
      // Full page reload to pick up new session
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      // Sign in with Google - this will link to the existing account by email
      await signInWithGoogle();
      // The OAuth redirect will handle the rest
    } catch (err: any) {
      setError(err.message || 'Failed to connect Google');
      setGoogleLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    marginBottom: '1rem',
    outline: 'none',
  };

  const buttonPrimary: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1.5rem',
    background: 'var(--honey)',
    color: 'var(--text-on-honey)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  };

  const buttonSecondary: React.CSSProperties = {
    ...buttonPrimary,
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  };

  if (step === 'success') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ color: 'var(--honey)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              You're All Set!
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your account is ready. Redirecting to your dashboard...
            </p>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid var(--border)', 
              borderTopColor: 'var(--honey)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }} />
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (step === 'password') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <button
            onClick={() => setStep('choice')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              padding: 0,
            }}
          >
            ← Back
          </button>
          
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Create Your Password
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            You'll use this to log in to your account
          </p>
          
          <form onSubmit={handlePasswordSetup}>
            <input
              type="email"
              value={email}
              disabled
              style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
            />
            <input
              type="password"
              placeholder="Create password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoFocus
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
            
            {error && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error}
              </p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              style={{ ...buttonPrimary, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Setting up...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Choice step (default)
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h1 style={{ color: 'var(--honey)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Payment Successful!
          </h1>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
            Welcome to Charge Wealth
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            One last step: set up your login method
          </p>
        </div>
        
        {email && (
          <div style={{
            background: 'var(--bg-primary)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Account email: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</span>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleGoogleConnect}
            disabled={googleLoading}
            style={buttonSecondary}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '0.5rem 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          
          <button
            onClick={() => setStep('password')}
            style={buttonPrimary}
          >
            Create Password
          </button>
        </div>
        
        {error && (
          <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
            {error}
          </p>
        )}
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.75rem', 
          textAlign: 'center',
          marginTop: '1.5rem',
        }}>
          You can always add more login methods later in Settings
        </p>
      </div>
    </div>
  );
}

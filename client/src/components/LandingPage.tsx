import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

interface LandingPageProps {
  onShowLogin: () => void;
}

export function LandingPage({ onShowLogin }: LandingPageProps) {
  const { signInWithGoogle, signUpWithEmail } = useSupabaseAuth();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [signupData, setSignupData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [foundingStats, setFoundingStats] = useState({ remaining: 0, claimed: 0, total: 250 });

  useEffect(() => {
    fetch('/api/stats/founding')
      .then(res => res.json())
      .then(data => setFoundingStats(data))
      .catch(() => setFoundingStats({ remaining: 47, claimed: 203, total: 250 }));
  }, []);

  const handleGoogleSignup = async () => {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google signup failed:', error);
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

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '1px solid #E5E1DA',
    borderRadius: '8px',
    background: '#FFFFFF',
    color: '#1A1A1A',
    marginBottom: '0.75rem',
    outline: 'none',
  };

  const buttonPrimary = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '1rem 1.5rem',
    fontSize: '1.0625rem',
    fontWeight: '600' as const,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#1A1A1A',
    color: '#FFFFFF',
    marginBottom: '0.75rem',
  };

  // Signup form modal
  if (showSignupForm) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}>
        <div style={{
          background: '#FAF8F5',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '420px',
          width: '100%',
          position: 'relative',
        }}>
          <button
            onClick={() => setShowSignupForm(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            ×
          </button>

          {signupSuccess ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#2E7D32' }}>✓</div>
              <h2 style={{ color: '#1A1A1A', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Check Your Email</h2>
              <p style={{ color: '#4B5563', marginBottom: '1.5rem' }}>
                We sent a confirmation link to <strong>{signupData.email}</strong>. Click the link to activate your account.
              </p>
              <button
                onClick={() => { setSignupSuccess(false); setShowSignupForm(false); onShowLogin(); }}
                style={buttonPrimary}
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '0.5rem' }}>
                  Join the Beta
                </h2>
                <p style={{ color: '#4B5563', fontSize: '0.9375rem' }}>
                  Only <span style={{ color: '#B8860B', fontWeight: '600' }}>{foundingStats.remaining} spots left</span> at the founding member price
                </p>
              </div>

              <button
                onClick={handleGoogleSignup}
                disabled={socialLoading !== null}
                style={{
                  ...buttonPrimary,
                  background: '#FFFFFF',
                  color: '#1A1A1A',
                  border: '1px solid #E5E1DA',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {socialLoading === 'google' ? 'Signing up...' : 'Continue with Google'}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1rem 0',
                gap: '1rem',
              }}>
                <div style={{ flex: 1, height: '1px', background: '#E5E1DA' }} />
                <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#E5E1DA' }} />
              </div>

              <form onSubmit={handleSignup}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                    style={{ ...inputStyle, width: '50%' }}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                    style={{ ...inputStyle, width: '50%' }}
                  />
                </div>
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
                  <p style={{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {signupError}
                  </p>
                )}
                
                <button
                  type="submit"
                  disabled={signupLoading}
                  style={{
                    ...buttonPrimary,
                    opacity: signupLoading ? 0.7 : 1,
                  }}
                >
                  {signupLoading ? 'Creating Account...' : 'Get Started Free'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => { setShowSignupForm(false); onShowLogin(); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4B5563',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Already have an account? Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F5',
      fontFamily: "'Raleway', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1A1A1A',
          fontFamily: "'Lora', Georgia, serif",
        }}>
          Charge Wealth
        </div>
        <button
          onClick={onShowLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#4B5563',
            fontSize: '0.9375rem',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '4rem 2rem 3rem',
        textAlign: 'center',
      }}>
        {/* Limited beta badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(184, 134, 11, 0.1)',
          border: '1px solid rgba(184, 134, 11, 0.3)',
          borderRadius: '100px',
          padding: '0.5rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#996F09',
          fontWeight: '500',
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            background: '#B8860B', 
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
          }} />
          Limited Beta: Only {foundingStats.remaining} spots remaining
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: '600',
          color: '#1A1A1A',
          marginBottom: '1rem',
          lineHeight: '1.2',
          fontFamily: "'Lora', Georgia, serif",
        }}>
          Stop Overpaying Taxes.<br />
          <span style={{ color: '#B8860B' }}>Keep $5K+ More</span> This Year.
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: '#4B5563',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem',
          lineHeight: '1.6',
        }}>
          Get a virtual CFO that finds missed deductions, monitors your portfolio 24/7, 
          and tells you exactly what moves to make. Like having a $50K/year advisor for a one-time fee.
        </p>

        <button
          onClick={() => setShowSignupForm(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem 2.5rem',
            fontSize: '1.0625rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: '#1A1A1A',
            color: '#FFFFFF',
            marginBottom: '1rem',
          }}
        >
          Claim Your Spot ($279 Lifetime)
        </button>

        <p style={{
          fontSize: '0.875rem',
          color: '#6B7280',
        }}>
          No recurring fees. No 1% AUM charges. Ever.
        </p>
      </section>

      {/* Benefits Grid */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2rem 2rem 4rem',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {[
            {
              icon: '💰',
              title: 'Save $5,000+ on Taxes',
              description: 'Find overlooked deductions, optimize retirement contributions, and time capital gains. Members save an average of $5,200 in their first year.',
            },
            {
              icon: '⚡',
              title: 'Get Answers in Seconds',
              description: '"Should I max out my 401k or pay off debt?" Get instant, personalized advice instead of waiting weeks for a financial advisor appointment.',
            },
            {
              icon: '🔔',
              title: 'Never Miss an Opportunity',
              description: '24/7 portfolio monitoring catches tax-loss harvesting moments, rebalancing needs, and dividend changes before they cost you money.',
            },
          ].map((benefit, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '1.75rem',
                border: '1px solid #E5E1DA',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{benefit.icon}</div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '0.75rem',
              }}>
                {benefit.title}
              </h3>
              <p style={{
                fontSize: '0.9375rem',
                color: '#4B5563',
                lineHeight: '1.5',
              }}>
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section style={{
        background: '#F5F2ED',
        padding: '4rem 2rem',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: '2rem',
            fontFamily: "'Lora', Georgia, serif",
          }}>
            What Founding Members Are Saying
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {[
              {
                quote: "Found $3,200 in deductions I would have missed. Paid for itself 10x over.",
                name: "Michael R.",
                role: "Software Engineer",
              },
              {
                quote: "Finally, financial advice that doesn't cost 1% of my portfolio every year.",
                name: "Sarah K.",
                role: "Product Manager",
              },
              {
                quote: "The tax-loss harvesting alerts alone saved me more than the lifetime cost.",
                name: "David L.",
                role: "Startup Founder",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ color: '#B8860B', marginBottom: '0.75rem' }}>★★★★★</div>
                <p style={{
                  fontSize: '0.9375rem',
                  color: '#374151',
                  lineHeight: '1.5',
                  marginBottom: '1rem',
                  fontStyle: 'italic',
                }}>
                  "{testimonial.quote}"
                </p>
                <div>
                  <div style={{ fontWeight: '600', color: '#1A1A1A', fontSize: '0.9375rem' }}>
                    {testimonial.name}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.8125rem' }}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '4rem 2rem',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1A1A1A',
          marginBottom: '2rem',
          textAlign: 'center',
          fontFamily: "'Lora', Georgia, serif",
        }}>
          What You Get
        </h2>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #E5E1DA',
        }}>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}>
            {[
              'AI Advisor that answers any financial question in seconds',
              'Tax Optimizer that finds every deduction you qualify for',
              'Portfolio Monitor with 24/7 alerts and rebalancing reminders',
              'Retirement Planner showing your exact path to financial freedom',
              'One-time $279 payment, lifetime access, no hidden fees',
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: i < 4 ? '1px solid #F5F2ED' : 'none',
                }}
              >
                <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>✓</span>
                <span style={{ color: '#374151', fontSize: '1rem' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        background: '#1A1A1A',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: '1rem',
            fontFamily: "'Lora', Georgia, serif",
          }}>
            Ready to Stop Leaving Money on the Table?
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '2rem',
            fontSize: '1rem',
          }}>
            Join 200+ founding members who are already saving thousands. Beta pricing won't last.
          </p>

          <button
            onClick={() => setShowSignupForm(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem 2.5rem',
              fontSize: '1.0625rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#B8860B',
              color: '#FFFFFF',
              marginBottom: '1rem',
            }}
          >
            Claim Your Spot Now
          </button>

          <p style={{
            fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.5)',
          }}>
            30-day money-back guarantee. No questions asked.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6B7280',
        fontSize: '0.8125rem',
      }}>
        <p>© 2025 Charge Wealth. Not financial advice. For informational purposes only.</p>
      </footer>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Route, Switch, Link } from 'wouter';
import { 
  TaxBracketCalculator,
  AdvisorFeeCalculator,
  RothVsTraditionalCalculator,
  EmergencyFundCalculator,
  NetWorthTracker,
  Contribution401kCalculator
} from '../tools';
import { PremiumToolsPage } from './PremiumToolsPage';

// Theme hook for dark/light mode
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tools-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('tools-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark(!isDark) };
}

// Color scheme helper
function getColors(isDark: boolean) {
  return isDark ? {
    bg: '#121212',
    bgSecondary: '#1E1E1E',
    bgTertiary: '#252525',
    textPrimary: '#F5F5F5',
    textSecondary: '#A3A3A3',
    textMuted: '#737373',
    accent: '#F6DBA6',
    accentHover: '#E8C88A',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.15)',
    card: '#1E1E1E',
  } : {
    bg: '#F9F6F0',
    bgSecondary: '#F5F2ED',
    bgTertiary: '#EFEBE5',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#F6DBA6',
    accentHover: '#E8C88A',
    border: 'rgba(0,0,0,0.08)',
    borderHover: 'rgba(0,0,0,0.12)',
    card: '#FFFDFB',
  };
}

// Theme toggle component
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 14,
        color: isDark ? '#F5F5F5' : '#1F2937',
        transition: 'all 0.2s',
      }}
    >
      {isDark ? <span style={{ fontSize: 16 }}>☀️</span> : <span style={{ fontSize: 16 }}>🌙</span>}
    </button>
  );
}

// Tools index page
function ToolsIndex() {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);

  const tools = [
    {
      name: 'Tax Bracket Calculator',
      description: 'See your federal and state tax brackets, effective rate, and marginal rate.',
      path: '/tools/tax-bracket-calculator',
      icon: '📊',
    },
    {
      name: 'Advisor Fee Calculator',
      description: 'See the true cost of financial advisor fees over 10, 20, or 30 years.',
      path: '/tools/advisor-fee-calculator',
      icon: '💸',
    },
    {
      name: 'Roth vs Traditional Calculator',
      description: 'Find out which IRA type will leave you with more money in retirement.',
      path: '/tools/roth-vs-traditional',
      icon: '⚖️',
    },
    {
      name: 'Emergency Fund Calculator',
      description: 'Calculate how much you need in your emergency fund based on your expenses.',
      path: '/tools/emergency-fund',
      icon: '🛡️',
    },
    {
      name: 'Net Worth Tracker',
      description: 'Track your assets, liabilities, and total net worth in one place.',
      path: '/tools/net-worth',
      icon: '📈',
    },
    {
      name: '401(k) Contribution Optimizer',
      description: 'Find the optimal contribution to maximize your employer match.',
      path: '/tools/401k-optimizer',
      icon: '🎯',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(180deg, #121212 0%, #1E1E1E 100%)'
        : 'linear-gradient(180deg, #F9F6F0 0%, #F5F2ED 100%)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 32px',
        borderBottom: `1px solid ${colors.border}`,
        background: isDark ? '#121212' : '#FFFDFB',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Link href="/tools">
            <a style={{ color: colors.accent, fontSize: 24, fontWeight: 700, textDecoration: 'none' }}>
              Charge Wealth
            </a>
          </Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Link href="/dashboard">
              <a style={{
                background: colors.accent,
                color: '#4A3F2F',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
              }}>
                Get Started — $279
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '60px 32px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 48px)',
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: 16,
        }}>
          Free Financial Tools
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          color: colors.textSecondary,
          maxWidth: 600,
          margin: '0 auto',
          padding: '0 16px',
        }}>
          Make smarter money decisions with our free calculators. No login required.
        </p>
      </section>

      {/* Tools Grid */}
      <section style={{
        padding: '0 32px 80px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {tools.map((tool) => (
            <Link key={tool.path} href={tool.path}>
              <a style={{
                display: 'block',
                background: colors.card,
                borderRadius: 16,
                padding: 32,
                textDecoration: 'none',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.2s',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)';
              }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>{tool.icon}</div>
                <h2 style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}>
                  {tool.name}
                </h2>
                <p style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 1.5,
                }}>
                  {tool.description}
                </p>
                <div style={{
                  marginTop: 16,
                  color: isDark ? colors.accent : '#8B6914',
                  fontWeight: 600,
                  fontSize: 14,
                }}>
                  Try it free →
                </div>
              </a>
            </Link>
          ))}
        </div>
      </section>

      {/* Premium Tools Section */}
      <section style={{
        padding: '60px 32px',
        background: isDark ? 'rgba(246,219,166,0.05)' : 'rgba(246,219,166,0.15)',
        borderTop: `1px solid ${colors.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: isDark ? 'rgba(246,219,166,0.15)' : 'rgba(246,219,166,0.4)',
            color: isDark ? colors.accent : '#8B6914',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            ⚡ PREMIUM
          </div>
          <h2 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 16,
          }}>
            Download CFO-Grade Spreadsheets
          </h2>
          <p style={{
            fontSize: 18,
            color: colors.textSecondary,
            maxWidth: 600,
            margin: '0 auto 32px',
            padding: '0 16px',
          }}>
            Professional Excel templates for cash flow projection, tax planning, debt payoff, and more.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            maxWidth: 800,
            margin: '0 auto 32px',
            textAlign: 'left',
          }}>
            {[
              { icon: '💰', name: 'Cash Flow Projection' },
              { icon: '📋', name: 'Tax Planning Worksheet' },
              { icon: '📈', name: 'Net Worth Tracker' },
              { icon: '🎯', name: 'Debt Payoff Calculator' },
              { icon: '🔍', name: 'Investment Fee Analyzer' },
            ].map((tool, idx) => (
              <div key={idx} style={{
                background: isDark ? '#1E1E1E' : '#FFFDFB',
                padding: '16px 20px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: `1px solid ${colors.border}`,
                boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <span style={{ fontSize: 24 }}>{tool.icon}</span>
                <span style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 500 }}>{tool.name}</span>
              </div>
            ))}
          </div>
          
          <Link href="/tools/premium">
            <a style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: colors.accent,
              color: '#4A3F2F',
              padding: '16px 32px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
            }}>
              View Premium Tools
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '60px 32px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: 16,
        }}>
          Want the complete picture?
        </h2>
        <p style={{
          fontSize: 18,
          color: colors.textSecondary,
          maxWidth: 600,
          margin: '0 auto 32px',
          padding: '0 16px',
        }}>
          Charge Wealth analyzes all your accounts, finds tax savings, and gives you AI-powered advice — all for a one-time $279.
        </p>
        <Link href="/dashboard">
          <a style={{
            display: 'inline-block',
            background: colors.accent,
            color: '#4A3F2F',
            padding: '16px 32px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 18,
            textDecoration: 'none',
          }}>
            Get Started — $279 Lifetime
          </a>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px',
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: 14,
      }}>
        © 2026 Charge Wealth. All rights reserved.
      </footer>
    </div>
  );
}

// Tool wrapper with header
function ToolWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(180deg, #121212 0%, #1E1E1E 100%)'
        : 'linear-gradient(180deg, #F9F6F0 0%, #F5F2ED 100%)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 32px',
        borderBottom: `1px solid ${colors.border}`,
        background: isDark ? '#121212' : '#FFFDFB',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/tools">
              <a style={{ color: colors.accent, fontSize: 20, fontWeight: 700, textDecoration: 'none' }}>
                Charge Wealth
              </a>
            </Link>
            <Link href="/tools">
              <a style={{ color: colors.textSecondary, fontSize: 14, textDecoration: 'none' }}>
                ← All Tools
              </a>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Link href="/dashboard">
              <a style={{
                background: colors.accent,
                color: '#4A3F2F',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
              }}>
                Get Full Access
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Tool Content */}
      <main style={{ padding: '40px 16px' }}>
        {children}
      </main>
    </div>
  );
}

// Main Tools Router
export function ToolsPage() {
  return (
    <Switch>
      <Route path="/tools" component={ToolsIndex} />
      <Route path="/tools/premium" component={PremiumToolsPage} />
      <Route path="/tools/tax-bracket-calculator">
        <ToolWrapper title="Tax Bracket Calculator">
          <TaxBracketCalculator />
        </ToolWrapper>
      </Route>
      <Route path="/tools/advisor-fee-calculator">
        <ToolWrapper title="Advisor Fee Calculator">
          <AdvisorFeeCalculator />
        </ToolWrapper>
      </Route>
      <Route path="/tools/roth-vs-traditional">
        <ToolWrapper title="Roth vs Traditional Calculator">
          <RothVsTraditionalCalculator />
        </ToolWrapper>
      </Route>
      <Route path="/tools/emergency-fund">
        <ToolWrapper title="Emergency Fund Calculator">
          <EmergencyFundCalculator />
        </ToolWrapper>
      </Route>
      <Route path="/tools/net-worth">
        <ToolWrapper title="Net Worth Tracker">
          <NetWorthTracker />
        </ToolWrapper>
      </Route>
      <Route path="/tools/401k-optimizer">
        <ToolWrapper title="401(k) Contribution Optimizer">
          <Contribution401kCalculator />
        </ToolWrapper>
      </Route>
    </Switch>
  );
}

export default ToolsPage;

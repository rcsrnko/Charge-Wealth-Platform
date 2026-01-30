import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';

interface PremiumTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  filename: string;
  features: string[];
  preview?: string;
}

const premiumTools: PremiumTool[] = [
  {
    id: 'cash-flow',
    name: 'Cash Flow Command Center',
    description: '12-month cash flow forecast to plan your financial future with confidence.',
    icon: '💰',
    filename: 'Cash-Flow-Command-Center.xlsx',
    features: [
      '12-month income vs expenses tracking',
      'Auto-calculating surplus/deficit',
      'Multiple income & expense categories',
      'Year-end totals and summaries',
      'Instructions sheet included'
    ]
  },
  {
    id: 'tax-planning',
    name: 'Tax Planning Command Center',
    description: 'Estimate quarterly taxes and track deductions like a CFO.',
    icon: '📋',
    filename: 'Tax-Planning-Command-Center.xlsx',
    features: [
      'Quarterly estimated tax calculator',
      'Comprehensive deduction tracker',
      'Federal & state tax estimation',
      'Self-employment tax calculations',
      'Payment schedule with due dates'
    ]
  },
  {
    id: 'net-worth',
    name: 'Net Worth Dashboard',
    description: 'Track your assets, liabilities, and net worth month-by-month.',
    icon: '📈',
    filename: 'Net-Worth-Dashboard.xlsx',
    features: [
      'Monthly asset tracking',
      'Liability monitoring',
      'Auto-calculated net worth',
      'Year-over-year change tracking',
      'Investment & retirement accounts'
    ]
  },
  {
    id: 'debt-payoff',
    name: 'Debt Destruction Planner',
    description: 'Compare avalanche vs snowball methods and create your payoff plan.',
    icon: '🎯',
    filename: 'Debt-Destruction-Planner.xlsx',
    features: [
      'Avalanche vs snowball comparison',
      'Automatic priority ranking',
      'Interest cost calculations',
      'Extra payment scenarios',
      'Sample payoff schedule'
    ]
  },
  {
    id: 'fee-analyzer',
    name: 'Investment Fee Analyzer',
    description: 'See the shocking true cost of fees over 10, 20, and 30 years.',
    icon: '🔍',
    filename: 'Investment-Fee-Analyzer.xlsx',
    features: [
      'Compare multiple fee scenarios',
      '10/20/30 year projections',
      'Hidden cost visualization',
      'Advisor fee vs DIY comparison',
      'Chart data for visualization'
    ]
  }
];

// Theme hook for dark/light mode - defaults to light (vanilla bean)
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tools-theme');
      if (saved) return saved === 'dark';
      // Default to light mode (vanilla bean) instead of system preference
      return false;
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
    accentText: '#F6DBA6',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.15)',
    card: '#1E1E1E',
    accentBg: 'rgba(246,219,166,0.1)',
  } : {
    bg: '#F9F6F0',
    bgSecondary: '#F5F2ED',
    bgTertiary: '#EFEBE5',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#F6DBA6',
    accentHover: '#E8C88A',
    accentText: '#8B6914',
    border: 'rgba(0,0,0,0.08)',
    borderHover: 'rgba(0,0,0,0.12)',
    card: '#FFFDFB',
    accentBg: 'rgba(246,219,166,0.3)',
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

// Check if user has premium access via blog subscription
function usePremiumAccess(): { hasPremium: boolean; loading: boolean } {
  const [hasPremium, setHasPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/blog/subscription-status', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setHasPremium(data.hasAccess || false);
        }
      } catch (error) {
        console.error('Failed to check premium access:', error);
        setHasPremium(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);
  
  return { hasPremium, loading };
}

function ToolCard({ tool, hasPremium, colors, isDark }: { tool: PremiumTool; hasPremium: boolean; colors: ReturnType<typeof getColors>; isDark: boolean }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!hasPremium) return;
    
    setDownloading(true);
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = `/downloads/${tool.filename}`;
      link.download = tool.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      background: colors.card,
      borderRadius: 16,
      padding: 32,
      border: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{tool.icon}</div>
      
      <h3 style={{
        fontSize: 22,
        fontWeight: 600,
        color: colors.textPrimary,
        marginBottom: 8,
      }}>
        {tool.name}
      </h3>
      
      <p style={{
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 1.6,
        marginBottom: 20,
      }}>
        {tool.description}
      </p>

      <div style={{
        background: colors.accentBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        flex: 1,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: colors.accentText,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          What's Included
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: 20,
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 1.8,
        }}>
          {tool.features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </div>

      {hasPremium ? (
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            background: colors.accent,
            color: '#4A3F2F',
            border: 'none',
            padding: '14px 24px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            cursor: downloading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            opacity: downloading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!downloading) {
              e.currentTarget.style.background = colors.accentHover;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.accent;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {downloading ? 'Downloading...' : 'Download Excel'}
        </button>
      ) : (
        <Link href="/dashboard">
          <a style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'transparent',
            color: colors.accentText,
            border: `2px solid ${colors.accent}`,
            padding: '12px 24px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            Unlock with Premium
          </a>
        </Link>
      )}
    </div>
  );
}

export function PremiumToolsPage() {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);
  const { hasPremium, loading } = usePremiumAccess();

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
        padding: '20px 32px',
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        background: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 253, 251, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/">
              <a style={{
                color: colors.accent,
                fontSize: 22,
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.02em'
              }}>
                Charge Wealth
              </a>
            </Link>
            <Link href="/tools">
              <a style={{
                color: colors.textSecondary,
                fontSize: 14,
                textDecoration: 'none'
              }}>
                ← Free Tools
              </a>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            {hasPremium && (
              <span style={{
                background: colors.accentBg,
                color: colors.accentText,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}>
                ⚡ Premium Member
              </span>
            )}
            <Link href={hasPremium ? "/dashboard" : "/take-charge/subscribe"}>
              <a style={{
                background: hasPremium ? 'transparent' : colors.accent,
                color: hasPremium ? colors.accentText : '#4A3F2F',
                border: hasPremium ? `1px solid ${colors.accent}` : 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
              }}>
                {hasPremium ? 'Dashboard' : 'Subscribe $9/mo'}
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '60px 32px 40px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: colors.accentBg,
          color: colors.accentText,
          padding: '8px 16px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 20,
        }}>
          ⚡ PREMIUM CFO TOOLS
        </div>
        
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 48px)',
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: 16,
          lineHeight: 1.2,
        }}>
          Professional Spreadsheets
          <br />
          <span style={{ color: colors.accentText }}>for Your Finances</span>
        </h1>
        
        <p style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          color: colors.textSecondary,
          maxWidth: 650,
          margin: '0 auto',
          lineHeight: 1.6,
          padding: '0 16px',
        }}>
          Download CFO-grade Excel templates used by financial professionals.
          Fully customizable, offline-ready, and built for high earners.
        </p>
        
        {/* Paywall Banner for non-subscribers */}
        {!hasPremium && !loading && (
          <div style={{
            marginTop: 32,
            padding: '24px 32px',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(246,219,166,0.15) 0%, rgba(246,219,166,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(246,219,166,0.4) 0%, rgba(246,219,166,0.2) 100%)',
            borderRadius: 16,
            border: `2px solid ${colors.accent}`,
            maxWidth: 600,
            margin: '32px auto 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                Premium Content
              </span>
            </div>
            <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 15 }}>
              Unlock all 5 CFO-grade spreadsheets + Take Charge Newsletter for just $9/month
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/take-charge/subscribe">
                <a style={{
                  display: 'inline-block',
                  background: colors.accent,
                  color: '#4A3F2F',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 15,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  Subscribe — $9/mo
                </a>
              </Link>
              <Link href="/take-charge/subscribe">
                <a style={{
                  display: 'inline-block',
                  background: 'transparent',
                  color: colors.accentText,
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: 15,
                  border: `1px solid ${colors.accent}`,
                }}>
                  $87/year (save 20%)
                </a>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Tools Grid */}
      <section style={{
        padding: '20px 32px 80px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {premiumTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} hasPremium={hasPremium} colors={colors} isDark={isDark} />
          ))}
        </div>
      </section>

      {/* Why Premium Tools */}
      <section style={{
        padding: '60px 32px',
        background: isDark ? 'rgba(246,219,166,0.03)' : 'rgba(246,219,166,0.1)',
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 40,
          }}>
            Why Use These Spreadsheets?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            textAlign: 'left',
          }}>
            {[
              {
                icon: '🔒',
                title: 'Your Data Stays Private',
                desc: 'No cloud sync, no third-party access. Your financial data stays on your computer.'
              },
              {
                icon: '⚡',
                title: 'Works Offline',
                desc: 'No internet required. Work on your finances anywhere, anytime.'
              },
              {
                icon: '🎨',
                title: 'Fully Customizable',
                desc: 'Add your own categories, formulas, and formatting. Make it yours.'
              },
              {
                icon: '📊',
                title: 'Professional Grade',
                desc: 'Built with the same rigor as tools used by CFOs and financial advisors.'
              },
              {
                icon: '🔄',
                title: 'Always Yours',
                desc: 'Download once, use forever. No subscription required for updates.'
              },
              {
                icon: '📱',
                title: 'Excel & Google Sheets',
                desc: 'Compatible with Microsoft Excel, Google Sheets, and Numbers.'
              },
            ].map((benefit, idx) => (
              <div key={idx} style={{
                background: colors.card,
                padding: 24,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{benefit.icon}</div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!hasPremium && (
        <section style={{
          padding: '80px 32px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 16,
          }}>
            Unlock Premium Access
          </h2>
          <p style={{
            fontSize: 18,
            color: colors.textSecondary,
            maxWidth: 600,
            margin: '0 auto 32px',
            padding: '0 16px',
          }}>
            Get all premium CFO tools, the Take Charge Newsletter, and Discord community access.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/take-charge/subscribe">
              <a style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: colors.accent,
                color: '#4A3F2F',
                padding: '18px 36px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 18,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                Subscribe — $9/mo
              </a>
            </Link>
            <Link href="/take-charge/subscribe">
              <a style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                color: colors.accentText,
                padding: '18px 36px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 18,
                textDecoration: 'none',
                border: `2px solid ${colors.accent}`,
              }}>
                $87/year (save 20%)
              </a>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        padding: '32px',
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: 14,
        borderTop: `1px solid ${colors.border}`,
      }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/tools">
            <a style={{ color: colors.textSecondary, textDecoration: 'none', marginRight: 24 }}>Free Tools</a>
          </Link>
          <Link href="/dashboard">
            <a style={{ color: colors.textSecondary, textDecoration: 'none', marginRight: 24 }}>Dashboard</a>
          </Link>
          <Link href="/take-charge">
            <a style={{ color: colors.textSecondary, textDecoration: 'none' }}>Blog</a>
          </Link>
        </div>
        © 2026 Charge Wealth. All rights reserved.
      </footer>
    </div>
  );
}

export default PremiumToolsPage;

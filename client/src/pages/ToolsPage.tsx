import React from 'react';
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

// Tools index page
function ToolsIndex() {
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
      background: 'linear-gradient(180deg, #121212 0%, #1E1E1E 100%)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(201, 169, 98, 0.1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/tools">
            <a style={{ color: '#F6DBA6', fontSize: 24, fontWeight: 700, textDecoration: 'none' }}>
              Charge Wealth
            </a>
          </Link>
          <Link href="/dashboard">
            <a style={{
              background: '#F6DBA6',
              color: '#121212',
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
      </header>

      {/* Hero */}
      <section style={{
        padding: '60px 32px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#F4F5F7',
          marginBottom: 16,
        }}>
          Free Financial Tools
        </h1>
        <p style={{
          fontSize: 20,
          color: '#A8B0C5',
          maxWidth: 600,
          margin: '0 auto',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 24,
        }}>
          {tools.map((tool) => (
            <Link key={tool.path} href={tool.path}>
              <a style={{
                display: 'block',
                background: '#1E1E1E',
                borderRadius: 16,
                padding: 32,
                textDecoration: 'none',
                border: '1px solid rgba(201, 169, 98, 0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F6DBA6';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>{tool.icon}</div>
                <h2 style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#F4F5F7',
                  marginBottom: 8,
                }}>
                  {tool.name}
                </h2>
                <p style={{
                  fontSize: 16,
                  color: '#A8B0C5',
                  lineHeight: 1.5,
                }}>
                  {tool.description}
                </p>
                <div style={{
                  marginTop: 16,
                  color: '#F6DBA6',
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
        background: 'rgba(201, 169, 98, 0.05)',
        borderTop: '1px solid rgba(201, 169, 98, 0.1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(201, 169, 98, 0.15)',
            color: '#F6DBA6',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            ⚡ PREMIUM
          </div>
          <h2 style={{
            fontSize: 36,
            fontWeight: 700,
            color: '#F4F5F7',
            marginBottom: 16,
          }}>
            Download CFO-Grade Spreadsheets
          </h2>
          <p style={{
            fontSize: 18,
            color: '#A8B0C5',
            maxWidth: 600,
            margin: '0 auto 32px',
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
                background: '#1A1D28',
                padding: '16px 20px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid rgba(201, 169, 98, 0.1)',
              }}>
                <span style={{ fontSize: 24 }}>{tool.icon}</span>
                <span style={{ color: '#F4F5F7', fontSize: 14, fontWeight: 500 }}>{tool.name}</span>
              </div>
            ))}
          </div>
          
          <Link href="/tools/premium">
            <a style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#F6DBA6',
              color: '#121212',
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
          fontSize: 36,
          fontWeight: 700,
          color: '#F4F5F7',
          marginBottom: 16,
        }}>
          Want the complete picture?
        </h2>
        <p style={{
          fontSize: 18,
          color: '#A8B0C5',
          maxWidth: 600,
          margin: '0 auto 32px',
        }}>
          Charge Wealth analyzes all your accounts, finds tax savings, and gives you AI-powered advice — all for a one-time $279.
        </p>
        <Link href="/dashboard">
          <a style={{
            display: 'inline-block',
            background: '#F6DBA6',
            color: '#121212',
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
        color: '#6B7280',
        fontSize: 14,
      }}>
        © 2026 Charge Wealth. All rights reserved.
      </footer>
    </div>
  );
}

// Tool wrapper with header
function ToolWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #121212 0%, #1E1E1E 100%)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 32px',
        borderBottom: '1px solid rgba(201, 169, 98, 0.1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/tools">
              <a style={{ color: '#F6DBA6', fontSize: 20, fontWeight: 700, textDecoration: 'none' }}>
                Charge Wealth
              </a>
            </Link>
            <Link href="/tools">
              <a style={{ color: '#A8B0C5', fontSize: 14, textDecoration: 'none' }}>
                ← All Tools
              </a>
            </Link>
          </div>
          <Link href="/dashboard">
            <a style={{
              background: '#F6DBA6',
              color: '#121212',
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

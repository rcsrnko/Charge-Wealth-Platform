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
      background: 'linear-gradient(180deg, #0F1117 0%, #1A1D28 100%)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(201, 169, 98, 0.1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/tools">
            <a style={{ color: '#C9A962', fontSize: 24, fontWeight: 700, textDecoration: 'none' }}>
              Charge Wealth
            </a>
          </Link>
          <Link href="/dashboard">
            <a style={{
              background: '#C9A962',
              color: '#0F1117',
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
                background: '#1A1D28',
                borderRadius: 16,
                padding: 32,
                textDecoration: 'none',
                border: '1px solid rgba(201, 169, 98, 0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C9A962';
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
                  color: '#C9A962',
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

      {/* CTA */}
      <section style={{
        padding: '60px 32px',
        background: 'rgba(201, 169, 98, 0.05)',
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
            background: '#C9A962',
            color: '#0F1117',
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
        © 2024 Charge Wealth. All rights reserved.
      </footer>
    </div>
  );
}

// Tool wrapper with header
function ToolWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F1117 0%, #1A1D28 100%)',
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
              <a style={{ color: '#C9A962', fontSize: 20, fontWeight: 700, textDecoration: 'none' }}>
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
              background: '#C9A962',
              color: '#0F1117',
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

import React, { useState, useMemo } from 'react';

// 2026 Federal Tax Brackets (Single)
const FEDERAL_BRACKETS_SINGLE = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

// 2026 Federal Tax Brackets (Married Filing Jointly)
const FEDERAL_BRACKETS_MARRIED = [
  { min: 0, max: 23850, rate: 0.10 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 },
];

// State tax rates (simplified - flat rates for simplicity)
const STATE_RATES: Record<string, number> = {
  'AL': 0.05, 'AK': 0, 'AZ': 0.025, 'AR': 0.047, 'CA': 0.0930,
  'CO': 0.044, 'CT': 0.0699, 'DE': 0.066, 'FL': 0, 'GA': 0.0549,
  'HI': 0.0825, 'ID': 0.058, 'IL': 0.0495, 'IN': 0.0315, 'IA': 0.057,
  'KS': 0.057, 'KY': 0.04, 'LA': 0.0425, 'ME': 0.0715, 'MD': 0.0575,
  'MA': 0.05, 'MI': 0.0425, 'MN': 0.0985, 'MS': 0.05, 'MO': 0.048,
  'MT': 0.059, 'NE': 0.0584, 'NV': 0, 'NH': 0, 'NJ': 0.1075,
  'NM': 0.059, 'NY': 0.0685, 'NC': 0.0475, 'ND': 0.0225, 'OH': 0.035,
  'OK': 0.0475, 'OR': 0.099, 'PA': 0.0307, 'RI': 0.0599, 'SC': 0.064,
  'SD': 0, 'TN': 0, 'TX': 0, 'UT': 0.0465, 'VT': 0.0875,
  'VA': 0.0575, 'WA': 0, 'WV': 0.055, 'WI': 0.0765, 'WY': 0,
};

const formatCurrency = (num: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

const formatPercent = (num: number) => `${(num * 100).toFixed(1)}%`;

export const TaxBracketCalculator: React.FC = () => {
  const [income, setIncome] = useState<string>('150000');
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('single');
  const [state, setState] = useState<string>('CO');
  const [email, setEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const calculations = useMemo(() => {
    const incomeNum = parseFloat(income.replace(/,/g, '')) || 0;
    const brackets = filingStatus === 'single' ? FEDERAL_BRACKETS_SINGLE : FEDERAL_BRACKETS_MARRIED;
    
    let federalTax = 0;
    let marginalRate = 0.10;
    let currentBracket = brackets[0];
    
    for (const bracket of brackets) {
      if (incomeNum > bracket.min) {
        const taxableInBracket = Math.min(incomeNum, bracket.max) - bracket.min;
        federalTax += taxableInBracket * bracket.rate;
        marginalRate = bracket.rate;
        currentBracket = bracket;
      }
    }
    
    const stateRate = STATE_RATES[state] || 0;
    const stateTax = incomeNum * stateRate;
    const totalTax = federalTax + stateTax;
    const effectiveRate = incomeNum > 0 ? totalTax / incomeNum : 0;
    const takeHome = incomeNum - totalTax;
    
    return {
      income: incomeNum,
      federalTax,
      stateTax,
      totalTax,
      effectiveRate,
      marginalRate,
      takeHome,
      currentBracket,
      monthlyTakeHome: takeHome / 12,
    };
  }, [income, filingStatus, state]);

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: 32,
      fontFamily: 'Inter, -apple-system, sans-serif',
      background: '#121212',
      borderRadius: 16,
      color: '#F4F5F7',
    }}>
      <h1 style={{ color: '#F6DBA6', marginBottom: 8, fontSize: 32 }}>
        Tax Bracket Calculator
      </h1>
      <p style={{ color: '#A8B0C5', marginBottom: 32 }}>
        See exactly how much you'll owe in federal and state taxes for 2026.
      </p>
      
      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Annual Income
          </label>
          <input
            type="text"
            value={income}
            onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ''))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1E1E1E',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
            placeholder="150,000"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Filing Status
          </label>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as 'single' | 'married')}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1E1E1E',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          >
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1E1E1E',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          >
            {Object.keys(STATE_RATES).sort().map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Results */}
      <div style={{
        background: '#1E1E1E',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
          <div>
            <div style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 4 }}>Federal Tax</div>
            <div style={{ color: '#EF4444', fontSize: 28, fontWeight: 700 }}>
              {formatCurrency(calculations.federalTax)}
            </div>
          </div>
          <div>
            <div style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 4 }}>State Tax ({state})</div>
            <div style={{ color: '#EF4444', fontSize: 28, fontWeight: 700 }}>
              {formatCurrency(calculations.stateTax)}
            </div>
          </div>
          <div>
            <div style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 4 }}>Total Tax</div>
            <div style={{ color: '#EF4444', fontSize: 28, fontWeight: 700 }}>
              {formatCurrency(calculations.totalTax)}
            </div>
          </div>
          <div>
            <div style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 4 }}>Take Home</div>
            <div style={{ color: '#10B981', fontSize: 28, fontWeight: 700 }}>
              {formatCurrency(calculations.takeHome)}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(201, 169, 98, 0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ color: '#A8B0C5', fontSize: 12 }}>Effective Tax Rate</div>
              <div style={{ color: '#F6DBA6', fontSize: 20, fontWeight: 600 }}>
                {formatPercent(calculations.effectiveRate)}
              </div>
            </div>
            <div>
              <div style={{ color: '#A8B0C5', fontSize: 12 }}>Marginal Tax Rate</div>
              <div style={{ color: '#F6DBA6', fontSize: 20, fontWeight: 600 }}>
                {formatPercent(calculations.marginalRate)}
              </div>
            </div>
            <div>
              <div style={{ color: '#A8B0C5', fontSize: 12 }}>Monthly Take Home</div>
              <div style={{ color: '#10B981', fontSize: 20, fontWeight: 600 }}>
                {formatCurrency(calculations.monthlyTakeHome)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bracket Visualization */}
      <div style={{
        background: '#1E1E1E',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ color: '#F4F5F7', marginBottom: 16 }}>Your Tax Brackets</h3>
        {(filingStatus === 'single' ? FEDERAL_BRACKETS_SINGLE : FEDERAL_BRACKETS_MARRIED)
          .filter(b => calculations.income > b.min)
          .map((bracket, i) => {
            const taxableInBracket = Math.min(calculations.income, bracket.max) - bracket.min;
            const taxInBracket = taxableInBracket * bracket.rate;
            const isCurrentBracket = bracket === calculations.currentBracket;
            
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginBottom: 8,
                background: isCurrentBracket ? 'rgba(201, 169, 98, 0.1)' : 'transparent',
                borderRadius: 8,
                border: isCurrentBracket ? '1px solid #F6DBA6' : '1px solid transparent',
              }}>
                <div>
                  <span style={{ color: '#F6DBA6', fontWeight: 600 }}>{formatPercent(bracket.rate)}</span>
                  <span style={{ color: '#A8B0C5', marginLeft: 12 }}>
                    {formatCurrency(bracket.min)} - {bracket.max === Infinity ? '∞' : formatCurrency(bracket.max)}
                  </span>
                </div>
                <div style={{ color: '#EF4444', fontWeight: 500 }}>
                  {formatCurrency(taxInBracket)}
                </div>
              </div>
            );
          })}
      </div>
      
      {/* CTA */}
      {!showEmailCapture ? (
        <button
          onClick={() => setShowEmailCapture(true)}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 18,
            fontWeight: 600,
            background: '#F6DBA6',
            color: '#121212',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Get Personalized Tax-Saving Strategies →
        </button>
      ) : (
        <div style={{
          background: 'rgba(201, 169, 98, 0.1)',
          border: '1px solid #F6DBA6',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: '#F4F5F7', marginBottom: 8 }}>
            You could save {formatCurrency(calculations.totalTax * 0.15)} or more
          </h3>
          <p style={{ color: '#A8B0C5', marginBottom: 16, fontSize: 14 }}>
            Enter your email to get a personalized tax optimization report.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: 16,
                background: '#1E1E1E',
                border: '1px solid rgba(201, 169, 98, 0.2)',
                borderRadius: 8,
                color: '#F4F5F7',
              }}
            />
            <button
              style={{
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                background: '#F6DBA6',
                color: '#121212',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Send Report
            </button>
          </div>
        </div>
      )}
      
      <p style={{ color: '#6B7280', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        Powered by <a href="https://chargewealth.co" style={{ color: '#F6DBA6' }}>Charge Wealth</a> • 
        This calculator is for informational purposes only and does not constitute tax advice.
      </p>
    </div>
  );
};

export default TaxBracketCalculator;

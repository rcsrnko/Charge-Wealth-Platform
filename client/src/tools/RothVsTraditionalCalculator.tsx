import React, { useState, useMemo } from 'react';
import { EXPECTED_MARKET_RETURN, EXPECTED_MARKET_RETURN_PERCENT } from '../constants/rates';

const formatCurrency = (num: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

const TAX_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

const getMarginalRate = (income: number) => {
  for (const bracket of TAX_BRACKETS) {
    if (income <= bracket.max) return bracket.rate;
  }
  return 0.37;
};

export const RothVsTraditionalCalculator: React.FC = () => {
  const [currentIncome, setCurrentIncome] = useState<string>('150000');
  const [contribution, setContribution] = useState<string>('7000');
  const [retirementIncome, setRetirementIncome] = useState<string>('80000');
  const [yearsToRetirement, setYearsToRetirement] = useState<number>(25);
  const [expectedReturn, setExpectedReturn] = useState<string>(String(EXPECTED_MARKET_RETURN_PERCENT));
  const [email, setEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const calculations = useMemo(() => {
    const currentIncomeNum = parseFloat(currentIncome.replace(/,/g, '')) || 0;
    const contributionNum = parseFloat(contribution.replace(/,/g, '')) || 0;
    const retirementIncomeNum = parseFloat(retirementIncome.replace(/,/g, '')) || 0;
    const returnRate = parseFloat(expectedReturn) / 100 || EXPECTED_MARKET_RETURN;
    
    const currentTaxRate = getMarginalRate(currentIncomeNum);
    const retirementTaxRate = getMarginalRate(retirementIncomeNum);
    
    // Traditional IRA: Contribute pre-tax, pay tax on withdrawal
    const traditionalContribution = contributionNum; // Pre-tax
    const traditionalTaxSavingsNow = contributionNum * currentTaxRate;
    const traditionalFutureValue = traditionalContribution * Math.pow(1 + returnRate, yearsToRetirement);
    const traditionalAfterTax = traditionalFutureValue * (1 - retirementTaxRate);
    
    // Roth IRA: Contribute post-tax, no tax on withdrawal
    const rothContribution = contributionNum * (1 - currentTaxRate); // After-tax equivalent
    const rothFutureValue = contributionNum * Math.pow(1 + returnRate, yearsToRetirement);
    const rothAfterTax = rothFutureValue; // No tax on withdrawal
    
    // For apples-to-apples: If you contribute $7K to Roth, you need to invest the tax savings from Traditional
    const taxSavingsInvested = traditionalTaxSavingsNow * Math.pow(1 + returnRate, yearsToRetirement);
    const traditionalTotalAfterTax = traditionalAfterTax + (taxSavingsInvested * (1 - 0.15)); // Assume 15% cap gains on taxable
    
    const rothWins = rothAfterTax > traditionalTotalAfterTax;
    const difference = Math.abs(rothAfterTax - traditionalTotalAfterTax);
    
    return {
      currentTaxRate,
      retirementTaxRate,
      traditionalContribution,
      traditionalTaxSavingsNow,
      traditionalFutureValue,
      traditionalAfterTax,
      traditionalTotalAfterTax,
      rothContribution,
      rothFutureValue,
      rothAfterTax,
      rothWins,
      difference,
      recommendation: rothWins ? 'Roth' : 'Traditional',
    };
  }, [currentIncome, contribution, retirementIncome, yearsToRetirement, expectedReturn]);

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: 32,
      fontFamily: 'Inter, -apple-system, sans-serif',
      background: 'var(--bg-elevated)',
      borderRadius: 16,
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <h1 style={{ color: 'var(--brand-accent)', marginBottom: 8, fontSize: 32 }}>
        Roth vs. Traditional IRA Calculator
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Find out which IRA type will leave you with more money in retirement.
      </p>
      
      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            Current Annual Income
          </label>
          <input
            type="text"
            value={currentIncome}
            onChange={(e) => setCurrentIncome(e.target.value.replace(/[^0-9]/g, ''))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            Annual IRA Contribution
          </label>
          <input
            type="text"
            value={contribution}
            onChange={(e) => setContribution(e.target.value.replace(/[^0-9]/g, ''))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          />
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            2026 limit: $7,000 ($8,000 if 50+)
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            Expected Retirement Income
          </label>
          <input
            type="text"
            value={retirementIncome}
            onChange={(e) => setRetirementIncome(e.target.value.replace(/[^0-9]/g, ''))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            Years to Retirement
          </label>
          <input
            type="number"
            value={yearsToRetirement}
            onChange={(e) => setYearsToRetirement(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>
      
      {/* Recommendation */}
      <div style={{
        background: calculations.rothWins 
          ? 'rgba(147, 51, 234, 0.1)'
          : 'rgba(59, 130, 246, 0.1)',
        border: `2px solid ${calculations.rothWins ? 'rgba(147, 51, 234, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
        borderRadius: 16,
        padding: 32,
        marginBottom: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {calculations.rothWins ? '🟣' : '🔵'}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 8 }}>
          Based on your inputs, you should use:
        </div>
        <div style={{ 
          color: calculations.rothWins ? '#A855F7' : '#3B82F6', 
          fontSize: 48, 
          fontWeight: 700, 
          marginBottom: 8 
        }}>
          {calculations.recommendation} IRA
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
          You'll have {formatCurrency(calculations.difference)} more at retirement
        </div>
      </div>
      
      {/* Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 24,
        marginBottom: 24,
      }}>
        <div style={{
          background: calculations.rothWins ? 'rgba(147, 51, 234, 0.1)' : 'var(--bg-secondary)',
          border: `1px solid ${calculations.rothWins ? '#A855F7' : 'var(--border)'}`,
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: '#A855F7', marginBottom: 16 }}>Roth IRA</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>You pay taxes now at</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 600 }}>
              {(calculations.currentTaxRate * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Future value</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.rothFutureValue)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>After-tax at retirement</div>
            <div style={{ color: 'var(--success)', fontSize: 28, fontWeight: 700 }}>
              {formatCurrency(calculations.rothAfterTax)}
            </div>
          </div>
        </div>
        
        <div style={{
          background: !calculations.rothWins ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
          border: `1px solid ${!calculations.rothWins ? '#3B82F6' : 'var(--border)'}`,
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: '#3B82F6', marginBottom: 16 }}>Traditional IRA</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Tax savings now</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.traditionalTaxSavingsNow)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Future value (pre-tax)</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.traditionalFutureValue)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>After-tax at retirement</div>
            <div style={{ color: 'var(--success)', fontSize: 28, fontWeight: 700 }}>
              {formatCurrency(calculations.traditionalAfterTax)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Why */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Why {calculations.recommendation}?</h3>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {calculations.rothWins ? (
            <>
              <p style={{ marginBottom: 12 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Your current tax rate ({(calculations.currentTaxRate * 100).toFixed(0)}%) is lower than your expected retirement rate ({(calculations.retirementTaxRate * 100).toFixed(0)}%).</strong>
              </p>
              <p>
                Pay taxes now while you're in a lower bracket. Your money grows tax-free and you won't owe anything when you withdraw in retirement.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginBottom: 12 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Your current tax rate ({(calculations.currentTaxRate * 100).toFixed(0)}%) is higher than your expected retirement rate ({(calculations.retirementTaxRate * 100).toFixed(0)}%).</strong>
              </p>
              <p>
                Get the tax deduction now while you're in a higher bracket. You'll pay taxes in retirement when your income (and tax rate) is lower.
              </p>
            </>
          )}
        </div>
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
            background: 'var(--brand-accent)',
            color: 'var(--text-on-honey)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Get a Complete Retirement Analysis →
        </button>
      ) : (
        <div style={{
          background: 'var(--brand-accent-light)',
          border: '1px solid var(--brand-accent)',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
            Want the full picture?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
            Charge Wealth analyzes your 401k, IRA, HSA, and taxable accounts together to find the optimal strategy.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                flex: 1,
                minWidth: 200,
                padding: '12px 16px',
                fontSize: 16,
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
              }}
            />
            <button
              style={{
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                background: 'var(--brand-accent)',
                color: 'var(--text-on-honey)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Get Analysis
            </button>
          </div>
        </div>
      )}
      
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        Powered by <a href="https://chargewealth.co" style={{ color: 'var(--brand-accent)' }}>Charge Wealth</a> • 
        This calculator is for informational purposes only. Consider consulting a tax professional.
      </p>
    </div>
  );
};

export default RothVsTraditionalCalculator;

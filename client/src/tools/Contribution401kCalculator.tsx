import React, { useState, useMemo } from 'react';

const formatCurrency = (num: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

const LIMITS_2026 = {
  employee: 23500,
  catchUp: 7500, // if 50+
  total: 70000, // employee + employer
};

export const Contribution401kCalculator: React.FC = () => {
  const [salary, setSalary] = useState<string>('150000');
  const [currentContribution, setCurrentContribution] = useState<string>('10');
  const [employerMatch, setEmployerMatch] = useState<string>('50');
  const [matchLimit, setMatchLimit] = useState<string>('6');
  const [age, setAge] = useState<number>(35);
  const [email, setEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const calculations = useMemo(() => {
    const salaryNum = parseFloat(salary.replace(/,/g, '')) || 0;
    const contributionPct = parseFloat(currentContribution) / 100 || 0;
    const matchPct = parseFloat(employerMatch) / 100 || 0;
    const matchLimitPct = parseFloat(matchLimit) / 100 || 0;
    const is50Plus = age >= 50;
    
    const maxEmployeeLimit = is50Plus ? LIMITS_2026.employee + LIMITS_2026.catchUp : LIMITS_2026.employee;
    
    // Current contribution
    const currentAnnual = salaryNum * contributionPct;
    const currentLimited = Math.min(currentAnnual, maxEmployeeLimit);
    
    // Employer match
    const matchableContribution = Math.min(salaryNum * matchLimitPct, currentLimited);
    const employerContribution = matchableContribution * matchPct;
    const totalCurrent = currentLimited + employerContribution;
    
    // Optimal contribution (to get full match)
    const optimalPct = matchLimitPct;
    const optimalAnnual = salaryNum * optimalPct;
    const optimalLimited = Math.min(optimalAnnual, maxEmployeeLimit);
    const optimalEmployerMatch = Math.min(salaryNum * matchLimitPct, optimalLimited) * matchPct;
    const totalOptimal = optimalLimited + optimalEmployerMatch;
    
    // Max contribution
    const maxAnnual = maxEmployeeLimit;
    const maxEmployerMatch = Math.min(salaryNum * matchLimitPct, maxAnnual) * matchPct;
    const totalMax = maxAnnual + maxEmployerMatch;
    
    // Free money left on table
    const freeMoneyLost = optimalEmployerMatch - employerContribution;
    
    // 30 year projection at 7% return
    const project30Years = (annual: number) => {
      let total = 0;
      for (let i = 0; i < 30; i++) {
        total = (total + annual) * 1.07;
      }
      return total;
    };
    
    const currentProjection = project30Years(totalCurrent);
    const optimalProjection = project30Years(totalOptimal);
    const maxProjection = project30Years(totalMax);
    
    // Tax savings
    const marginalRate = salaryNum > 100525 ? 0.24 : salaryNum > 47150 ? 0.22 : 0.12;
    const taxSavingsCurrent = currentLimited * marginalRate;
    const taxSavingsMax = maxAnnual * marginalRate;
    
    return {
      currentAnnual: currentLimited,
      currentTotal: totalCurrent,
      employerContribution,
      optimalPct: optimalPct * 100,
      optimalAnnual: optimalLimited,
      optimalTotal: totalOptimal,
      freeMoneyLost,
      maxAnnual,
      maxTotal: totalMax,
      currentProjection,
      optimalProjection,
      maxProjection,
      taxSavingsCurrent,
      taxSavingsMax,
      maxEmployeeLimit,
      is50Plus,
      marginalRate,
    };
  }, [salary, currentContribution, employerMatch, matchLimit, age]);

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: 32,
      fontFamily: 'Inter, -apple-system, sans-serif',
      background: '#0F1117',
      borderRadius: 16,
      color: '#F4F5F7',
    }}>
      <h1 style={{ color: '#C9A962', marginBottom: 8, fontSize: 32 }}>
        401(k) Contribution Optimizer
      </h1>
      <p style={{ color: '#A8B0C5', marginBottom: 32 }}>
        Find the optimal contribution to maximize your employer match and tax savings.
      </p>
      
      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Annual Salary
          </label>
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1A1D28',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Your Contribution (%)
          </label>
          <input
            type="text"
            value={currentContribution}
            onChange={(e) => setCurrentContribution(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1A1D28',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Employer Match (%)
          </label>
          <input
            type="text"
            value={employerMatch}
            onChange={(e) => setEmployerMatch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1A1D28',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
          <div style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
            e.g., 50% = employer adds $0.50 per $1 you contribute
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Match Limit (% of salary)
          </label>
          <input
            type="text"
            value={matchLimit}
            onChange={(e) => setMatchLimit(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1A1D28',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
          <div style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
            e.g., 6% = employer matches up to 6% of your salary
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Your Age
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1A1D28',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
          {calculations.is50Plus && (
            <div style={{ color: '#10B981', fontSize: 11, marginTop: 4 }}>
              ✓ Catch-up contributions available!
            </div>
          )}
        </div>
      </div>
      
      {/* Free Money Alert */}
      {calculations.freeMoneyLost > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💸</div>
          <div style={{ color: '#EF4444', fontSize: 32, fontWeight: 700 }}>
            You're leaving {formatCurrency(calculations.freeMoneyLost)}/year on the table!
          </div>
          <div style={{ color: '#A8B0C5', marginTop: 8 }}>
            Increase your contribution to {calculations.optimalPct.toFixed(0)}% to get the full employer match.
          </div>
        </div>
      )}
      
      {/* Comparison Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{
          background: '#1A1D28',
          borderRadius: 12,
          padding: 20,
          border: '1px solid rgba(201, 169, 98, 0.2)',
        }}>
          <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 8 }}>Current</div>
          <div style={{ color: '#F4F5F7', fontSize: 24, fontWeight: 700 }}>
            {formatCurrency(calculations.currentTotal)}
          </div>
          <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
            You: {formatCurrency(calculations.currentAnnual)}
          </div>
          <div style={{ color: '#6B7280', fontSize: 12 }}>
            Employer: {formatCurrency(calculations.employerContribution)}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(201, 169, 98, 0.1)',
          borderRadius: 12,
          padding: 20,
          border: '2px solid #C9A962',
        }}>
          <div style={{ color: '#C9A962', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
            ✓ OPTIMAL
          </div>
          <div style={{ color: '#C9A962', fontSize: 24, fontWeight: 700 }}>
            {formatCurrency(calculations.optimalTotal)}
          </div>
          <div style={{ color: '#A8B0C5', fontSize: 12, marginTop: 4 }}>
            Contribute {calculations.optimalPct.toFixed(0)}% to get full match
          </div>
        </div>
        
        <div style={{
          background: '#1A1D28',
          borderRadius: 12,
          padding: 20,
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{ color: '#10B981', fontSize: 12, marginBottom: 8 }}>Maximum</div>
          <div style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>
            {formatCurrency(calculations.maxTotal)}
          </div>
          <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
            You: {formatCurrency(calculations.maxAnnual)} (IRS limit)
          </div>
        </div>
      </div>
      
      {/* 30 Year Projection */}
      <div style={{
        background: '#1A1D28',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ color: '#F4F5F7', marginBottom: 16 }}>30-Year Projection (7% return)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 8 }}>At Current Rate</div>
            <div style={{ color: '#F4F5F7', fontSize: 24, fontWeight: 700 }}>
              {formatCurrency(calculations.currentProjection)}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(201, 169, 98, 0.1)', borderRadius: 8 }}>
            <div style={{ color: '#C9A962', fontSize: 12, marginBottom: 8 }}>At Optimal Rate</div>
            <div style={{ color: '#C9A962', fontSize: 24, fontWeight: 700 }}>
              {formatCurrency(calculations.optimalProjection)}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
            <div style={{ color: '#10B981', fontSize: 12, marginBottom: 8 }}>At Max Rate</div>
            <div style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>
              {formatCurrency(calculations.maxProjection)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tax Savings */}
      <div style={{
        background: '#1A1D28',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ color: '#F4F5F7', marginBottom: 16 }}>Annual Tax Savings</h3>
        <p style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 16 }}>
          At your income level, you're in the {(calculations.marginalRate * 100).toFixed(0)}% tax bracket. Every dollar you contribute saves you ${(calculations.marginalRate * 100).toFixed(0)}¢ in taxes.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 4 }}>Current Tax Savings</div>
            <div style={{ color: '#10B981', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.taxSavingsCurrent)}
            </div>
          </div>
          <div style={{ padding: 16, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 4 }}>Max Contribution Tax Savings</div>
            <div style={{ color: '#10B981', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.taxSavingsMax)}
            </div>
          </div>
        </div>
      </div>
      
      {/* 2024 Limits */}
      <div style={{
        background: '#1A1D28',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ color: '#F4F5F7', marginBottom: 16 }}>2026 Contribution Limits</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div style={{ padding: 12, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12 }}>Employee Limit</div>
            <div style={{ color: '#F4F5F7', fontSize: 18, fontWeight: 600 }}>{formatCurrency(LIMITS_2026.employee)}</div>
          </div>
          <div style={{ padding: 12, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12 }}>Catch-Up (50+)</div>
            <div style={{ color: '#F4F5F7', fontSize: 18, fontWeight: 600 }}>+{formatCurrency(LIMITS_2026.catchUp)}</div>
          </div>
          <div style={{ padding: 12, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12 }}>Total Max (w/ employer)</div>
            <div style={{ color: '#F4F5F7', fontSize: 18, fontWeight: 600 }}>{formatCurrency(LIMITS_2026.total)}</div>
          </div>
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
            background: '#C9A962',
            color: '#0F1117',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Get a Complete Retirement Optimization Plan →
        </button>
      ) : (
        <div style={{
          background: 'rgba(201, 169, 98, 0.1)',
          border: '1px solid #C9A962',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: '#F4F5F7', marginBottom: 8 }}>
            Want the full picture?
          </h3>
          <p style={{ color: '#A8B0C5', marginBottom: 16, fontSize: 14 }}>
            Charge Wealth optimizes your 401k, IRA, HSA, and taxable accounts together to maximize your retirement.
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
                background: '#1A1D28',
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
                background: '#C9A962',
                color: '#0F1117',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Get Plan
            </button>
          </div>
        </div>
      )}
      
      <p style={{ color: '#6B7280', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        Powered by <a href="https://chargewealth.co" style={{ color: '#C9A962' }}>Charge Wealth</a>
      </p>
    </div>
  );
};

export default Contribution401kCalculator;

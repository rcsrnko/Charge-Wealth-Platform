import React, { useState, useMemo } from 'react';
import { HYSA_APY, HYSA_PROVIDERS } from '../constants/rates';

const formatCurrency = (num: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

export const EmergencyFundCalculator: React.FC = () => {
  const [housing, setHousing] = useState<string>('2000');
  const [utilities, setUtilities] = useState<string>('300');
  const [food, setFood] = useState<string>('600');
  const [transportation, setTransportation] = useState<string>('500');
  const [insurance, setInsurance] = useState<string>('400');
  const [debt, setDebt] = useState<string>('500');
  const [other, setOther] = useState<string>('300');
  const [currentSavings, setCurrentSavings] = useState<string>('5000');
  const [jobStability, setJobStability] = useState<'stable' | 'moderate' | 'unstable'>('moderate');
  const [email, setEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const calculations = useMemo(() => {
    const expenses = {
      housing: parseFloat(housing.replace(/,/g, '')) || 0,
      utilities: parseFloat(utilities.replace(/,/g, '')) || 0,
      food: parseFloat(food.replace(/,/g, '')) || 0,
      transportation: parseFloat(transportation.replace(/,/g, '')) || 0,
      insurance: parseFloat(insurance.replace(/,/g, '')) || 0,
      debt: parseFloat(debt.replace(/,/g, '')) || 0,
      other: parseFloat(other.replace(/,/g, '')) || 0,
    };
    
    const monthlyExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const current = parseFloat(currentSavings.replace(/,/g, '')) || 0;
    
    // Recommended months based on job stability
    const recommendedMonths = {
      stable: 3,
      moderate: 6,
      unstable: 12,
    }[jobStability];
    
    const targets = {
      minimum: monthlyExpenses * 3,
      recommended: monthlyExpenses * recommendedMonths,
      comfortable: monthlyExpenses * 12,
    };
    
    const currentMonths = monthlyExpenses > 0 ? current / monthlyExpenses : 0;
    const gap = targets.recommended - current;
    const percentComplete = Math.min((current / targets.recommended) * 100, 100);
    
    // Monthly savings needed to reach goal in 1 year
    const monthlySavingsNeeded = gap > 0 ? gap / 12 : 0;
    
    // Annual interest earned at current HYSA APY
    const annualInterest = targets.recommended * HYSA_APY;
    
    return {
      monthlyExpenses,
      expenses,
      targets,
      current,
      currentMonths,
      gap,
      percentComplete,
      monthlySavingsNeeded,
      annualInterest,
      recommendedMonths,
    };
  }, [housing, utilities, food, transportation, insurance, debt, other, currentSavings, jobStability]);

  const getStatusColor = () => {
    if (calculations.currentMonths >= calculations.recommendedMonths) return 'var(--success)';
    if (calculations.currentMonths >= 3) return 'var(--warning)';
    return 'var(--error)';
  };

  const getStatusText = () => {
    if (calculations.currentMonths >= calculations.recommendedMonths) return 'On Track ✓';
    if (calculations.currentMonths >= 3) return 'Building';
    return 'Needs Attention';
  };

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
        Emergency Fund Calculator
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Find out exactly how much you need in your emergency fund and where to keep it.
      </p>
      
      {/* Monthly Expenses */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Monthly Essential Expenses</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {[
            { label: 'Housing/Rent', value: housing, setter: setHousing, icon: '🏠' },
            { label: 'Utilities', value: utilities, setter: setUtilities, icon: '💡' },
            { label: 'Food', value: food, setter: setFood, icon: '🍎' },
            { label: 'Transportation', value: transportation, setter: setTransportation, icon: '🚗' },
            { label: 'Insurance', value: insurance, setter: setInsurance, icon: '🛡️' },
            { label: 'Debt Payments', value: debt, setter: setDebt, icon: '💳' },
            { label: 'Other', value: other, setter: setOther, icon: '📦' },
          ].map(({ label, value, setter, icon }) => (
            <div key={label}>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
                {icon} {label}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 16,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                }}
                placeholder="0"
              />
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 16,
          padding: 16,
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total Monthly Expenses:</span>
          <span style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 20 }}>
            {formatCurrency(calculations.monthlyExpenses)}
          </span>
        </div>
      </div>
      
      {/* Current Savings & Stability */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            Current Emergency Savings
          </label>
          <input
            type="text"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(e.target.value.replace(/[^0-9]/g, ''))}
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
            Job Stability
          </label>
          <select
            value={jobStability}
            onChange={(e) => setJobStability(e.target.value as 'stable' | 'moderate' | 'unstable')}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          >
            <option value="stable">Stable (government, tenure)</option>
            <option value="moderate">Moderate (corporate job)</option>
            <option value="unstable">Variable (freelance, commission)</option>
          </select>
        </div>
      </div>
      
      {/* Progress */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Emergency Fund Status</span>
          <span style={{ 
            color: getStatusColor(), 
            fontWeight: 600,
            padding: '4px 12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 20,
            fontSize: 14,
          }}>
            {getStatusText()}
          </span>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: 24,
          background: 'var(--bg-tertiary)',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{
            height: '100%',
            width: `${calculations.percentComplete}%`,
            background: `linear-gradient(90deg, var(--brand-accent) 0%, var(--brand-accent-hover) 100%)`,
            borderRadius: 12,
            transition: 'width 0.3s ease',
          }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Current</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>
              {formatCurrency(calculations.current)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {calculations.currentMonths.toFixed(1)} months
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Target ({calculations.recommendedMonths} months)</div>
            <div style={{ color: 'var(--brand-accent)', fontSize: 24, fontWeight: 700 }}>
              {formatCurrency(calculations.targets.recommended)}
            </div>
          </div>
        </div>
        
        {calculations.gap > 0 && (
          <div style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--brand-accent-light)',
            borderRadius: 8,
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>
              To reach your goal in 12 months, save:
            </div>
            <div style={{ color: 'var(--brand-accent)', fontSize: 20, fontWeight: 600 }}>
              {formatCurrency(calculations.monthlySavingsNeeded)}/month
            </div>
          </div>
        )}
      </div>
      
      {/* Targets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[
          { label: 'Minimum (3 mo)', value: calculations.targets.minimum, color: 'var(--warning)' },
          { label: `Recommended (${calculations.recommendedMonths} mo)`, value: calculations.targets.recommended, color: 'var(--brand-accent)' },
          { label: 'Comfortable (12 mo)', value: calculations.targets.comfortable, color: 'var(--success)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-secondary)',
            padding: 16,
            borderRadius: 12,
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color, fontSize: 20, fontWeight: 700 }}>{formatCurrency(value)}</div>
          </div>
        ))}
      </div>
      
      {/* Where to Keep It */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Where to Keep Your Emergency Fund</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
          A High-Yield Savings Account (HYSA) gives you instant access while earning ~4-5% APY. 
          At your recommended target, you'd earn <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(calculations.annualInterest)}/year</span> in interest.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {HYSA_PROVIDERS.map(({ name, rate }) => (
            <div key={name} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
            }}>
              <span style={{ color: 'var(--text-primary)' }}>{name}</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{rate}% APY</span>
            </div>
          ))}
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
          Get a Complete Financial Health Check →
        </button>
      ) : (
        <div style={{
          background: 'var(--brand-accent-light)',
          border: '1px solid var(--brand-accent)',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
            Want to optimize your entire financial picture?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
            Charge Wealth looks at your emergency fund, investments, taxes, and more to find opportunities.
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
              Get Started
            </button>
          </div>
        </div>
      )}
      
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        Powered by <a href="https://chargewealth.co" style={{ color: 'var(--brand-accent)' }}>Charge Wealth</a>
      </p>
    </div>
  );
};

export default EmergencyFundCalculator;

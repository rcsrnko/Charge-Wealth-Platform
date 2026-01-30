import React, { useState, useMemo } from 'react';
import { EXPECTED_MARKET_RETURN, EXPECTED_MARKET_RETURN_PERCENT } from '../constants/rates';

const formatCurrency = (num: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

export const AdvisorFeeCalculator: React.FC = () => {
  const [portfolio, setPortfolio] = useState<string>('500000');
  const [feePercent, setFeePercent] = useState<string>('1.0');
  const [years, setYears] = useState<number>(30);
  const [expectedReturn, setExpectedReturn] = useState<string>(String(EXPECTED_MARKET_RETURN_PERCENT));
  const [email, setEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const calculations = useMemo(() => {
    const portfolioNum = parseFloat(portfolio.replace(/,/g, '')) || 0;
    const fee = parseFloat(feePercent) / 100 || 0.01;
    const returnRate = parseFloat(expectedReturn) / 100 || EXPECTED_MARKET_RETURN;
    
    // Calculate with and without fees
    let withAdvisor = portfolioNum;
    let withoutAdvisor = portfolioNum;
    let totalFeesPaid = 0;
    
    const yearlyData: { year: number; withAdvisor: number; withoutAdvisor: number; feesPaid: number }[] = [];
    
    for (let year = 1; year <= years; year++) {
      // Without advisor: full returns
      withoutAdvisor = withoutAdvisor * (1 + returnRate);
      
      // With advisor: returns minus fee
      const netReturn = returnRate - fee;
      withAdvisor = withAdvisor * (1 + netReturn);
      
      // Track fees (approximate as % of portfolio)
      totalFeesPaid += withAdvisor * fee;
      
      yearlyData.push({
        year,
        withAdvisor,
        withoutAdvisor,
        feesPaid: totalFeesPaid,
      });
    }
    
    const opportunityCost = withoutAdvisor - withAdvisor;
    const yearlyFee = portfolioNum * fee;
    
    return {
      withAdvisor,
      withoutAdvisor,
      totalFeesPaid,
      opportunityCost,
      yearlyFee,
      yearlyData,
      percentLost: opportunityCost / withoutAdvisor,
    };
  }, [portfolio, feePercent, years, expectedReturn]);

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
        Financial Advisor Fee Calculator
      </h1>
      <p style={{ color: '#A8B0C5', marginBottom: 32 }}>
        See the true cost of advisor fees on your wealth over time.
      </p>
      
      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Portfolio Size
          </label>
          <input
            type="text"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value.replace(/[^0-9]/g, ''))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1E1E1E',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Advisor Fee (%)
          </label>
          <input
            type="text"
            value={feePercent}
            onChange={(e) => setFeePercent(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1E1E1E',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Time Horizon (Years)
          </label>
          <select
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value))}
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
            <option value={10}>10 years</option>
            <option value={20}>20 years</option>
            <option value={30}>30 years</option>
            <option value={40}>40 years</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#A8B0C5', fontSize: 14 }}>
            Expected Return (%)
          </label>
          <input
            type="text"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 18,
              background: '#1E1E1E',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
        </div>
      </div>
      
      {/* Shocking Result */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        border: '2px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 16,
        padding: 32,
        marginBottom: 24,
        textAlign: 'center',
      }}>
        <div style={{ color: '#A8B0C5', fontSize: 18, marginBottom: 8 }}>
          Over {years} years, you'll lose:
        </div>
        <div style={{ color: '#EF4444', fontSize: 56, fontWeight: 700, marginBottom: 8 }}>
          {formatCurrency(calculations.opportunityCost)}
        </div>
        <div style={{ color: '#A8B0C5', fontSize: 16 }}>
          That's {(calculations.percentLost * 100).toFixed(0)}% of what you could have had.
        </div>
      </div>
      
      {/* Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        marginBottom: 24,
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <div style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 8 }}>With {feePercent}% Advisor</div>
          <div style={{ color: '#EF4444', fontSize: 32, fontWeight: 700 }}>
            {formatCurrency(calculations.withAdvisor)}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 8 }}>Self-Managed / Low Fee</div>
          <div style={{ color: '#10B981', fontSize: 32, fontWeight: 700 }}>
            {formatCurrency(calculations.withoutAdvisor)}
          </div>
        </div>
      </div>
      
      {/* Breakdown */}
      <div style={{
        background: '#1E1E1E',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ color: '#F4F5F7', marginBottom: 16 }}>The Math</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: '#121212', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 4 }}>Year 1 Fee</div>
            <div style={{ color: '#EF4444', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.yearlyFee)}
            </div>
          </div>
          <div style={{ padding: 16, background: '#121212', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 4 }}>Total Fees Paid</div>
            <div style={{ color: '#EF4444', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.totalFeesPaid)}
            </div>
          </div>
          <div style={{ padding: 16, background: '#121212', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 4 }}>Lost Investment Returns</div>
            <div style={{ color: '#EF4444', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.opportunityCost - calculations.totalFeesPaid)}
            </div>
          </div>
        </div>
        <p style={{ color: '#A8B0C5', fontSize: 14, marginTop: 16 }}>
          💡 The real cost isn't just the fees — it's the returns those fees would have earned if they stayed invested.
        </p>
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
          Get AI-Powered Advice for Just $279 (One-Time) →
        </button>
      ) : (
        <div style={{
          background: 'rgba(201, 169, 98, 0.1)',
          border: '1px solid #F6DBA6',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: '#F4F5F7', marginBottom: 8 }}>
            Save {formatCurrency(calculations.totalFeesPaid - 279)} vs. a traditional advisor
          </h3>
          <p style={{ color: '#A8B0C5', marginBottom: 16, fontSize: 14 }}>
            Charge Wealth gives you AI-powered financial guidance for a one-time $279 — not {feePercent}% of your wealth every year.
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
              Get Details
            </button>
          </div>
        </div>
      )}
      
      <p style={{ color: '#6B7280', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        Powered by <a href="https://chargewealth.co" style={{ color: '#F6DBA6' }}>Charge Wealth</a> • 
        Calculations assume annual compounding and constant fee percentage.
      </p>
    </div>
  );
};

export default AdvisorFeeCalculator;

import React, { useState, useMemo } from 'react';

const formatCurrency = (num: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

interface Asset {
  name: string;
  value: string;
  category: 'cash' | 'investments' | 'property' | 'other';
}

interface Liability {
  name: string;
  value: string;
  category: 'mortgage' | 'auto' | 'student' | 'credit' | 'other';
}

const defaultAssets: Asset[] = [
  { name: 'Checking Account', value: '5000', category: 'cash' },
  { name: 'Savings Account', value: '15000', category: 'cash' },
  { name: '401(k)', value: '85000', category: 'investments' },
  { name: 'Roth IRA', value: '25000', category: 'investments' },
  { name: 'Brokerage Account', value: '30000', category: 'investments' },
  { name: 'Home Value', value: '450000', category: 'property' },
  { name: 'Car Value', value: '25000', category: 'other' },
];

const defaultLiabilities: Liability[] = [
  { name: 'Mortgage', value: '320000', category: 'mortgage' },
  { name: 'Auto Loan', value: '15000', category: 'auto' },
  { name: 'Student Loans', value: '25000', category: 'student' },
  { name: 'Credit Cards', value: '3000', category: 'credit' },
];

const categoryColors = {
  cash: '#10B981',
  investments: '#3B82F6',
  property: '#8B5CF6',
  other: '#6B7280',
  mortgage: '#EF4444',
  auto: '#F59E0B',
  student: '#EC4899',
  credit: '#DC2626',
};

export const NetWorthTracker: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [liabilities, setLiabilities] = useState<Liability[]>(defaultLiabilities);
  const [email, setEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const updateAsset = (index: number, field: keyof Asset, value: string) => {
    const newAssets = [...assets];
    (newAssets[index] as any)[field] = value;
    setAssets(newAssets);
  };

  const updateLiability = (index: number, field: keyof Liability, value: string) => {
    const newLiabilities = [...liabilities];
    (newLiabilities[index] as any)[field] = value;
    setLiabilities(newLiabilities);
  };

  const addAsset = () => {
    setAssets([...assets, { name: '', value: '0', category: 'other' }]);
  };

  const addLiability = () => {
    setLiabilities([...liabilities, { name: '', value: '0', category: 'other' }]);
  };

  const calculations = useMemo(() => {
    const assetsByCategory = assets.reduce((acc, asset) => {
      const value = parseFloat(asset.value.replace(/,/g, '')) || 0;
      acc[asset.category] = (acc[asset.category] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const liabilitiesByCategory = liabilities.reduce((acc, liability) => {
      const value = parseFloat(liability.value.replace(/,/g, '')) || 0;
      acc[liability.category] = (acc[liability.category] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const totalAssets = Object.values(assetsByCategory).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(liabilitiesByCategory).reduce((a, b) => a + b, 0);
    const netWorth = totalAssets - totalLiabilities;
    
    const liquidAssets = (assetsByCategory.cash || 0) + (assetsByCategory.investments || 0);
    const illiquidAssets = (assetsByCategory.property || 0) + (assetsByCategory.other || 0);

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetsByCategory,
      liabilitiesByCategory,
      liquidAssets,
      illiquidAssets,
      debtToAssetRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
    };
  }, [assets, liabilities]);

  return (
    <div style={{
      maxWidth: 900,
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
        Net Worth Tracker
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        See your complete financial picture in one place.
      </p>
      
      {/* Net Worth Display */}
      <div style={{
        background: calculations.netWorth >= 0 
          ? 'var(--success-light)'
          : 'var(--error-light)',
        border: `2px solid ${calculations.netWorth >= 0 ? 'var(--success)' : 'var(--error)'}`,
        borderRadius: 16,
        padding: 32,
        marginBottom: 32,
        textAlign: 'center',
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 8 }}>
          Your Net Worth
        </div>
        <div style={{ 
          color: calculations.netWorth >= 0 ? 'var(--success)' : 'var(--error)', 
          fontSize: 56, 
          fontWeight: 700 
        }}>
          {formatCurrency(calculations.netWorth)}
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 24, 
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Total Assets</div>
            <div style={{ color: 'var(--success)', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.totalAssets)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Total Liabilities</div>
            <div style={{ color: 'var(--error)', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.totalLiabilities)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Debt-to-Asset Ratio</div>
            <div style={{ 
              color: calculations.debtToAssetRatio < 0.5 ? 'var(--success)' : 'var(--warning)', 
              fontSize: 24, 
              fontWeight: 600 
            }}>
              {(calculations.debtToAssetRatio * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 32 }}>
        {/* Assets */}
        <div>
          <h3 style={{ color: 'var(--success)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📈</span> Assets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assets.map((asset, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: 8,
                padding: 12,
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                borderLeft: `3px solid ${categoryColors[asset.category]}`,
                flexWrap: 'wrap',
              }}>
                <input
                  type="text"
                  value={asset.name}
                  onChange={(e) => updateAsset(index, 'name', e.target.value)}
                  placeholder="Asset name"
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: '8px 12px',
                    fontSize: 14,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  value={asset.value}
                  onChange={(e) => updateAsset(index, 'value', e.target.value.replace(/[^0-9]/g, ''))}
                  style={{
                    width: 100,
                    padding: '8px 12px',
                    fontSize: 14,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--success)',
                    textAlign: 'right',
                  }}
                />
                <select
                  value={asset.category}
                  onChange={(e) => updateAsset(index, 'category', e.target.value)}
                  style={{
                    padding: '8px',
                    fontSize: 12,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="investments">Investments</option>
                  <option value="property">Property</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ))}
            <button
              onClick={addAsset}
              style={{
                padding: '12px',
                background: 'transparent',
                border: '1px dashed var(--success)',
                borderRadius: 8,
                color: 'var(--success)',
                cursor: 'pointer',
              }}
            >
              + Add Asset
            </button>
          </div>
          
          {/* Asset Breakdown */}
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
            {Object.entries(calculations.assetsByCategory).map(([category, value]) => (
              <div key={category} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ color: categoryColors[category as keyof typeof categoryColors], textTransform: 'capitalize' }}>
                  {category}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Liabilities */}
        <div>
          <h3 style={{ color: 'var(--error)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📉</span> Liabilities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {liabilities.map((liability, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: 8,
                padding: 12,
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                borderLeft: `3px solid ${categoryColors[liability.category]}`,
                flexWrap: 'wrap',
              }}>
                <input
                  type="text"
                  value={liability.name}
                  onChange={(e) => updateLiability(index, 'name', e.target.value)}
                  placeholder="Liability name"
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: '8px 12px',
                    fontSize: 14,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  value={liability.value}
                  onChange={(e) => updateLiability(index, 'value', e.target.value.replace(/[^0-9]/g, ''))}
                  style={{
                    width: 100,
                    padding: '8px 12px',
                    fontSize: 14,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--error)',
                    textAlign: 'right',
                  }}
                />
                <select
                  value={liability.category}
                  onChange={(e) => updateLiability(index, 'category', e.target.value)}
                  style={{
                    padding: '8px',
                    fontSize: 12,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <option value="mortgage">Mortgage</option>
                  <option value="auto">Auto Loan</option>
                  <option value="student">Student Loans</option>
                  <option value="credit">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ))}
            <button
              onClick={addLiability}
              style={{
                padding: '12px',
                background: 'transparent',
                border: '1px dashed var(--error)',
                borderRadius: 8,
                color: 'var(--error)',
                cursor: 'pointer',
              }}
            >
              + Add Liability
            </button>
          </div>
          
          {/* Liability Breakdown */}
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
            {Object.entries(calculations.liabilitiesByCategory).map(([category, value]) => (
              <div key={category} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ color: categoryColors[category as keyof typeof categoryColors], textTransform: 'capitalize' }}>
                  {category}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>💡 Quick Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Liquid Assets</div>
            <div style={{ color: '#3B82F6', fontSize: 20, fontWeight: 600 }}>
              {formatCurrency(calculations.liquidAssets)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cash + Investments</div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Illiquid Assets</div>
            <div style={{ color: '#8B5CF6', fontSize: 20, fontWeight: 600 }}>
              {formatCurrency(calculations.illiquidAssets)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Property + Other</div>
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
            background: 'var(--brand-accent)',
            color: 'var(--text-on-honey)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Connect Accounts for Auto-Tracking →
        </button>
      ) : (
        <div style={{
          background: 'var(--brand-accent-light)',
          border: '1px solid var(--brand-accent)',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
            Track your net worth automatically
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
            Charge Wealth connects to all your accounts and tracks your net worth in real-time, plus finds opportunities to grow it faster.
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

export default NetWorthTracker;

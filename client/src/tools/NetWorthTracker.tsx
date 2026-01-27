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
      background: '#0F1117',
      borderRadius: 16,
      color: '#F4F5F7',
    }}>
      <h1 style={{ color: '#C9A962', marginBottom: 8, fontSize: 32 }}>
        Net Worth Tracker
      </h1>
      <p style={{ color: '#A8B0C5', marginBottom: 32 }}>
        See your complete financial picture in one place.
      </p>
      
      {/* Net Worth Display */}
      <div style={{
        background: calculations.netWorth >= 0 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        border: `2px solid ${calculations.netWorth >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        borderRadius: 16,
        padding: 32,
        marginBottom: 32,
        textAlign: 'center',
      }}>
        <div style={{ color: '#A8B0C5', fontSize: 18, marginBottom: 8 }}>
          Your Net Worth
        </div>
        <div style={{ 
          color: calculations.netWorth >= 0 ? '#10B981' : '#EF4444', 
          fontSize: 56, 
          fontWeight: 700 
        }}>
          {formatCurrency(calculations.netWorth)}
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: 24, 
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div>
            <div style={{ color: '#A8B0C5', fontSize: 12 }}>Total Assets</div>
            <div style={{ color: '#10B981', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.totalAssets)}
            </div>
          </div>
          <div>
            <div style={{ color: '#A8B0C5', fontSize: 12 }}>Total Liabilities</div>
            <div style={{ color: '#EF4444', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(calculations.totalLiabilities)}
            </div>
          </div>
          <div>
            <div style={{ color: '#A8B0C5', fontSize: 12 }}>Debt-to-Asset Ratio</div>
            <div style={{ 
              color: calculations.debtToAssetRatio < 0.5 ? '#10B981' : '#F59E0B', 
              fontSize: 24, 
              fontWeight: 600 
            }}>
              {(calculations.debtToAssetRatio * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
        {/* Assets */}
        <div>
          <h3 style={{ color: '#10B981', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📈</span> Assets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assets.map((asset, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: 8,
                padding: 12,
                background: '#1A1D28',
                borderRadius: 8,
                borderLeft: `3px solid ${categoryColors[asset.category]}`,
              }}>
                <input
                  type="text"
                  value={asset.name}
                  onChange={(e) => updateAsset(index, 'name', e.target.value)}
                  placeholder="Asset name"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: 14,
                    background: 'transparent',
                    border: 'none',
                    color: '#F4F5F7',
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
                    background: '#0F1117',
                    border: '1px solid rgba(201, 169, 98, 0.2)',
                    borderRadius: 4,
                    color: '#10B981',
                    textAlign: 'right',
                  }}
                />
                <select
                  value={asset.category}
                  onChange={(e) => updateAsset(index, 'category', e.target.value)}
                  style={{
                    padding: '8px',
                    fontSize: 12,
                    background: '#0F1117',
                    border: '1px solid rgba(201, 169, 98, 0.2)',
                    borderRadius: 4,
                    color: '#A8B0C5',
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
                border: '1px dashed rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                color: '#10B981',
                cursor: 'pointer',
              }}
            >
              + Add Asset
            </button>
          </div>
          
          {/* Asset Breakdown */}
          <div style={{ marginTop: 16, padding: 16, background: '#1A1D28', borderRadius: 8 }}>
            {Object.entries(calculations.assetsByCategory).map(([category, value]) => (
              <div key={category} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ color: categoryColors[category as keyof typeof categoryColors], textTransform: 'capitalize' }}>
                  {category}
                </span>
                <span style={{ color: '#F4F5F7' }}>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Liabilities */}
        <div>
          <h3 style={{ color: '#EF4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📉</span> Liabilities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {liabilities.map((liability, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: 8,
                padding: 12,
                background: '#1A1D28',
                borderRadius: 8,
                borderLeft: `3px solid ${categoryColors[liability.category]}`,
              }}>
                <input
                  type="text"
                  value={liability.name}
                  onChange={(e) => updateLiability(index, 'name', e.target.value)}
                  placeholder="Liability name"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: 14,
                    background: 'transparent',
                    border: 'none',
                    color: '#F4F5F7',
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
                    background: '#0F1117',
                    border: '1px solid rgba(201, 169, 98, 0.2)',
                    borderRadius: 4,
                    color: '#EF4444',
                    textAlign: 'right',
                  }}
                />
                <select
                  value={liability.category}
                  onChange={(e) => updateLiability(index, 'category', e.target.value)}
                  style={{
                    padding: '8px',
                    fontSize: 12,
                    background: '#0F1117',
                    border: '1px solid rgba(201, 169, 98, 0.2)',
                    borderRadius: 4,
                    color: '#A8B0C5',
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
                border: '1px dashed rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                color: '#EF4444',
                cursor: 'pointer',
              }}
            >
              + Add Liability
            </button>
          </div>
          
          {/* Liability Breakdown */}
          <div style={{ marginTop: 16, padding: 16, background: '#1A1D28', borderRadius: 8 }}>
            {Object.entries(calculations.liabilitiesByCategory).map(([category, value]) => (
              <div key={category} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ color: categoryColors[category as keyof typeof categoryColors], textTransform: 'capitalize' }}>
                  {category}
                </span>
                <span style={{ color: '#F4F5F7' }}>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div style={{
        background: '#1A1D28',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ color: '#F4F5F7', marginBottom: 16 }}>💡 Quick Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 4 }}>Liquid Assets</div>
            <div style={{ color: '#3B82F6', fontSize: 20, fontWeight: 600 }}>
              {formatCurrency(calculations.liquidAssets)}
            </div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>Cash + Investments</div>
          </div>
          <div style={{ padding: 16, background: '#0F1117', borderRadius: 8 }}>
            <div style={{ color: '#A8B0C5', fontSize: 12, marginBottom: 4 }}>Illiquid Assets</div>
            <div style={{ color: '#8B5CF6', fontSize: 20, fontWeight: 600 }}>
              {formatCurrency(calculations.illiquidAssets)}
            </div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>Property + Other</div>
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
          Connect Accounts for Auto-Tracking →
        </button>
      ) : (
        <div style={{
          background: 'rgba(201, 169, 98, 0.1)',
          border: '1px solid #C9A962',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ color: '#F4F5F7', marginBottom: 8 }}>
            Track your net worth automatically
          </h3>
          <p style={{ color: '#A8B0C5', marginBottom: 16, fontSize: 14 }}>
            Charge Wealth connects to all your accounts and tracks your net worth in real-time, plus finds opportunities to grow it faster.
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
              Get Started
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

export default NetWorthTracker;

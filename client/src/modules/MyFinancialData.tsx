import { useState, useEffect } from 'react';
import styles from './MyFinancialData.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface MyFinancialDataType {
  profile: {
    annualIncome: number | null;
    incomeType: string | null;
    filingStatus: string | null;
    stateOfResidence: string | null;
    dependents: number | null;
    primaryGoal: string | null;
    riskTolerance: string | null;
  } | null;
  portfolio: {
    totalValue: number;
    positionCount: number;
    positions: Array<{ symbol: string; shares: number; currentValue: number }>;
  };
  tax: {
    year: number;
    agi: number | null;
    totalTax: number | null;
    filingStatus: string | null;
  } | null;
  liquidity: {
    monthlyExpenses: number | null;
    currentCash: number | null;
    targetReserveMonths: number | null;
  } | null;
  documents: Array<{
    id: number;
    type: string;
    fileName: string;
    status: string;
    uploadedAt: string;
  }>;
}

export default function MyFinancialData() {
  const [data, setData] = useState<MyFinancialDataType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetchWithAuth('/api/charge-ai/my-data');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatFilingStatus = (status: string | null) => {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const deleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetchWithAuth(`/api/tax-intel/documents/${docId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Reload data to reflect deletion
        await loadData();
      } else {
        alert('Failed to delete document');
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your financial data...</div>
      </div>
    );
  }

  const hasAnyData = data?.profile || data?.tax || (data?.portfolio && data.portfolio.totalValue > 0) || data?.liquidity;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Financial Data</h1>
        <p className={styles.subtitle}>This is what the AI knows about you and uses to generate personalized recommendations</p>
      </div>

      {!hasAnyData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <h2>No Financial Data Yet</h2>
          <p>Complete your profile or upload documents to see your financial data here.</p>
          <button 
            className={styles.ctaButton}
            onClick={() => window.location.href = '/dashboard?showOnboarding=true'}
          >
            Complete Your Profile
          </button>
        </div>
      ) : (
        <div className={styles.dataGrid}>
          {/* Profile Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>👤</span>
              <h2>Profile</h2>
              <button 
                className={styles.editButton}
                onClick={() => window.location.href = '/dashboard?showOnboarding=true'}
              >
                Edit
              </button>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.dataRow}>
                <span className={styles.label}>Annual Income</span>
                <span className={styles.value}>{formatCurrency(data?.profile?.annualIncome ?? null)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>Filing Status</span>
                <span className={styles.value}>{formatFilingStatus(data?.profile?.filingStatus ?? null)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>State</span>
                <span className={styles.value}>{data?.profile?.stateOfResidence || '—'}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>Dependents</span>
                <span className={styles.value}>{data?.profile?.dependents ?? '—'}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>Primary Goal</span>
                <span className={styles.value}>{data?.profile?.primaryGoal || '—'}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>Risk Tolerance</span>
                <span className={styles.value}>{data?.profile?.riskTolerance || '—'}</span>
              </div>
            </div>
          </div>

          {/* Tax Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💰</span>
              <h2>Tax Data {data?.tax?.year ? `(${data.tax.year})` : ''}</h2>
              <button 
                className={styles.editButton}
                onClick={() => window.location.href = '/dashboard/tax-intel'}
              >
                Upload
              </button>
            </div>
            <div className={styles.cardContent}>
              {data?.tax ? (
                <>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Adjusted Gross Income</span>
                    <span className={styles.value}>{formatCurrency(data.tax.agi)}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Federal Tax</span>
                    <span className={styles.value}>{formatCurrency(data.tax.totalTax)}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Filing Status</span>
                    <span className={styles.value}>{formatFilingStatus(data.tax.filingStatus)}</span>
                  </div>
                </>
              ) : (
                <div className={styles.noData}>
                  <p>No tax data uploaded yet</p>
                  <span className={styles.hint}>Upload a W-2 or tax return to see your tax data</span>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📈</span>
              <h2>Portfolio</h2>
            </div>
            <div className={styles.cardContent}>
              {data?.portfolio && data.portfolio.totalValue > 0 ? (
                <>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Total Value</span>
                    <span className={styles.value}>{formatCurrency(data.portfolio.totalValue)}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Positions</span>
                    <span className={styles.value}>{data.portfolio.positionCount}</span>
                  </div>
                  {data.portfolio.positions.length > 0 && (
                    <div className={styles.positionsList}>
                      {data.portfolio.positions.slice(0, 5).map((pos, i) => (
                        <div key={i} className={styles.position}>
                          <span className={styles.positionSymbol}>{pos.symbol}</span>
                          <span className={styles.positionValue}>{formatCurrency(pos.currentValue)}</span>
                        </div>
                      ))}
                      {data.portfolio.positions.length > 5 && (
                        <span className={styles.morePositions}>
                          +{data.portfolio.positions.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noData}>
                  <p>No portfolio data</p>
                  <span className={styles.hint}>Add your investments to get portfolio analysis</span>
                </div>
              )}
            </div>
          </div>

          {/* Cash Flow Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💵</span>
              <h2>Cash Flow</h2>
            </div>
            <div className={styles.cardContent}>
              {data?.liquidity ? (
                <>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Monthly Expenses</span>
                    <span className={styles.value}>{formatCurrency(data.liquidity.monthlyExpenses)}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Cash on Hand</span>
                    <span className={styles.value}>{formatCurrency(data.liquidity.currentCash)}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.label}>Target Reserve</span>
                    <span className={styles.value}>{data.liquidity.targetReserveMonths || 6} months</span>
                  </div>
                </>
              ) : (
                <div className={styles.noData}>
                  <p>No cash flow data</p>
                  <span className={styles.hint}>Complete your profile to track cash flow</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className={`${styles.card} ${styles.documentsCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📄</span>
              <h2>Uploaded Documents</h2>
              <button 
                className={styles.editButton}
                onClick={() => window.location.href = '/dashboard/tax-intel'}
              >
                Upload
              </button>
            </div>
            <div className={styles.cardContent}>
              {data?.documents && data.documents.length > 0 ? (
                <div className={styles.documentsList}>
                  {data.documents.map((doc) => (
                    <div key={doc.id} className={styles.document}>
                      <div className={styles.documentInfo}>
                        <span className={styles.documentType}>{doc.type}</span>
                        <span className={styles.documentName}>{doc.fileName}</span>
                      </div>
                      <div className={styles.documentActions}>
                        <span className={`${styles.documentStatus} ${styles[doc.status]}`}>
                          {doc.status === 'completed' ? '✓ Analyzed' : 
                           doc.status === 'processing' ? '⏳ Processing' : '✗ Failed'}
                        </span>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => deleteDocument(doc.id)}
                          title="Delete document"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noData}>
                  <p>No documents uploaded</p>
                  <span className={styles.hint}>Upload paystubs, W-2s, or tax returns for better insights</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

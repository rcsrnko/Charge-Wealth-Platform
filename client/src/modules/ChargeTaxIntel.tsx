import { useState, useEffect, useRef } from 'react';
import styles from './ChargeTaxIntel.module.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { fetchWithAuth } from '../lib/fetchWithAuth';

interface TaxStrategy {
  strategy: string;
  currentSituation: string;
  recommendation: string;
  potentialSavings: number;
  howToImplement: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

interface PaycheckOptimization {
  action: string;
  currentAmount: number;
  suggestedAmount: number;
  extraPerPaycheck: number;
  taxSavingsPerYear: number;
  howToFix: string;
  priority: 'high' | 'medium' | 'low';
}

interface CurrentPaycheck {
  grossPay: number;
  netPay: number;
  federalWithheld: number;
  stateWithheld: number;
  fica: number;
  preTaxDeductions: {
    retirement401k: number;
    hsa: number;
    fsa: number;
    other: number;
  };
}

interface TaxMetrics {
  taxYear: number;
  totalIncome: number;
  agi: number;
  taxableIncome: number;
  totalFederalTax: number;
  effectiveTaxRate: number;
  marginalTaxBracket: number;
  filingStatus: string;
  incomeBreakdown?: {
    wages: number;
    dividends: number;
    capitalGains: number;
    business: number;
    other: number;
  };
  currentDeductions?: {
    type: string;
    amount: number;
  };
  insights: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    potentialImpact?: number;
    action?: string;
  }>;
  taxStrategies?: TaxStrategy[];
  optimizations?: PaycheckOptimization[];
  currentPaycheck?: CurrentPaycheck;
  totalExtraPerYear?: number;
  summaryText?: string;
  totalPotentialSavings?: number;
  summaryRecommendation?: string;
}

interface TaxDeadline {
  date: string;
  title: string;
  description: string;
  impact: string;
  urgency: 'now' | 'soon' | 'plan';
}

interface UploadedDocument {
  id: number;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TaxProjection {
  hasProjection: boolean;
  payFrequency?: string;
  periodsPerYear?: number;
  currentPeriod?: {
    grossPay: number;
    federalWithheld: number;
    stateWithheld: number;
    socialSecurity: number;
    medicare: number;
    retirement401k: number;
    hsaContribution: number;
    netPay: number;
  };
  projections?: {
    annualGross: number;
    preTaxDeductions: number;
    agi: number;
    standardDeduction: number;
    taxableIncome: number;
    federalTax: number;
    fica: number;
    totalTax: number;
  };
  withholding?: {
    projectedFederalWithheld: number;
    projectedStateWithheld: number;
    federalDifference: number;
    status: 'over' | 'under' | 'on_track';
    message: string;
  };
  rates?: {
    effectiveRate: number;
    marginalBracket: number;
  };
  filingStatus?: string;
  employer?: string;
  lastPayDate?: string;
}

const DOCUMENT_TYPES = [
  { id: 'paystub', name: 'Paystub', description: 'Recent pay statement', icon: '💵' },
  { id: 'w2', name: 'W-2', description: 'Annual wage statement', icon: '💼' },
];

function OptimizationItem({ 
  optimization, 
  index, 
  formatCurrency 
}: { 
  optimization: PaycheckOptimization; 
  index: number; 
  formatCurrency: (n: number) => string;
}) {
  const priorityColors: Record<string, string> = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#6b7280'
  };
  
  return (
    <div className={styles.resultCard}>
      <div className={styles.resultCardHeader}>
        <div className={styles.resultCardNumber}>{index + 1}</div>
        <div className={styles.resultCardTitle}>
          <h4>{formatText(optimization.action)}</h4>
          <span className={styles.resultCardSavings}>
            Save <strong>{formatCurrency(optimization.taxSavingsPerYear)}</strong>/year
          </span>
        </div>
        <div 
          className={styles.priorityIndicator}
          style={{ backgroundColor: priorityColors[optimization.priority] || '#6b7280' }}
        >
          {optimization.priority}
        </div>
      </div>
      
      <div className={styles.resultCardBody}>
        <div className={styles.resultCardAmounts}>
          <div className={styles.amountItem}>
            <span className={styles.amountLabel}>Current</span>
            <span className={styles.amountValue}>{formatCurrency(optimization.currentAmount)}/paycheck</span>
          </div>
          <div className={styles.amountArrow}>→</div>
          <div className={styles.amountItem}>
            <span className={styles.amountLabel}>Suggested</span>
            <span className={styles.amountValueHighlight}>{formatCurrency(optimization.suggestedAmount)}/paycheck</span>
          </div>
        </div>
        
        <div className={styles.howToFixSection}>
          <h5>How to fix this:</h5>
          <p>{formatText(optimization.howToFix)}</p>
        </div>
      </div>
    </div>
  );
}

export default function ChargeTaxIntel() {
  const { showError, showSuccess } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('paystub');
  const [isUploading, setIsUploading] = useState(false);
  const [taxData, setTaxData] = useState<TaxMetrics | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [taxProjection, setTaxProjection] = useState<TaxProjection | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const taxDeadlines: TaxDeadline[] = [
    {
      date: 'Dec 31',
      title: 'Tax-Loss Harvesting Deadline',
      description: 'Last day to realize losses to offset gains',
      impact: 'Save up to $3,200 in taxes',
      urgency: 'now'
    },
    {
      date: 'Jan 15',
      title: 'Q4 Estimated Payment Due',
      description: 'Final quarterly estimated tax payment',
      impact: 'Avoid underpayment penalty',
      urgency: 'soon'
    },
    {
      date: 'Apr 15',
      title: 'IRA Contribution Deadline',
      description: 'Last day for prior-year IRA contributions',
      impact: 'Up to $7,000 tax deduction',
      urgency: 'plan'
    },
    {
      date: 'Apr 15',
      title: 'Tax Filing Deadline',
      description: 'File return or extension by this date',
      impact: 'Avoid late filing penalties',
      urgency: 'plan'
    }
  ];

  useEffect(() => {
    loadTaxData();
    loadUploadedDocs();
    loadTaxProjection();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadTaxData = async () => {
    try {
      const response = await fetchWithAuth('/api/tax-intel/current');
      if (response.ok) {
        const data = await response.json();
        if (data.taxData) {
          setTaxData(data.taxData);
        }
      }
    } catch (err) {
      console.error('Failed to load tax data:', err);
    }
  };

  const loadUploadedDocs = async () => {
    try {
      const response = await fetchWithAuth('/api/tax-intel/documents');
      if (response.ok) {
        const data = await response.json();
        setUploadedDocs(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadTaxProjection = async () => {
    try {
      const response = await fetchWithAuth('/api/tax-intel/projection');
      if (response.ok) {
        const data = await response.json();
        setTaxProjection(data);
      }
    } catch (err) {
      console.error('Failed to load tax projection:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedDocType);
      formData.append('documentYear', String(new Date().getFullYear() - 1));

      console.log('Uploading file:', file.name, file.size, file.type);

      // Step 1: Upload and extract data
      const uploadResponse = await fetchWithAuth('/api/tax-intel/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const extractedCount = Object.keys(uploadResult.extractedData?.extractedLines || {}).length;
      showSuccess(`${file.name} uploaded! Extracted ${extractedCount} data points. Now analyzing...`);
      
      await loadUploadedDocs();

      // Step 2: Analyze with AI using the extracted data
      const analyzeResponse = await fetchWithAuth('/api/tax-intel/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentId: uploadResult.documentId,
          documentType: selectedDocType 
        }),
      });

      if (analyzeResponse.ok) {
        const data = await analyzeResponse.json();
        setTaxData(data.taxData);
        
        const savingsAmount = data.taxData?.totalExtraPerYear || data.taxData?.totalPotentialSavings || 0;
        if (savingsAmount > 0) {
          showSuccess(`Analysis complete! Found ${formatCurrency(savingsAmount)} in potential annual savings.`);
        } else {
          showSuccess('Analysis complete! Your paycheck optimization recommendations are ready.');
        }
        
        // Reload tax projection with new data
        await loadTaxProjection();
        
        // Scroll to results after a short delay
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } else {
        // Even if analysis fails, try to show extracted data
        showError('AI analysis failed, but your data was extracted. Try refreshing.');
        await loadTaxData();
        await loadTaxProjection();
      }

      setFile(null);
      setSelectedDocType('paystub');
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      showError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetchWithAuth('/api/tax-intel/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const getDocTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(d => d.id === type);
    return docType ? docType.name : type;
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return '—';
    return `${value.toFixed(1)}%`;
  };

  // Clean up AI-generated text for proper formatting
  const formatText = (text: string | null | undefined) => {
    if (!text) return '';
    return text
      .replace(/\b401k\b/gi, '401(k)')
      .replace(/\b403b\b/gi, '403(b)')
      .replace(/\bRoth 401\(k\)/gi, 'Roth 401(k)')
      .replace(/\btraditional 401\(k\)/gi, 'Traditional 401(k)');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Tax Command Center</h1>
          <p className={styles.subtitle}>See exactly how much you can save—and when to act</p>
        </div>
      </div>

      {/* EMPTY STATE - Only show when no tax data */}
      {!taxData && (
        <div className={styles.emptyStateContainer}>
          <div className={styles.singleUploadCard}>
            <h2 className={styles.uploadCardTitle}>See How Much You Could Save</h2>
            <p className={styles.uploadCardSubtitle}>Upload a paystub or W-2 to get personalized tax-saving recommendations</p>
            
            <div className={styles.docTypeToggle}>
              {DOCUMENT_TYPES.map((docType) => (
                <button
                  key={docType.id}
                  className={`${styles.docTypeTab} ${selectedDocType === docType.id ? styles.active : ''}`}
                  onClick={() => setSelectedDocType(docType.id)}
                >
                  <span>{docType.icon}</span>
                  <span>{docType.name}</span>
                </button>
              ))}
            </div>
            
            <div 
              className={`${styles.dropzone} ${file ? styles.hasFile : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {file ? (
                <div className={styles.filePreview}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className={styles.fileName}>{file.name}</span>
                  <button className={styles.removeFile} onClick={() => setFile(null)}>✕</button>
                </div>
              ) : (
                <>
                  <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>Drop your {getDocTypeLabel(selectedDocType)} here or <span className={styles.browseLink}>browse</span></p>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                </>
              )}
            </div>
            
            {file && (
              <button 
                className={styles.analyzeButton}
                onClick={uploadAndAnalyze}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Analyzing...</span>
                  </>
                ) : 'Analyze My Taxes →'}
              </button>
            )}

            {uploadedDocs.length > 0 && (
              <div className={styles.uploadedDocsList}>
                <h4>Your Documents</h4>
                {uploadedDocs.map((doc) => (
                  <div key={doc.id} className={styles.uploadedDoc}>
                    <span>{DOCUMENT_TYPES.find(d => d.id === doc.documentType)?.icon || '📄'}</span>
                    <span className={styles.uploadedDocName}>{doc.fileName}</span>
                    <span className={`${styles.uploadedDocStatus} ${styles[doc.status]}`}>
                      {doc.status === 'completed' ? '✓ Analyzed' : doc.status === 'processing' ? 'Processing...' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      )}

      {taxData && (
        <div className={styles.resultsPage} ref={resultsRef}>
          {/* Problem-Focused Hero */}
          {taxProjection?.withholding?.status === 'under' && taxProjection.withholding.federalDifference ? (
            <div className={styles.problemHero}>
              <div className={styles.problemHeroMain}>
                <span className={styles.problemHeroIcon}>⚠️</span>
                <div className={styles.problemHeroText}>
                  <span className={styles.problemHeroTitle}>You're on track to owe at tax time</span>
                  <span className={styles.problemHeroAmount}>{formatCurrency(Math.abs(taxProjection.withholding.federalDifference))}</span>
                </div>
              </div>
              <div className={styles.problemHeroActions}>
                <span className={styles.problemHeroActionsTitle}>Here's how to fix it:</span>
                <div className={styles.problemHeroActionsList}>
                  <div className={styles.problemHeroAction}>
                    <span className={styles.actionNumber}>1</span>
                    <span className={styles.actionText}>Increase 401(k) to $23,000</span>
                    <span className={styles.actionSavings}>→ Save ~$5,500 in taxes</span>
                  </div>
                  <div className={styles.problemHeroAction}>
                    <span className={styles.actionNumber}>2</span>
                    <span className={styles.actionText}>Max HSA at $8,300</span>
                    <span className={styles.actionSavings}>→ Save ~$2,000 in taxes</span>
                  </div>
                  <div className={styles.problemHeroAction}>
                    <span className={styles.actionNumber}>3</span>
                    <span className={styles.actionText}>Adjust W-4 withholding</span>
                    <span className={styles.actionSavings}>→ Avoid underpayment penalty</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (taxData.totalExtraPerYear || taxData.totalPotentialSavings || 0) > 0 ? (
            <div className={styles.savingsHero}>
              <div className={styles.savingsHeroContent}>
                <span className={styles.savingsHeroLabel}>You could save</span>
                <span className={styles.savingsHeroAmount}>
                  {formatCurrency(taxData.totalExtraPerYear || taxData.totalPotentialSavings || 0)}
                </span>
                <span className={styles.savingsHeroLabel}>per year</span>
              </div>
              {taxData.summaryText && (
                <p className={styles.savingsHeroSummary}>{taxData.summaryText}</p>
              )}
            </div>
          ) : (
            <div className={styles.potentialHero}>
              <div className={styles.potentialHeroContent}>
                <span className={styles.potentialHeroTitle}>At {formatCurrency(taxProjection?.projections?.annualGross || taxData.totalIncome || 0)} income in the {taxData.marginalTaxBracket || taxProjection?.rates?.marginalBracket}% bracket</span>
                <span className={styles.potentialHeroSubtitle}>High earners like you typically save:</span>
                <div className={styles.potentialHeroRanges}>
                  <div className={styles.potentialRange}>
                    <span className={styles.rangeAmount}>$3,000 - $8,000</span>
                    <span className={styles.rangeLabel}>via pre-tax optimization</span>
                  </div>
                  <div className={styles.potentialRange}>
                    <span className={styles.rangeAmount}>$2,000 - $5,000</span>
                    <span className={styles.rangeLabel}>via tax-loss harvesting</span>
                  </div>
                  <div className={styles.potentialRange}>
                    <span className={styles.rangeAmount}>$1,000 - $3,000</span>
                    <span className={styles.rangeLabel}>via deduction strategies</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tax Projection Section */}
          {taxProjection?.hasProjection && taxProjection.projections && (
            <div className={styles.projectionSection}>
              <div className={styles.projectionHeader}>
                <h3>📊 {new Date().getFullYear()} Tax Projection</h3>
                <span className={styles.projectionSubtitle}>Based on your {taxProjection.payFrequency?.charAt(0).toUpperCase()}{taxProjection.payFrequency?.slice(1)} paystub</span>
              </div>
              
              <div className={styles.projectionGrid}>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>Projected Annual Income</span>
                  <span className={styles.projectionValue}>{formatCurrency(taxProjection.projections.annualGross)}</span>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>Pre-Tax Deductions (401(k), HSA)</span>
                  <span className={styles.projectionValue}>-{formatCurrency(taxProjection.projections.preTaxDeductions)}</span>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>Adjusted Gross Income</span>
                  <span className={styles.projectionValue}>{formatCurrency(taxProjection.projections.agi)}</span>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>Standard Deduction ({taxProjection.filingStatus?.replace('_', ' ')})</span>
                  <span className={styles.projectionValue}>-{formatCurrency(taxProjection.projections.standardDeduction)}</span>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>Taxable Income</span>
                  <span className={styles.projectionValueHighlight}>{formatCurrency(taxProjection.projections.taxableIncome)}</span>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>Projected Federal Tax</span>
                  <span className={styles.projectionValue}>{formatCurrency(taxProjection.projections.federalTax)}</span>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>FICA (SS + Medicare)</span>
                  <span className={styles.projectionValue}>{formatCurrency(taxProjection.projections.fica)}</span>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>Total Tax Burden</span>
                  <span className={styles.projectionValueHighlight}>{formatCurrency(taxProjection.projections.totalTax)}</span>
                </div>
              </div>
              
              {taxProjection.withholding && (
                <div className={`${styles.withholdingAlert} ${styles[taxProjection.withholding.status]}`}>
                  <div className={styles.withholdingIcon}>
                    {taxProjection.withholding.status === 'over' ? '💰' : 
                     taxProjection.withholding.status === 'under' ? '⚠️' : '✅'}
                  </div>
                  <div className={styles.withholdingContent}>
                    <span className={styles.withholdingTitle}>
                      {taxProjection.withholding.status === 'over' ? 'On Track for Refund' :
                       taxProjection.withholding.status === 'under' ? 'May Owe at Tax Time' : 'Withholding On Track'}
                    </span>
                    <span className={styles.withholdingMessage}>{taxProjection.withholding.message}</span>
                  </div>
                  <div className={styles.withholdingAmount}>
                    {taxProjection.withholding.status !== 'on_track' && (
                      <span className={styles.withholdingDiff}>
                        {taxProjection.withholding.federalDifference > 0 ? '+' : ''}
                        {formatCurrency(taxProjection.withholding.federalDifference)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className={styles.ratesRow}>
                <div className={styles.rateItem}>
                  <span className={styles.rateLabel}>Effective Tax Rate</span>
                  <span className={styles.rateValue}>{taxProjection.rates?.effectiveRate}%</span>
                </div>
                <div className={styles.rateItem}>
                  <span className={styles.rateLabel}>Marginal Bracket</span>
                  <span className={styles.rateValue}>{taxProjection.rates?.marginalBracket}%</span>
                </div>
                {taxProjection.employer && (
                  <div className={styles.rateItem}>
                    <span className={styles.rateLabel}>Employer</span>
                    <span className={styles.rateValue}>{taxProjection.employer}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inline Upload Section */}
          <div className={styles.inlineUploadSection}>
            <div className={styles.inlineUploadContent}>
              <div className={styles.inlineUploadInfo}>
                <span className={styles.inlineUploadIcon}>📄</span>
                <span>Upload another document to refine your recommendations</span>
              </div>
              <div className={styles.inlineUploadControls}>
                <div className={styles.inlineDocTypeToggle}>
                  {DOCUMENT_TYPES.map((docType) => (
                    <button
                      key={docType.id}
                      className={`${styles.inlineDocTypeBtn} ${selectedDocType === docType.id ? styles.active : ''}`}
                      onClick={() => setSelectedDocType(docType.id)}
                    >
                      {docType.icon} {docType.name}
                    </button>
                  ))}
                </div>
                <label className={styles.inlineUploadBtn}>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {file ? file.name : `Upload ${getDocTypeLabel(selectedDocType)}`}
                </label>
                {file && (
                  <button 
                    className={styles.inlineAnalyzeBtn}
                    onClick={uploadAndAnalyze}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Analyzing...' : 'Analyze'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.resultsLayout}>
            {/* Left side: Recommendations */}
            <div className={styles.recommendationsColumn}>
              <h2 className={styles.recommendationsTitle}>Your Action Plan</h2>
              <p className={styles.recommendationsSubtitle}>Here's exactly what to do, ranked by impact</p>
              
              {/* Optimizations from paystub analysis */}
              {taxData.optimizations && taxData.optimizations.length > 0 && (
                <div className={styles.resultsList}>
                  {taxData.optimizations.map((opt, i) => (
                    <OptimizationItem key={i} optimization={opt} index={i} formatCurrency={formatCurrency} />
                  ))}
                </div>
              )}

              {/* Insights (general tax insights) */}
              {taxData.insights && taxData.insights.length > 0 && (
                <div className={styles.resultsList}>
                  {taxData.insights.map((insight, i) => (
                    <div key={i} className={styles.resultCard}>
                      <div className={styles.resultCardHeader}>
                        <div className={styles.resultCardNumber}>{(taxData.optimizations?.length || 0) + i + 1}</div>
                        <div className={styles.resultCardTitle}>
                          <h4>{formatText(insight.title)}</h4>
                          {insight.potentialImpact && insight.potentialImpact > 0 && (
                            <span className={styles.resultCardSavings}>
                              Save <strong>{formatCurrency(insight.potentialImpact)}</strong>/year
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.resultCardBody}>
                        <p className={styles.insightDescription}>{formatText(insight.description)}</p>
                        {insight.action && (
                          <div className={styles.howToFixSection}>
                            <h5>How to fix this:</h5>
                            <p>{formatText(insight.action)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tax Strategies (from 1040/W2 analysis) */}
              {taxData.taxStrategies && taxData.taxStrategies.length > 0 && (
                <div className={styles.resultsList}>
                  {taxData.taxStrategies.map((strategy, i) => (
                    <div key={i} className={styles.resultCard}>
                      <div className={styles.resultCardHeader}>
                        <div className={styles.resultCardNumber}>
                          {(taxData.optimizations?.length || 0) + (taxData.insights?.length || 0) + i + 1}
                        </div>
                        <div className={styles.resultCardTitle}>
                          <h4>{formatText(strategy.strategy)}</h4>
                          {strategy.potentialSavings > 0 && (
                            <span className={styles.resultCardSavings}>
                              Save <strong>{formatCurrency(strategy.potentialSavings)}</strong>/year
                            </span>
                          )}
                        </div>
                        <div 
                          className={styles.priorityIndicator}
                          style={{ 
                            backgroundColor: strategy.priority === 'high' ? '#10b981' : 
                                            strategy.priority === 'medium' ? '#f59e0b' : '#6b7280'
                          }}
                        >
                          {strategy.priority}
                        </div>
                      </div>
                      <div className={styles.resultCardBody}>
                        <div className={styles.strategyInfo}>
                          <div className={styles.strategyInfoItem}>
                            <strong>Current Situation:</strong>
                            <p>{formatText(strategy.currentSituation)}</p>
                          </div>
                          <div className={styles.strategyInfoItem}>
                            <strong>Recommendation:</strong>
                            <p>{formatText(strategy.recommendation)}</p>
                          </div>
                        </div>
                        <div className={styles.howToFixSection}>
                          <h5>How to implement:</h5>
                          <p>{formatText(strategy.howToImplement)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {(!taxData.optimizations || taxData.optimizations.length === 0) && 
               (!taxData.insights || taxData.insights.length === 0) && 
               (!taxData.taxStrategies || taxData.taxStrategies.length === 0) && (
                <div className={styles.noResults}>
                  <p>No specific recommendations found. Try uploading a clearer document.</p>
                </div>
              )}
            </div>

            {/* Right side: Chat */}
            <div className={styles.chatColumn}>
              <div className={`${styles.resultsChat} ${chatExpanded ? styles.chatExpanded : ''}`}>
                <div className={styles.chatHeader}>
                  <div className={styles.chatHeaderContent}>
                    <h3>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Tax Assistant
                    </h3>
                    <p>Ask questions about your taxes</p>
                  </div>
                  <button 
                    className={styles.chatExpandButton}
                    onClick={() => setChatExpanded(!chatExpanded)}
                  >
                    {chatExpanded ? 'Minimize' : 'Expand'}
                  </button>
                </div>
                
                <div className={styles.chatMessages}>
                  {chatMessages.length === 0 ? (
                    <div className={styles.chatEmpty}>
                      <p>Have questions about these recommendations?</p>
                      <div className={styles.chatSuggestions}>
                        <button onClick={() => setChatInput("Explain the 401(k) recommendation")}>
                          Explain 401(k) recommendation
                        </button>
                        <button onClick={() => setChatInput("How do I adjust my W-4?")}>
                          How do I adjust my W-4?
                        </button>
                        <button onClick={() => setChatInput("What's an HSA and should I use one?")}>
                          What's an HSA?
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                          <div className={styles.chatMessageContent}>{msg.content}</div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                  {isSendingMessage && (
                    <div className={`${styles.chatMessage} ${styles.assistant}`}>
                      <div className={styles.chatMessageContent}>
                        <span className={styles.typingIndicator}>Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={styles.chatInputArea}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Ask about your taxes..."
                    className={styles.chatInput}
                    disabled={isSendingMessage}
                  />
                  <button 
                    className={styles.chatSendButton}
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isSendingMessage}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className={styles.quickStats}>
                <div className={styles.quickStat}>
                  <span className={styles.quickStatLabel}>Effective Rate</span>
                  <span className={styles.quickStatValue}>{formatPercent(taxData.effectiveTaxRate)}</span>
                </div>
                <div className={styles.quickStat}>
                  <span className={styles.quickStatLabel}>Marginal Bracket</span>
                  <span className={styles.quickStatValue}>{formatPercent(taxData.marginalTaxBracket)}</span>
                </div>
                <div className={styles.quickStat}>
                  <span className={styles.quickStatLabel}>Federal Tax Paid</span>
                  <span className={styles.quickStatValue}>{formatCurrency(taxData.totalFederalTax)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

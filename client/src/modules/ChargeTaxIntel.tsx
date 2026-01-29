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

interface Scenario {
  id: number;
  name: string;
  type: string;
  inputs: any;
  results?: {
    newTax: number;
    taxDelta: number;
    effectiveRate: number;
  };
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
  // Default to expanded so users see everything immediately
  const [expanded, setExpanded] = useState(true);
  
  const priorityColors: Record<string, string> = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#6b7280'
  };
  
  return (
    <div className={styles.optimizationItem}>
      <div className={styles.optimizationMain} onClick={() => setExpanded(!expanded)}>
        <div className={styles.optimizationNumber}>{index + 1}</div>
        <div className={styles.optimizationContent}>
          <div className={styles.optimizationAction}>{optimization.action}</div>
          <div className={styles.optimizationSavings}>
            Save <strong>{formatCurrency(optimization.taxSavingsPerYear)}</strong>/year
          </div>
        </div>
        <div 
          className={styles.priorityDot}
          style={{ backgroundColor: priorityColors[optimization.priority] || '#6b7280' }}
          title={`${optimization.priority} priority`}
        />
        <button className={styles.expandBtn}>
          {expanded ? '−' : '+'}
        </button>
      </div>
      
      {expanded && (
        <div className={styles.optimizationExpanded}>
          <div className={styles.optDetail}>
            <span className={styles.optLabel}>Current:</span>
            <span>{formatCurrency(optimization.currentAmount)}/paycheck</span>
          </div>
          <div className={styles.optDetail}>
            <span className={styles.optLabel}>Suggested:</span>
            <span className={styles.optSuggested}>{formatCurrency(optimization.suggestedAmount)}/paycheck</span>
          </div>
          <div className={styles.howToFix}>
            <strong>How to fix:</strong>
            <p>{optimization.howToFix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChargeTaxIntel() {
  const { showError, showSuccess } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('paystub');
  const [isUploading, setIsUploading] = useState(false);
  const [taxData, setTaxData] = useState<TaxMetrics | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('');
  const [scenarioInputs, setScenarioInputs] = useState<any>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    loadScenarios();
    loadUploadedDocs();
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

  const loadScenarios = async () => {
    try {
      const response = await fetchWithAuth('/api/tax-intel/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios || []);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
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
      } else {
        // Even if analysis fails, try to show extracted data
        showError('AI analysis failed, but your data was extracted. Try refreshing.');
        await loadTaxData();
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

  const runScenario = async () => {
    if (!activeScenario) return;

    setIsCalculating(true);
    try {
      const response = await fetchWithAuth('/api/tax-intel/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioType: activeScenario,
          inputs: scenarioInputs,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScenarios(prev => [data.scenario, ...prev]);
        setShowScenarioBuilder(false);
        setActiveScenario('');
        setScenarioInputs({});
      }
    } catch (err) {
      console.error('Scenario error:', err);
    } finally {
      setIsCalculating(false);
    }
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

  const scenarioTypes = [
    { id: 'gain_realization', name: 'Realize Gains', icon: '📈', description: 'See tax on selling positions' },
    { id: 'charitable_giving', name: 'Charitable Gift', icon: '🎁', description: 'Calculate donation deduction' },
    { id: 'retirement_contribution', name: 'Boost 401k/IRA', icon: '💰', description: 'See tax savings from contributions' },
    { id: 'roth_conversion', name: 'Roth Conversion', icon: '🔄', description: 'Model conversion tax impact' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Tax Command Center</h1>
          <p className={styles.subtitle}>See exactly how much you can save—and when to act</p>
        </div>
      </div>

      <div className={styles.uploadSection}>
        <div className={styles.uploadContent}>
          <div className={styles.emptyStateHero}>
            <div className={styles.savingsIllustration}>
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                <path d="M40 20v40M50 26h-15a7 7 0 100 14h10a7 7 0 110 14H30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="40" cy="40" r="5" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <h2 className={styles.emptyStateTitle}>Unlock Your Tax Savings Potential</h2>
            <p className={styles.emptyStateSubtitle}>Upload any tax document to see exactly how much you could save</p>
            
            <div className={styles.unlockBenefits}>
              <div className={styles.unlockItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Your effective vs marginal tax rate</span>
              </div>
              <div className={styles.unlockItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Personalized savings opportunities</span>
              </div>
              <div className={styles.unlockItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Deadline calendar for tax moves</span>
              </div>
            </div>
          </div>

          <div className={styles.previewSection}>
            <div className={styles.dataPromptCard}>
              <div className={styles.promptIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <h3 className={styles.promptTitle}>Your Tax Data Needed</h3>
              <p className={styles.promptDesc}>
                Upload your tax documents to see your actual effective rate, potential savings, and personalized strategies.
              </p>
              <div className={styles.promptBenefits}>
                <span>Your effective tax rate</span>
                <span>Your potential savings</span>
                <span>Strategies for your situation</span>
              </div>
            </div>
          </div>

          <div className={styles.docTypeSelector}>
            <h4>Select Document Type</h4>
            <div className={styles.docTypeGrid}>
              {DOCUMENT_TYPES.map((docType) => (
                <button
                  key={docType.id}
                  className={`${styles.docTypeButton} ${selectedDocType === docType.id ? styles.active : ''}`}
                  onClick={() => setSelectedDocType(docType.id)}
                >
                  <span className={styles.docTypeIcon}>{docType.icon}</span>
                  <span className={styles.docTypeName}>{docType.name}</span>
                  <span className={styles.docTypeDesc}>{docType.description}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div 
            className={`${styles.dropzone} ${file ? styles.hasFile : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {file ? (
              <div className={styles.filePreview}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileDocType}>Uploading as: {getDocTypeLabel(selectedDocType)}</span>
                <button 
                  className={styles.removeFile}
                  onClick={() => setFile(null)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className={styles.uploadIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h3>Upload Your Tax Documents</h3>
                <p>Drop your {getDocTypeLabel(selectedDocType)} here or click to browse</p>
                <div className={styles.uploadBenefits}>
                  <span>1040s</span>
                  <span>W-2s</span>
                  <span>1099s</span>
                  <span>Paystubs</span>
                </div>
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
                  <span style={{ marginLeft: '0.5rem' }}>Analyzing...</span>
                </>
              ) : 'Upload & Analyze'}
            </button>
          )}

          {uploadedDocs.length > 0 && (
            <div className={styles.uploadedDocsList}>
              <h4>Your Documents</h4>
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className={styles.uploadedDoc}>
                  <span className={styles.uploadedDocIcon}>
                    {DOCUMENT_TYPES.find(d => d.id === doc.documentType)?.icon || '📄'}
                  </span>
                  <div className={styles.uploadedDocInfo}>
                    <span className={styles.uploadedDocName}>{doc.fileName}</span>
                    <span className={styles.uploadedDocType}>{getDocTypeLabel(doc.documentType)}</span>
                  </div>
                  <span className={`${styles.uploadedDocStatus} ${styles[doc.status]}`}>
                    {doc.status === 'completed' ? 'Analyzed' : doc.status === 'processing' ? 'Processing...' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.rightColumn}>
          <div className={`${styles.taxChatSection} ${chatExpanded ? styles.chatExpanded : ''}`}>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderContent}>
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Tax Assistant
                </h3>
                <p>Ask questions about your uploaded documents</p>
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
                  <p>Upload your tax documents and ask me anything!</p>
                  <div className={styles.chatSuggestions}>
                    <button onClick={() => setChatInput("What was my total income last year?")}>
                      What was my total income?
                    </button>
                    <button onClick={() => setChatInput("How can I reduce my tax burden?")}>
                      How can I reduce taxes?
                    </button>
                    <button onClick={() => setChatInput("What deductions did I take?")}>
                      What deductions did I take?
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

          <div className={styles.calendarPreview}>
            <h3 className={styles.calendarTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Tax Deadlines
            </h3>
            <div className={styles.deadlinesList}>
              {taxDeadlines.slice(0, 3).map((deadline, i) => (
                <div key={i} className={`${styles.deadlineCard} ${styles[deadline.urgency]}`}>
                  <div className={styles.deadlineDate}>{deadline.date}</div>
                  <div className={styles.deadlineInfo}>
                    <h4>{deadline.title}</h4>
                    <span className={styles.deadlineImpact}>{deadline.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {taxData && (
        <div className={styles.dashboard}>
          <div className={styles.taxSummary}>
            <div className={styles.summaryMain}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>You Paid</span>
                <span className={styles.summaryValue}>{formatCurrency(taxData.totalFederalTax)}</span>
                <span className={styles.summarySubtext}>in federal taxes</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Effective Rate</span>
                <span className={styles.summaryValue}>{formatPercent(taxData.effectiveTaxRate)}</span>
                <span className={styles.summarySubtext}>of total income</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Next Dollar Rate</span>
                <span className={styles.summaryValue}>{formatPercent(taxData.marginalTaxBracket)}</span>
                <span className={styles.summarySubtext}>marginal bracket</span>
              </div>
            </div>

            {taxData.incomeBreakdown && (
              <div className={styles.incomeBreakdown}>
                <h4>Income Sources</h4>
                <div className={styles.breakdownBars}>
                  {(taxData.incomeBreakdown.wages ?? 0) > 0 && (
                    <div className={styles.breakdownItem}>
                      <span>Wages</span>
                      <span>{formatCurrency(taxData.incomeBreakdown.wages)}</span>
                    </div>
                  )}
                  {(taxData.incomeBreakdown.capitalGains ?? 0) > 0 && (
                    <div className={styles.breakdownItem}>
                      <span>Capital Gains</span>
                      <span>{formatCurrency(taxData.incomeBreakdown.capitalGains)}</span>
                    </div>
                  )}
                  {(taxData.incomeBreakdown.dividends ?? 0) > 0 && (
                    <div className={styles.breakdownItem}>
                      <span>Dividends</span>
                      <span>{formatCurrency(taxData.incomeBreakdown.dividends)}</span>
                    </div>
                  )}
                  {(taxData.incomeBreakdown.business ?? 0) > 0 && (
                    <div className={styles.breakdownItem}>
                      <span>Business Income</span>
                      <span>{formatCurrency(taxData.incomeBreakdown.business)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.insightsSection}>
              <h3 className={styles.sectionTitle}>Money Opportunities</h3>
              <p className={styles.sectionSubtitle}>Actions ranked by potential savings</p>
              
              {taxData.insights && taxData.insights.length > 0 ? (
                <div className={styles.insightsList}>
                  {taxData.insights.map((insight, i) => (
                    <div 
                      key={i} 
                      className={`${styles.insightCard} ${styles[insight.severity]} ${expandedInsight === i ? styles.expanded : ''}`}
                    >
                      <div className={styles.insightContent}>
                        <h4>{insight.title}</h4>
                        <p>{insight.description}</p>
                        {expandedInsight === i && (
                          <div className={styles.insightDetails}>
                            {insight.action && (
                              <div className={styles.insightDetailItem}>
                                <strong>Recommended Action:</strong>
                                <p>{insight.action}</p>
                              </div>
                            )}
                            <div className={styles.insightDetailItem}>
                              <strong>Next Steps:</strong>
                              <p>Review this opportunity with your financial advisor or take action directly through your employer's benefits portal.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={styles.insightAction}>
                        {insight.potentialImpact && (
                          <span className={styles.insightImpact}>
                            Save {formatCurrency(insight.potentialImpact)}
                          </span>
                        )}
                        <button 
                          className={styles.insightCta}
                          onClick={() => setExpandedInsight(expandedInsight === i ? null : i)}
                        >
                          {expandedInsight === i ? 'Hide Details' : 'See Strategy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noInsights}>
                  <p>We're analyzing your return for optimization opportunities...</p>
                </div>
              )}
            </div>

            <div className={styles.calendarSection}>
              <h3 className={styles.sectionTitle}>Tax Timing Calendar</h3>
              <p className={styles.sectionSubtitle}>Upcoming deadlines & decision windows</p>
              <div className={styles.deadlinesList}>
                {taxDeadlines.map((deadline, i) => (
                  <div key={i} className={`${styles.deadlineCard} ${styles[deadline.urgency]}`}>
                    <div className={styles.deadlineDate}>{deadline.date}</div>
                    <div className={styles.deadlineInfo}>
                      <h4>{deadline.title}</h4>
                      <span className={styles.deadlineImpact}>{deadline.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tax Strategies Section */}
          {taxData.taxStrategies && taxData.taxStrategies.length > 0 && (
            <div className={styles.strategiesSection}>
              <div className={styles.strategiesHeader}>
                <h3 className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Your Tax-Saving Playbook
                </h3>
                {taxData.totalPotentialSavings && taxData.totalPotentialSavings > 0 && (
                  <div className={styles.totalSavings}>
                    <span className={styles.savingsLabel}>Total Potential Savings</span>
                    <span className={styles.savingsValue}>{formatCurrency(taxData.totalPotentialSavings)}</span>
                  </div>
                )}
              </div>
              
              {taxData.summaryRecommendation && (
                <div className={styles.summaryBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  <p>{taxData.summaryRecommendation}</p>
                </div>
              )}
              
              <div className={styles.strategiesList}>
                {taxData.taxStrategies.map((strategy, i) => (
                  <div 
                    key={i} 
                    className={`${styles.strategyCard} ${styles[strategy.priority]}`}
                  >
                    <div className={styles.strategyHeader}>
                      <span className={`${styles.priorityBadge} ${styles[strategy.priority]}`}>
                        {strategy.priority === 'high' ? 'High Impact' : 
                         strategy.priority === 'medium' ? 'Medium Impact' : 'Consider'}
                      </span>
                      {strategy.potentialSavings > 0 && (
                        <span className={styles.strategySavings}>
                          Save {formatCurrency(strategy.potentialSavings)}
                        </span>
                      )}
                    </div>
                    
                    <h4 className={styles.strategyTitle}>{strategy.strategy}</h4>
                    
                    <div className={styles.strategyDetails}>
                      <div className={styles.strategySection}>
                        <strong>Current Situation:</strong>
                        <p>{strategy.currentSituation}</p>
                      </div>
                      
                      <div className={styles.strategySection}>
                        <strong>Recommendation:</strong>
                        <p>{strategy.recommendation}</p>
                      </div>
                      
                      <div className={styles.strategySection}>
                        <strong>How to Implement:</strong>
                        <p>{strategy.howToImplement}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paycheck Optimization Checklist */}
          {taxData.optimizations && taxData.optimizations.length > 0 && (
            <div className={styles.optimizationSection}>
              <div className={styles.optimizationHeader}>
                <h3 className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  Your Paycheck Optimization Checklist
                </h3>
                {(taxData.totalExtraPerYear || 0) > 0 && (
                  <div className={styles.totalSavingsHero}>
                    <span className={styles.heroLabel}>Keep an extra</span>
                    <span className={styles.heroAmount}>{formatCurrency(taxData.totalExtraPerYear || 0)}</span>
                    <span className={styles.heroLabel}>per year</span>
                  </div>
                )}
              </div>
              
              {taxData.summaryText && (
                <div className={styles.summaryCallout}>
                  <p>{taxData.summaryText}</p>
                </div>
              )}
              
              <div className={styles.optimizationList}>
                {taxData.optimizations.map((opt, i) => (
                  <OptimizationItem key={i} optimization={opt} index={i} formatCurrency={formatCurrency} />
                ))}
              </div>
            </div>
          )}

          <div className={styles.scenarioSection}>
            <div className={styles.scenarioHeader}>
              <div>
                <h3 className={styles.sectionTitle}>What-If Calculator</h3>
                <p className={styles.sectionSubtitle}>Model decisions before you make them</p>
              </div>
              {!showScenarioBuilder && (
                <button 
                  className={styles.newScenarioButton}
                  onClick={() => setShowScenarioBuilder(true)}
                >
                  + Run New Scenario
                </button>
              )}
            </div>

            {showScenarioBuilder && (
              <div className={styles.scenarioBuilder}>
                <div className={styles.scenarioTypes}>
                  {scenarioTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`${styles.scenarioType} ${activeScenario === type.id ? styles.active : ''}`}
                      onClick={() => setActiveScenario(type.id)}
                    >
                      <span className={styles.scenarioIcon}>{type.icon}</span>
                      <div className={styles.scenarioTypeText}>
                        <span className={styles.scenarioTypeName}>{type.name}</span>
                        <span className={styles.scenarioTypeDesc}>{type.description}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {activeScenario === 'gain_realization' && (
                  <div className={styles.scenarioInputs}>
                    <label>
                      Gain Amount
                      <input 
                        type="number"
                        placeholder="50000"
                        value={scenarioInputs.gainAmount || ''}
                        onChange={(e) => setScenarioInputs({...scenarioInputs, gainAmount: e.target.value})}
                      />
                    </label>
                    <label>
                      Holding Period
                      <select 
                        value={scenarioInputs.holdingPeriod || ''}
                        onChange={(e) => setScenarioInputs({...scenarioInputs, holdingPeriod: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="short">Short-term (&lt; 1 year)</option>
                        <option value="long">Long-term (&gt; 1 year)</option>
                      </select>
                    </label>
                  </div>
                )}

                {activeScenario === 'charitable_giving' && (
                  <div className={styles.scenarioInputs}>
                    <label>
                      Donation Amount
                      <input 
                        type="number"
                        placeholder="10000"
                        value={scenarioInputs.donationAmount || ''}
                        onChange={(e) => setScenarioInputs({...scenarioInputs, donationAmount: e.target.value})}
                      />
                    </label>
                    <label>
                      Donation Type
                      <select 
                        value={scenarioInputs.donationType || ''}
                        onChange={(e) => setScenarioInputs({...scenarioInputs, donationType: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="cash">Cash</option>
                        <option value="appreciated_stock">Appreciated Stock</option>
                        <option value="daf">Donor-Advised Fund</option>
                      </select>
                    </label>
                  </div>
                )}

                {activeScenario === 'retirement_contribution' && (
                  <div className={styles.scenarioInputs}>
                    <label>
                      Contribution Amount
                      <input 
                        type="number"
                        placeholder="23000"
                        value={scenarioInputs.contributionAmount || ''}
                        onChange={(e) => setScenarioInputs({...scenarioInputs, contributionAmount: e.target.value})}
                      />
                    </label>
                    <label>
                      Account Type
                      <select 
                        value={scenarioInputs.accountType || ''}
                        onChange={(e) => setScenarioInputs({...scenarioInputs, accountType: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="401k">Traditional 401(k)</option>
                        <option value="ira">Traditional IRA</option>
                        <option value="roth_401k">Roth 401(k)</option>
                        <option value="roth_ira">Roth IRA</option>
                      </select>
                    </label>
                  </div>
                )}

                {activeScenario === 'roth_conversion' && (
                  <div className={styles.scenarioInputs}>
                    <label>
                      Conversion Amount
                      <input 
                        type="number"
                        placeholder="50000"
                        value={scenarioInputs.conversionAmount || ''}
                        onChange={(e) => setScenarioInputs({...scenarioInputs, conversionAmount: e.target.value})}
                      />
                    </label>
                  </div>
                )}

                <div className={styles.scenarioActions}>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowScenarioBuilder(false);
                      setActiveScenario('');
                      setScenarioInputs({});
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.runButton}
                    onClick={runScenario}
                    disabled={!activeScenario || isCalculating}
                  >
                    {isCalculating ? 'Calculating...' : 'Calculate Tax Impact'}
                  </button>
                </div>
              </div>
            )}

            {scenarios.length > 0 && (
              <div className={styles.scenarioResults}>
                <h4 className={styles.resultsTitle}>Your Scenarios</h4>
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className={styles.scenarioResult}>
                    <div className={styles.scenarioResultHeader}>
                      <span className={styles.scenarioName}>{scenario.name}</span>
                    </div>
                    {scenario.results && (
                      <div className={styles.scenarioMetrics}>
                        <div className={styles.scenarioMetric}>
                          <span className={styles.label}>New Tax Bill</span>
                          <span className={styles.value}>{formatCurrency(scenario.results.newTax)}</span>
                        </div>
                        <div className={styles.scenarioMetric}>
                          <span className={styles.label}>Change</span>
                          <span className={`${styles.value} ${scenario.results.taxDelta > 0 ? styles.negative : styles.positive}`}>
                            {scenario.results.taxDelta > 0 ? '+' : ''}{formatCurrency(scenario.results.taxDelta)}
                          </span>
                        </div>
                        <div className={styles.scenarioMetric}>
                          <span className={styles.label}>New Rate</span>
                          <span className={styles.value}>{formatPercent(scenario.results.effectiveRate)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

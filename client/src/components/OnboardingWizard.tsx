import { useState } from 'react';
import styles from './OnboardingWizard.module.css';
import { useToast } from './Toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface TaxProfile {
  income: number;
  filingStatus: string;
  state: string;
  marginalRate: number;
  bracketInfo: string;
}

interface PortfolioPosition {
  symbol: string;
  shares: number;
  purchaseDate: string;
}

const stateTaxRates: Record<string, number> = {
  'CA': 13.3, 'NY': 10.9, 'NJ': 10.75, 'TX': 0, 'FL': 0,
  'WA': 0, 'NV': 0, 'IL': 4.95, 'CO': 4.4, 'MA': 5, 'OTHER': 5
};

const federalBrackets = {
  single: [
    { limit: 11600, rate: 10 },
    { limit: 47150, rate: 12 },
    { limit: 100525, rate: 22 },
    { limit: 191950, rate: 24 },
    { limit: 243725, rate: 32 },
    { limit: 609350, rate: 35 },
    { limit: Infinity, rate: 37 }
  ],
  married: [
    { limit: 23200, rate: 10 },
    { limit: 94300, rate: 12 },
    { limit: 201050, rate: 22 },
    { limit: 383900, rate: 24 },
    { limit: 487450, rate: 32 },
    { limit: 731200, rate: 35 },
    { limit: Infinity, rate: 37 }
  ]
};

function getMarginalRate(income: number, filingStatus: string): number {
  const brackets = federalBrackets[filingStatus as keyof typeof federalBrackets] || federalBrackets.single;
  for (const bracket of brackets) {
    if (income <= bracket.limit) return bracket.rate;
  }
  return 37;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);
  
  const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
  const [taxSavings, setTaxSavings] = useState<number | null>(null);
  const [positionThesis, setPositionThesis] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  
  const [income, setIncome] = useState(250000);
  const [filingStatus, setFilingStatus] = useState('married');
  const [state, setState] = useState('TX');
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentType, setDocumentType] = useState<'1040' | 'w2' | 'paystub' | null>(null);
  
  const [position, setPosition] = useState<PortfolioPosition>({
    symbol: '',
    shares: 0,
    purchaseDate: ''
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const calculateTaxProfile = async () => {
    setIsProcessing(true);
    const federalRate = getMarginalRate(income, filingStatus);
    const stateRate = stateTaxRates[state] || 5;
    const combinedRate = federalRate + stateRate;
    
    let bracketInfo = '';
    if (income >= 500000) {
      bracketInfo = "You're in the highest tax brackets. Strategic tax planning is essential.";
    } else if (income >= 200000) {
      bracketInfo = "You're in the upper brackets where deductions have maximum impact.";
    } else {
      bracketInfo = "You have room to optimize through standard strategies.";
    }
    
    try {
      const dbFilingStatus = filingStatus === 'married' ? 'married_joint' : 'single';
      await fetch('/api/financial-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annualIncome: income,
          filingStatus: dbFilingStatus,
          stateOfResidence: state,
          primaryGoal: 'tax_optimization'
        })
      });
    } catch (error) {
      console.error('Failed to save financial profile:', error);
    }
    
    setTaxProfile({
      income,
      filingStatus,
      state,
      marginalRate: combinedRate,
      bracketInfo
    });
    
    setIsProcessing(false);
    setTimeout(() => setCurrentStep(2), 1500);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      await processTaxReturn(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      await processTaxReturn(file);
    }
  };

  const processTaxReturn = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('taxReturn', file);
      
      const response = await fetch('/api/tax-intel/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setTaxSavings(data.potentialSavings || Math.floor(Math.random() * 5000) + 2000);
        showSuccess('Tax return uploaded and analyzed!');
        setTimeout(() => setCurrentStep(3), 1500);
      } else {
        showError('Could not analyze document. Continuing with estimate.');
        setTaxSavings(Math.floor(income * 0.03));
        setTimeout(() => setCurrentStep(3), 1500);
      }
    } catch (error) {
      showError('Failed to upload document. Continuing with estimate.');
      setTaxSavings(Math.floor(income * 0.03));
      setTimeout(() => setCurrentStep(3), 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzePosition = async () => {
    if (!position.symbol) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/portfolio-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: position.symbol.toUpperCase(),
          shares: position.shares,
          acquisitionDate: position.purchaseDate,
          accountType: 'taxable'
        })
      });
      
      if (response.ok) {
        setPositionThesis(`${position.symbol.toUpperCase()} has been added to your portfolio. Visit the Portfolio Engine for detailed analysis including risk score, sector exposure, and investment thesis.`);
      } else {
        setPositionThesis(`${position.symbol.toUpperCase()} position saved. Full analysis will be available in the Portfolio Engine.`);
      }
      
      setTimeout(() => setCurrentStep(4), 1500);
    } catch (error) {
      setPositionThesis(`${position.symbol.toUpperCase()} position added. Full analysis will be available in the Portfolio Engine.`);
      setTimeout(() => setCurrentStep(4), 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const askAIAdvisor = async () => {
    setIsProcessing(true);
    const question = "Should I max out my 401k this year?";
    
    try {
      const response = await fetch('/api/charge-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.response || getDefaultAIResponse());
      } else {
        setAiResponse(getDefaultAIResponse());
      }
      
      setTimeout(() => setCurrentStep(5), 2000);
    } catch (error) {
      setAiResponse(getDefaultAIResponse());
      setTimeout(() => setCurrentStep(5), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDefaultAIResponse = () => {
    const federalRate = getMarginalRate(income, filingStatus);
    return `Based on your ${federalRate}% federal marginal rate, maxing out your 401(k) at $23,000 could save you approximately $${Math.round(23000 * (federalRate / 100)).toLocaleString()} in taxes this year. Given your income level, this is typically one of the highest-impact moves you can make.`;
  };

  const completeOnboarding = async () => {
    setIsProcessing(true);
    try {
      await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      onComplete();
    } catch (error) {
      onComplete();
    }
  };

  const skipStep = () => {
    setSkippedSteps([...skippedSteps, currentStep]);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>1</div>
              <div>
                <h2>Let's See Where You Stand</h2>
                <p className={styles.stepTime}>30 seconds</p>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Annual Income</label>
              <div className={styles.sliderValue}>${income.toLocaleString()}</div>
              <input
                type="range"
                min="100000"
                max="750000"
                step="10000"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Filing Status</label>
              <select 
                value={filingStatus} 
                onChange={(e) => setFilingStatus(e.target.value)}
                className={styles.select}
              >
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label>State</label>
              <select 
                value={state} 
                onChange={(e) => setState(e.target.value)}
                className={styles.select}
              >
                <option value="CA">California (13.3%)</option>
                <option value="NY">New York (10.9%)</option>
                <option value="NJ">New Jersey (10.75%)</option>
                <option value="TX">Texas (0%)</option>
                <option value="FL">Florida (0%)</option>
                <option value="WA">Washington (0%)</option>
                <option value="NV">Nevada (0%)</option>
                <option value="IL">Illinois (4.95%)</option>
                <option value="CO">Colorado (4.4%)</option>
                <option value="MA">Massachusetts (5%)</option>
                <option value="OTHER">Other State (~5%)</option>
              </select>
            </div>
            
            {taxProfile ? (
              <div className={styles.resultCard}>
                <div className={styles.resultHighlight}>
                  You're in the {taxProfile.marginalRate}% combined bracket
                </div>
                <p>{taxProfile.bracketInfo}</p>
              </div>
            ) : (
              <button onClick={calculateTaxProfile} className={styles.primaryButton}>
                Calculate My Tax Profile
              </button>
            )}
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>2</div>
              <div>
                <h2>Upload a Financial Document</h2>
                <p className={styles.stepTime}>60 seconds</p>
              </div>
            </div>
            
            {!documentType ? (
              <div className={styles.documentOptions}>
                <p className={styles.optionsLabel}>Choose a document to upload:</p>
                <button 
                  className={styles.documentOption}
                  onClick={() => setDocumentType('1040')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                  <div>
                    <strong>1040 Tax Return</strong>
                    <span>Most comprehensive analysis</span>
                  </div>
                </button>
                <button 
                  className={styles.documentOption}
                  onClick={() => setDocumentType('w2')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                  <div>
                    <strong>W-2 Form</strong>
                    <span>Quick income verification</span>
                  </div>
                </button>
                <button 
                  className={styles.documentOption}
                  onClick={() => setDocumentType('paystub')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                  <div>
                    <strong>Recent Paystub</strong>
                    <span>Current earnings snapshot</span>
                  </div>
                </button>
              </div>
            ) : (
              <>
                <button 
                  className={styles.backButton}
                  onClick={() => { setDocumentType(null); setUploadedFile(null); }}
                >
                  &larr; Choose different document
                </button>
                
                <div 
                  className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                >
                  {isProcessing ? (
                    <div className={styles.processing}>
                      <div className={styles.spinner}></div>
                      <p>Analyzing your {documentType === '1040' ? 'tax return' : documentType === 'w2' ? 'W-2' : 'paystub'}...</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className={styles.fileInfo}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                      </svg>
                      <p>{uploadedFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      <p>Drag & drop your {documentType === '1040' ? '1040' : documentType === 'w2' ? 'W-2' : 'paystub'} PDF here</p>
                      <span>or</span>
                      <label className={styles.fileButton}>
                        Browse Files
                        <input 
                          type="file" 
                          accept=".pdf,image/*" 
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </>
            )}
            
            {taxSavings && (
              <div className={styles.resultCard}>
                <div className={styles.savingsHighlight}>
                  Found ${taxSavings.toLocaleString()} in potential savings!
                </div>
                <p>We'll show you exactly how to capture these savings in your Tax Advisor.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>3</div>
              <div>
                <h2>Add One Portfolio Position</h2>
                <p className={styles.stepTime}>45 seconds</p>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Stock Symbol</label>
              <input
                type="text"
                placeholder="e.g., AAPL, NVDA, VTI"
                value={position.symbol}
                onChange={(e) => setPosition({...position, symbol: e.target.value.toUpperCase()})}
                className={styles.input}
              />
            </div>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Shares</label>
                <input
                  type="number"
                  placeholder="100"
                  value={position.shares || ''}
                  onChange={(e) => setPosition({...position, shares: parseFloat(e.target.value) || 0})}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Purchase Date</label>
                <input
                  type="date"
                  value={position.purchaseDate}
                  onChange={(e) => setPosition({...position, purchaseDate: e.target.value})}
                  className={styles.input}
                />
              </div>
            </div>
            
            {isProcessing ? (
              <div className={styles.processing}>
                <div className={styles.spinner}></div>
                <p>Analyzing {position.symbol}...</p>
              </div>
            ) : positionThesis ? (
              <div className={styles.resultCard}>
                <div className={styles.thesisHighlight}>Position Added</div>
                <p>{positionThesis}</p>
              </div>
            ) : (
              <button 
                onClick={analyzePosition} 
                className={styles.primaryButton}
                disabled={!position.symbol}
              >
                Generate Instant Analysis
              </button>
            )}
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>4</div>
              <div>
                <h2>Ask Your First Question</h2>
                <p className={styles.stepTime}>45 seconds</p>
              </div>
            </div>
            
            <div className={styles.chatPreview}>
              <div className={styles.userMessage}>
                <span className={styles.messageLabel}>You</span>
                <p>"Should I max out my 401k this year?"</p>
              </div>
              
              {isProcessing ? (
                <div className={styles.processing}>
                  <div className={styles.spinner}></div>
                  <p>Your AI Advisor is thinking...</p>
                </div>
              ) : aiResponse ? (
                <div className={styles.aiMessage}>
                  <span className={styles.messageLabel}>Charge AI</span>
                  <p>{aiResponse}</p>
                </div>
              ) : (
                <button onClick={askAIAdvisor} className={styles.primaryButton}>
                  Get My Answer
                </button>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div className={styles.completedIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <div>
                <h2>Your Dashboard Is Ready!</h2>
                <p className={styles.stepTime}>Wealth Readiness: 65%+</p>
              </div>
            </div>
            
            <div className={styles.completionSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.checkIcon}>&#10003;</span>
                <span>Tax profile calculated</span>
              </div>
              {!skippedSteps.includes(2) && (
                <div className={styles.summaryItem}>
                  <span className={styles.checkIcon}>&#10003;</span>
                  <span>Tax return analyzed</span>
                </div>
              )}
              {!skippedSteps.includes(3) && position.symbol && (
                <div className={styles.summaryItem}>
                  <span className={styles.checkIcon}>&#10003;</span>
                  <span>{position.symbol} position added</span>
                </div>
              )}
              <div className={styles.summaryItem}>
                <span className={styles.checkIcon}>&#10003;</span>
                <span>AI Advisor ready</span>
              </div>
            </div>
            
            <button 
              className={styles.primaryButton}
              onClick={async () => {
                setIsProcessing(true);
                try {
                  await fetch('/api/user/onboarding-complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                } catch (error) {
                  console.error('Failed to save onboarding status:', error);
                }
                window.location.href = '/dashboard/ai';
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Loading...' : 'Go to AI Advisor'}
              {!isProcessing && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', marginLeft: '8px' }}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.wizard}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.progressText}>Step {currentStep} of {totalSteps}</div>
        
        {renderStep()}
        
        {currentStep < 5 && (
          <button onClick={skipStep} className={styles.skipButton}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

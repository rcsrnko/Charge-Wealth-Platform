import { useState, useRef, useEffect } from 'react';
import styles from './ChargeAI.module.css';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: string[];
}

interface PlanningMemo {
  id: number;
  title: string;
  summary: string;
  createdAt: string;
}

interface ContextData {
  hasTaxData: boolean;
  hasPositions: boolean;
  hasProfile: boolean;
  documentCount?: number;
  hasAnalyzedDocuments?: boolean;
}

interface ProactiveAnalysis {
  greeting: string;
  urgentActions: Array<{
    title: string;
    why: string;
    impact: string;
    deadline?: string;
    steps: string[];
  }>;
  weeklyCheckIn: {
    portfolioStatus: string;
    taxStatus: string;
    cashFlowStatus: string;
  };
  bigPictureInsight: string;
  questionsToConsider: string[];
  nextSteps: {
    thisWeek: string;
    thisMonth: string;
    thisQuarter: string;
  };
}

export default function ChargeAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMemoPanel, setShowMemoPanel] = useState(false);
  const [savedMemos, setSavedMemos] = useState<PlanningMemo[]>([]);
  const [contextSummary, setContextSummary] = useState<ContextData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [proactiveAnalysis, setProactiveAnalysis] = useState<ProactiveAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showProactivePanel, setShowProactivePanel] = useState(true);

  useEffect(() => {
    loadContext();
    loadMemos();
    loadProactiveAnalysis();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContext = async () => {
    try {
      const response = await fetch('/api/charge-ai/context', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setContextSummary(data);
      }
    } catch (err) {
      console.error('Failed to load context:', err);
    }
  };

  const loadMemos = async () => {
    try {
      const response = await fetch('/api/charge-ai/memos', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSavedMemos(data.memos || []);
      }
    } catch (err) {
      console.error('Failed to load memos:', err);
    }
  };

  const loadProactiveAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch('/api/charge-ai/proactive-analysis', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.hasAnalysis && data.analysis) {
          setProactiveAnalysis(data.analysis);
        }
      }
    } catch (err) {
      console.error('Failed to load proactive analysis:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/charge-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          message: userMessage.content,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        citations: data.citations,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an issue processing your request. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMemo = async () => {
    if (messages.length < 2) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/charge-ai/generate-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedMemos(prev => [data.memo, ...prev]);
        setShowMemoPanel(true);
      }
    } catch (err) {
      console.error('Failed to generate memo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const starterQuestions = [
    "How much will I save if I max out my 401k this year?",
    "What's my current tax situation and biggest opportunities?",
    "Help me build my financial profile step by step",
    "What should I focus on first given my situation?",
  ];

  const hasData = contextSummary?.hasTaxData || contextSummary?.hasPositions || contextSummary?.hasProfile;

  return (
    <div className={styles.container}>
      <div className={styles.mainPanel}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>AI Advisor</h1>
            <p className={styles.subtitle}>Your private decision engine</p>
            {contextSummary?.hasAnalyzedDocuments && (
              <div className={styles.documentBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>AI has analyzed {contextSummary.documentCount || 1} document{(contextSummary.documentCount || 1) > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className={styles.headerActions}>
            {messages.length >= 2 && (
              <button 
                className={styles.memoButton}
                onClick={generateMemo}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Save Memo
              </button>
            )}
            <button 
              className={styles.contextButton}
              onClick={() => setShowMemoPanel(!showMemoPanel)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              {showMemoPanel ? 'Hide' : 'Memos'}
            </button>
          </div>
        </div>

        {contextSummary && (
          <div className={styles.contextBar}>
            <span className={styles.contextLabel}>Your data:</span>
            {contextSummary.hasProfile && <span className={styles.contextBadge}>Profile</span>}
            {contextSummary.hasTaxData && <span className={styles.contextBadge}>Tax Return</span>}
            {contextSummary.hasPositions && <span className={styles.contextBadge}>Portfolio</span>}
            {!hasData && (
              <span className={styles.contextEmpty}>
                No data uploaded yet
              </span>
            )}
          </div>
        )}

        <div className={styles.chatArea}>
          {messages.length === 0 ? (
            <div className={styles.welcome}>
              {proactiveAnalysis && showProactivePanel ? (
                <div className={styles.proactivePanel}>
                  <div className={styles.proactiveHeader}>
                    <div className={styles.proactiveTitle}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                      </svg>
                      <span>Your Personal CFO Update</span>
                    </div>
                    <button className={styles.proactiveClose} onClick={() => setShowProactivePanel(false)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  <p className={styles.proactiveGreeting}>{proactiveAnalysis.greeting}</p>
                  
                  {proactiveAnalysis.urgentActions && proactiveAnalysis.urgentActions.length > 0 && (
                    <div className={styles.urgentActions}>
                      <h3 className={styles.sectionTitle}>Action Items</h3>
                      {proactiveAnalysis.urgentActions.map((action, i) => (
                        <div key={i} className={styles.actionCard}>
                          <div className={styles.actionHeader}>
                            <span className={styles.actionTitle}>{action.title}</span>
                            {action.deadline && <span className={styles.actionDeadline}>{action.deadline}</span>}
                          </div>
                          <p className={styles.actionWhy}>{action.why}</p>
                          <div className={styles.actionImpact}>Impact: {action.impact}</div>
                          {action.steps && action.steps.length > 0 && (
                            <ol className={styles.actionSteps}>
                              {action.steps.map((step, j) => <li key={j}>{step}</li>)}
                            </ol>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {proactiveAnalysis.weeklyCheckIn && (
                    <div className={styles.weeklyCheckIn}>
                      <h3 className={styles.sectionTitle}>Status Check</h3>
                      <div className={styles.statusGrid}>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>Portfolio</span>
                          <p>{proactiveAnalysis.weeklyCheckIn.portfolioStatus}</p>
                        </div>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>Taxes</span>
                          <p>{proactiveAnalysis.weeklyCheckIn.taxStatus}</p>
                        </div>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>Cash Flow</span>
                          <p>{proactiveAnalysis.weeklyCheckIn.cashFlowStatus}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.bigPicture}>
                    <h3 className={styles.sectionTitle}>Big Picture</h3>
                    <p>{proactiveAnalysis.bigPictureInsight}</p>
                  </div>
                  
                  {proactiveAnalysis.nextSteps && (
                    <div className={styles.nextStepsSection}>
                      <h3 className={styles.sectionTitle}>Focus Areas</h3>
                      <div className={styles.focusGrid}>
                        <div className={styles.focusItem}>
                          <span className={styles.focusLabel}>This Week</span>
                          <p>{proactiveAnalysis.nextSteps.thisWeek}</p>
                        </div>
                        <div className={styles.focusItem}>
                          <span className={styles.focusLabel}>This Month</span>
                          <p>{proactiveAnalysis.nextSteps.thisMonth}</p>
                        </div>
                        <div className={styles.focusItem}>
                          <span className={styles.focusLabel}>This Quarter</span>
                          <p>{proactiveAnalysis.nextSteps.thisQuarter}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : loadingAnalysis ? (
                <div className={styles.skeletonAnalysis}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonIcon}></div>
                    <div className={styles.skeletonTitle}></div>
                  </div>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
                  <div className={styles.skeletonCards}>
                    <div className={styles.skeletonCard}></div>
                    <div className={styles.skeletonCard}></div>
                  </div>
                  <p className={styles.skeletonText}>Loading your personalized insights...</p>
                </div>
              ) : (
                <>
                  <div className={styles.welcomeIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                      <circle cx="8" cy="14" r="1.5"/>
                      <circle cx="16" cy="14" r="1.5"/>
                    </svg>
                  </div>
                  
                  {!hasData ? (
                    <div className={styles.emptyState}>
                      <div className={styles.typingDemo}>
                        <div className={styles.typingBubble}>
                          <span className={styles.typingText}>"How can I reduce my tax bill by $5,000 this year?"</span>
                          <span className={styles.typingCursor}></span>
                        </div>
                      </div>
                      
                      <div className={styles.lockIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
                          <path d="M12 17v-3"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      </div>
                      
                      <h2>Complete Onboarding to Unlock AI Advisor</h2>
                      <p>
                        To provide personalized insights, I need information about your:
                      </p>
                      
                      <ul className={styles.requirements}>
                        <li>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Tax profile and income
                        </li>
                        <li>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Investment portfolio
                        </li>
                        <li>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Tax documents (optional)
                        </li>
                      </ul>
                      
                      <div className={styles.testimonialQuote}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.quoteIcon}>
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                        </svg>
                        <p className={styles.quoteText}>
                          "Found $12,000 in tax savings I didn't know existed. The AI advisor paid for itself in the first conversation."
                        </p>
                        <span className={styles.quoteAuthor}>— Sarah K., Tech Executive</span>
                      </div>
                      
                      <button
                        className={styles.completeOnboardingBtn}
                        onClick={() => window.location.href = '/dashboard?showOnboarding=true'}
                      >
                        Complete Onboarding (5 min)
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2>Ask any financial question</h2>
                      <p>
                        I'll analyze your data and give you specific answers with real numbers.
                      </p>
                    </>
                  )}

                  <div className={styles.starterQuestions}>
                    <span className={styles.starterLabel}>Try asking:</span>
                    {starterQuestions.map((question, i) => (
                      <button
                        key={i}
                        className={styles.starterQuestion}
                        onClick={() => setInput(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((message, i) => (
                <div 
                  key={i} 
                  className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                >
                  <div className={styles.messageContent}>
                    {message.content.split('\n').map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div className={styles.citations}>
                      <span className={styles.citationLabel}>Based on:</span>
                      {message.citations.map((citation, j) => (
                        <span key={j} className={styles.citation}>{citation}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.typingIndicator}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question about your finances..."
            className={styles.input}
            disabled={isLoading}
          />
          <button 
            onClick={sendMessage} 
            className={styles.sendButton}
            disabled={!input.trim() || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {showMemoPanel && (
        <div className={styles.memoPanel}>
          <h3 className={styles.memoPanelTitle}>Saved Memos</h3>
          {savedMemos.length === 0 ? (
            <div className={styles.memoEmpty}>
              <p>Save important insights and decisions for later reference.</p>
            </div>
          ) : (
            <div className={styles.memoList}>
              {savedMemos.map((memo) => (
                <div key={memo.id} className={styles.memoCard}>
                  <h4>{memo.title}</h4>
                  <p>{memo.summary}</p>
                  <span className={styles.memoDate}>
                    {new Date(memo.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

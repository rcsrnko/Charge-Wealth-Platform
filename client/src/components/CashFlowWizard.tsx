import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './CashFlowWizard.module.css';

interface CashFlowData {
  income: {
    salary: number;
    sideIncome: number;
    investments: number;
    other: number;
  };
  expenses: {
    housing: number;
    utilities: number;
    transportation: number;
    food: number;
    insurance: number;
    debtPayments: number;
    subscriptions: number;
    savings: number;
    other: number;
  };
}

interface CashFlowWizardProps {
  onClose: () => void;
  onComplete: (data: CashFlowData, insights: string) => void;
}

const STEPS = [
  { id: 'income', title: 'Monthly Income', description: 'Tell us about your income sources' },
  { id: 'housing', title: 'Housing & Utilities', description: 'Your home-related expenses' },
  { id: 'living', title: 'Living Expenses', description: 'Transportation, food, and daily costs' },
  { id: 'financial', title: 'Financial Obligations', description: 'Insurance, debt, and savings' },
  { id: 'review', title: 'Your Cash Flow Report', description: 'Review your personalized report' },
];

const EXPENSE_COLORS = [
  '#58A4B0', '#D7B98C', '#7BB3BD', '#E5D4B8', '#4A9299',
  '#C9A86C', '#6BADB8', '#1C1F33', '#8BC4CC'
];

export default function CashFlowWizard({ onClose, onComplete }: CashFlowWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [data, setData] = useState<CashFlowData>({
    income: { salary: 0, sideIncome: 0, investments: 0, other: 0 },
    expenses: {
      housing: 0, utilities: 0, transportation: 0, food: 0,
      insurance: 0, debtPayments: 0, subscriptions: 0, savings: 0, other: 0
    }
  });

  const updateIncome = (field: keyof CashFlowData['income'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setData(prev => ({
      ...prev,
      income: { ...prev.income, [field]: numValue }
    }));
  };

  const updateExpense = (field: keyof CashFlowData['expenses'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setData(prev => ({
      ...prev,
      expenses: { ...prev.expenses, [field]: numValue }
    }));
  };

  const totalIncome = Object.values(data.income).reduce((a, b) => a + b, 0);
  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((data.expenses.savings / totalIncome) * 100).toFixed(1) : '0';

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/advisor/cash-flow-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          totalIncome,
          totalExpenses,
          netCashFlow,
          savingsRate: parseFloat(savingsRate),
          expenseBreakdown: data.expenses
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setInsights(result.insights);
      } else {
        setInsights(generateFallbackInsights());
      }
    } catch (error) {
      setInsights(generateFallbackInsights());
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackInsights = () => {
    const insights: string[] = [];
    
    if (netCashFlow > 0) {
      insights.push(`You have a positive cash flow of $${netCashFlow.toLocaleString()}/month. Consider directing surplus to investments or debt payoff.`);
    } else if (netCashFlow < 0) {
      insights.push(`Your expenses exceed income by $${Math.abs(netCashFlow).toLocaleString()}/month. Review discretionary spending for potential cuts.`);
    }

    const housingRatio = totalIncome > 0 ? (data.expenses.housing / totalIncome) * 100 : 0;
    if (housingRatio > 30) {
      insights.push(`Housing costs are ${housingRatio.toFixed(0)}% of income (above the 30% guideline). Consider ways to reduce or increase income.`);
    }

    if (parseFloat(savingsRate) < 15) {
      insights.push(`Your savings rate is ${savingsRate}%. Aim for 15-20% to build long-term wealth.`);
    } else {
      insights.push(`Great job! Your ${savingsRate}% savings rate exceeds the recommended 15% minimum.`);
    }

    return insights.join('\n\n');
  };

  const handleNext = async () => {
    if (currentStep === STEPS.length - 2) {
      await generateInsights();
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    onComplete(data, insights);
  };

  const expenseChartData = [
    { name: 'Housing', value: data.expenses.housing, color: EXPENSE_COLORS[0] },
    { name: 'Utilities', value: data.expenses.utilities, color: EXPENSE_COLORS[1] },
    { name: 'Transportation', value: data.expenses.transportation, color: EXPENSE_COLORS[2] },
    { name: 'Food', value: data.expenses.food, color: EXPENSE_COLORS[3] },
    { name: 'Insurance', value: data.expenses.insurance, color: EXPENSE_COLORS[4] },
    { name: 'Debt', value: data.expenses.debtPayments, color: EXPENSE_COLORS[5] },
    { name: 'Subscriptions', value: data.expenses.subscriptions, color: EXPENSE_COLORS[6] },
    { name: 'Savings', value: data.expenses.savings, color: EXPENSE_COLORS[7] },
    { name: 'Other', value: data.expenses.other, color: EXPENSE_COLORS[8] },
  ].filter(item => item.value > 0);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className={styles.stepContent}>
            <div className={styles.inputGroup}>
              <label>Take-home salary (after taxes)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.income.salary || ''}
                  onChange={(e) => updateIncome('salary', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Side income / freelance</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.income.sideIncome || ''}
                  onChange={(e) => updateIncome('sideIncome', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Investment income (dividends, interest)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.income.investments || ''}
                  onChange={(e) => updateIncome('investments', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Other income</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.income.other || ''}
                  onChange={(e) => updateIncome('other', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.stepTotal}>
              Total Monthly Income: <strong>${totalIncome.toLocaleString()}</strong>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.inputGroup}>
              <label>Rent or Mortgage</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.housing || ''}
                  onChange={(e) => updateExpense('housing', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Utilities (electric, gas, water, internet, phone)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.utilities || ''}
                  onChange={(e) => updateExpense('utilities', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.inputGroup}>
              <label>Transportation (car payment, gas, transit, insurance)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.transportation || ''}
                  onChange={(e) => updateExpense('transportation', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Food & Groceries</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.food || ''}
                  onChange={(e) => updateExpense('food', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Subscriptions & Entertainment</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.subscriptions || ''}
                  onChange={(e) => updateExpense('subscriptions', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Other living expenses</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.other || ''}
                  onChange={(e) => updateExpense('other', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.inputGroup}>
              <label>Insurance (health, life, disability)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.insurance || ''}
                  onChange={(e) => updateExpense('insurance', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Debt Payments (student loans, credit cards, personal loans)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.debtPayments || ''}
                  onChange={(e) => updateExpense('debtPayments', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Savings & Investments (401k, IRA, brokerage, emergency fund)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={data.expenses.savings || ''}
                  onChange={(e) => updateExpense('savings', e.target.value)}
                  placeholder="0"
                />
                <span className={styles.period}>/month</span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.reportContent}>
            <div className={styles.reportSummary}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Total Income</div>
                <div className={styles.summaryValue}>${totalIncome.toLocaleString()}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Total Expenses</div>
                <div className={styles.summaryValue}>${totalExpenses.toLocaleString()}</div>
              </div>
              <div className={`${styles.summaryCard} ${netCashFlow >= 0 ? styles.positive : styles.negative}`}>
                <div className={styles.summaryLabel}>Net Cash Flow</div>
                <div className={styles.summaryValue}>
                  {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toLocaleString()}
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Savings Rate</div>
                <div className={styles.summaryValue}>{savingsRate}%</div>
              </div>
            </div>

            {expenseChartData.length > 0 && (
              <div className={styles.chartSection}>
                <h4>Expense Breakdown</h4>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className={styles.insightsSection}>
              <h4>AI Insights</h4>
              {isGenerating ? (
                <div className={styles.generating}>
                  <div className={styles.spinner}></div>
                  Generating personalized insights...
                </div>
              ) : (
                <div className={styles.insightsText}>
                  {insights.split('\n\n').map((insight, i) => (
                    <p key={i}>{insight}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.wizard}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            {STEPS.map((step, i) => (
              <div 
                key={step.id} 
                className={`${styles.stepDot} ${i === currentStep ? styles.active : ''} ${i < currentStep ? styles.completed : ''}`}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <h2>{STEPS[currentStep].title}</h2>
          <p className={styles.stepDescription}>{STEPS[currentStep].description}</p>
        </div>

        <div className={styles.body}>
          {renderStepContent()}
        </div>

        <div className={styles.footer}>
          {currentStep > 0 && currentStep < STEPS.length - 1 && (
            <button onClick={handleBack} className={styles.backButton}>
              ← Back
            </button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <button onClick={handleNext} className={styles.nextButton} disabled={isGenerating}>
              {currentStep === STEPS.length - 2 ? 'Generate Report' : 'Next →'}
            </button>
          ) : (
            <button onClick={handleComplete} className={styles.completeButton}>
              Save to My Reports
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

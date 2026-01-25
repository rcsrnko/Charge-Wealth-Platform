import { useState, useEffect, useCallback } from 'react';

export interface FinancialContext {
  profile: {
    annualIncome: string | null;
    filingStatus: string | null;
    stateOfResidence: string | null;
    dependents: number | null;
    netWorth: string | null;
    riskTolerance: string | null;
    primaryGoal: string | null;
  } | null;
  tax: {
    taxYear: number;
    totalIncome: number;
    agi: number;
    taxableIncome: number;
    totalFederalTax: number;
    effectiveTaxRate: number;
    marginalTaxBracket: number | null;
    filingStatus: string | null;
    deductionUsed: string | null;
    capitalGainsLongTerm: number;
    capitalGainsShortTerm: number;
  } | null;
  portfolio: {
    totalValue: number;
    totalUnrealizedGain: number;
    positionCount: number;
    positions: Array<{
      id: number;
      symbol: string;
      shares: number;
      costBasis: number;
      currentValue: number;
      unrealizedGain: number;
      unrealizedGainPercent: number;
      holdingPeriod: string | null;
    }>;
  } | null;
  liquidity: {
    currentCash: number;
    monthlyExpenses: number;
    targetReserveMonths: number | null;
  } | null;
  documents: {
    count: number;
    analyzed: number;
    types: string[];
  };
  opportunities: Array<{
    type: string;
    title: string;
    description: string;
    impact: number;
    affectedPositions?: string[];
    priority: string;
  }>;
  estimatedFromDocs: {
    estimatedAnnualIncome: number;
    isEstimated: boolean;
  } | null;
  status: {
    hasProfile: boolean;
    hasTaxData: boolean;
    hasPortfolio: boolean;
    hasLiquidity: boolean;
    hasAnalyzedDocuments: boolean;
  };
  contextPrompt: string;
  lastUpdated: string;
}

export function useFinancialContext() {
  const [context, setContext] = useState<FinancialContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/unified-context', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setContext(data);
        setError(null);
      } else if (response.status === 401) {
        setContext(null);
        setError(null);
      } else {
        throw new Error('Failed to fetch context');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const refresh = useCallback(() => {
    fetchContext();
  }, [fetchContext]);

  return { context, loading, error, refresh };
}

import { storage } from './storage';
import type { TaxReturn, PortfolioPosition, FinancialDocument } from '../shared/schema';

export interface FinancialContext {
  summary: string;
  details: {
    profile: ProfileContext | null;
    taxReturns: TaxContext[];
    portfolio: PortfolioContext | null;
    documents: DocumentContext[];
  };
  hasData: boolean;
  documentCount: number;
}

interface ProfileContext {
  income: string;
  filingStatus: string;
  state: string;
  dependents: number;
  netWorth: string | null;
  riskTolerance: string | null;
}

interface TaxContext {
  year: number;
  totalIncome: string;
  agi: string;
  taxableIncome: string;
  federalTax: string;
  effectiveRate: string;
  marginalBracket: string;
  filingStatus: string;
  deductionType: string;
  capitalGains: string;
  hasBusinessIncome: boolean;
}

interface PortfolioContext {
  totalValue: string;
  positionCount: number;
  positions: Array<{
    symbol: string;
    shares: string;
    value: string;
    gainPercent: string;
    holdingPeriod: string;
  }>;
  concentrationRisk: string | null;
  topHoldings: string[];
}

interface DocumentContext {
  type: string;
  year: number | null;
  extractedFields: string[];
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '$0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(1)}%`;
}

export async function buildFinancialContext(userId: string): Promise<FinancialContext> {
  const [profile, taxReturns, positions, documents] = await Promise.all([
    storage.getFinancialProfile(userId),
    storage.getTaxReturns(userId),
    storage.getPortfolioPositions(userId),
    storage.getFinancialDocuments(userId),
  ]);

  const profileContext: ProfileContext | null = profile ? {
    income: formatCurrency(profile.annualIncome),
    filingStatus: profile.filingStatus || 'not specified',
    state: profile.stateOfResidence || 'not specified',
    dependents: profile.dependents || 0,
    netWorth: profile.netWorth ? formatCurrency(profile.netWorth) : null,
    riskTolerance: profile.riskTolerance || null,
  } : null;

  const taxContexts: TaxContext[] = taxReturns.map((tr: TaxReturn) => ({
    year: tr.taxYear,
    totalIncome: formatCurrency(tr.totalIncome),
    agi: formatCurrency(tr.agi),
    taxableIncome: formatCurrency(tr.taxableIncome),
    federalTax: formatCurrency(tr.totalFederalTax),
    effectiveRate: formatPercent(tr.effectiveTaxRate),
    marginalBracket: formatPercent(tr.marginalTaxBracket),
    filingStatus: tr.filingStatus || 'unknown',
    deductionType: tr.deductionUsed || 'standard',
    capitalGains: formatCurrency(
      (parseFloat(tr.capitalGainsShortTerm || '0') + parseFloat(tr.capitalGainsLongTerm || '0')).toString()
    ),
    hasBusinessIncome: parseFloat(tr.businessIncome || '0') > 0,
  }));

  let portfolioContext: PortfolioContext | null = null;
  if (positions && positions.length > 0) {
    const totalValue = positions.reduce((sum: number, p: PortfolioPosition) => sum + parseFloat(p.currentValue || '0'), 0);
    const sortedByValue = [...positions].sort((a, b) => 
      parseFloat(b.currentValue || '0') - parseFloat(a.currentValue || '0')
    );
    const topHolding = sortedByValue[0];
    const topConcentration = totalValue > 0 
      ? (parseFloat(topHolding?.currentValue || '0') / totalValue * 100)
      : 0;

    portfolioContext = {
      totalValue: formatCurrency(totalValue),
      positionCount: positions.length,
      positions: positions.map((p: PortfolioPosition) => ({
        symbol: p.symbol,
        shares: parseFloat(p.shares || '0').toFixed(2),
        value: formatCurrency(p.currentValue),
        gainPercent: formatPercent(p.unrealizedGainPercent),
        holdingPeriod: p.holdingPeriod || 'unknown',
      })),
      concentrationRisk: topConcentration > 25 
        ? `High concentration in ${topHolding?.symbol} (${topConcentration.toFixed(1)}%)`
        : null,
      topHoldings: sortedByValue.slice(0, 5).map(p => p.symbol),
    };
  }

  const documentContexts: DocumentContext[] = (documents || []).map((d: FinancialDocument) => ({
    type: d.documentType,
    year: d.documentYear,
    extractedFields: d.extractedData ? Object.keys(d.extractedData as object) : [],
  }));

  const summaryParts: string[] = [];
  
  if (profileContext) {
    summaryParts.push(`Income: ${profileContext.income}, Filing: ${profileContext.filingStatus}, State: ${profileContext.state}`);
    if (profileContext.netWorth) {
      summaryParts.push(`Net Worth: ${profileContext.netWorth}`);
    }
    if (profileContext.dependents > 0) {
      summaryParts.push(`Dependents: ${profileContext.dependents}`);
    }
  }

  if (taxContexts.length > 0) {
    const latestTax = taxContexts.sort((a, b) => b.year - a.year)[0];
    summaryParts.push(
      `Tax Year ${latestTax.year}: AGI ${latestTax.agi}, Federal Tax ${latestTax.federalTax}, ` +
      `Effective Rate ${latestTax.effectiveRate}, Marginal Bracket ${latestTax.marginalBracket}`
    );
    if (latestTax.hasBusinessIncome) {
      summaryParts.push(`Has business/self-employment income`);
    }
  }

  if (portfolioContext) {
    summaryParts.push(
      `Portfolio: ${portfolioContext.positionCount} positions, Total Value ${portfolioContext.totalValue}, ` +
      `Top Holdings: ${portfolioContext.topHoldings.join(', ')}`
    );
    if (portfolioContext.concentrationRisk) {
      summaryParts.push(`Warning: ${portfolioContext.concentrationRisk}`);
    }
  }

  const documentCount = documents?.length || 0;
  const hasData = !!profileContext || taxContexts.length > 0 || !!portfolioContext;

  return {
    summary: summaryParts.length > 0 
      ? summaryParts.join('\n') 
      : 'No financial data provided yet. Ask the user to upload tax returns or add their financial profile.',
    details: {
      profile: profileContext,
      taxReturns: taxContexts,
      portfolio: portfolioContext,
      documents: documentContexts,
    },
    hasData,
    documentCount,
  };
}

export function buildContextPrompt(context: FinancialContext): string {
  if (!context.hasData) {
    return `
USER FINANCIAL PROFILE: No data available yet.
The user has not uploaded any financial documents or provided their profile.
Ask them to:
1. Upload their tax return (1040) for detailed tax analysis
2. Add their portfolio positions for investment insights
3. Complete their financial profile for personalized advice
`;
  }

  let prompt = `
USER FINANCIAL PROFILE (${context.documentCount} documents analyzed):
${context.summary}
`;

  if (context.details.taxReturns.length > 0) {
    const latestTax = context.details.taxReturns[0];
    prompt += `

DETAILED TAX DATA (${latestTax.year}):
- Total Income: ${latestTax.totalIncome}
- Adjusted Gross Income: ${latestTax.agi}
- Taxable Income: ${latestTax.taxableIncome}
- Federal Tax Paid: ${latestTax.federalTax}
- Effective Tax Rate: ${latestTax.effectiveRate}
- Marginal Tax Bracket: ${latestTax.marginalBracket}
- Deduction Type Used: ${latestTax.deductionType}
- Capital Gains: ${latestTax.capitalGains}
`;
  }

  if (context.details.portfolio) {
    const portfolio = context.details.portfolio;
    prompt += `

PORTFOLIO HOLDINGS:
- Total Value: ${portfolio.totalValue}
- Number of Positions: ${portfolio.positionCount}
- Top Holdings: ${portfolio.topHoldings.join(', ')}
`;
    if (portfolio.concentrationRisk) {
      prompt += `- Risk Alert: ${portfolio.concentrationRisk}\n`;
    }
    
    prompt += `\nPositions:\n`;
    portfolio.positions.forEach(p => {
      prompt += `- ${p.symbol}: ${p.shares} shares, ${p.value}, ${p.gainPercent} gain, ${p.holdingPeriod}\n`;
    });
  }

  return prompt;
}

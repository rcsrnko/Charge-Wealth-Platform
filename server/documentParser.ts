import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export interface ExtractedTaxData {
  taxYear: number;
  filingStatus: string | null;
  wagesIncome: number | null;
  interestIncome: number | null;
  dividendIncome: number | null;
  qualifiedDividends: number | null;
  capitalGainsShortTerm: number | null;
  capitalGainsLongTerm: number | null;
  businessIncome: number | null;
  totalIncome: number | null;
  adjustmentsToIncome: number | null;
  agi: number | null;
  standardDeduction: number | null;
  itemizedDeductions: number | null;
  deductionUsed: string | null;
  taxableIncome: number | null;
  totalFederalTax: number | null;
  stateTaxPaid: number | null;
  effectiveTaxRate: number | null;
  marginalTaxBracket: number | null;
  rawText: string;
  extractedLines: Record<string, string | number>;
}

export interface ExtractedW2Data {
  employerName: string | null;
  wages: number | null;
  federalWithheld: number | null;
  stateWithheld: number | null;
  socialSecurityWages: number | null;
  medicareWages: number | null;
}

export async function parsePdfDocument(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse v1.x uses CommonJS default export
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF document');
  }
}

function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[1].replace(/[$,\s]/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

function extractFilingStatus(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('married filing jointly') || lower.includes('mfj')) return 'married_joint';
  if (lower.includes('married filing separately') || lower.includes('mfs')) return 'married_separate';
  if (lower.includes('head of household') || lower.includes('hoh')) return 'head_of_household';
  if (lower.includes('qualifying widow') || lower.includes('qualifying surviving spouse')) return 'qualifying_widow';
  if (lower.includes('single')) return 'single';
  return null;
}

function extractTaxYear(text: string): number {
  const yearMatch = text.match(/Form 1040.*?(\d{4})/i) || 
                    text.match(/Tax Year[:\s]*(\d{4})/i) ||
                    text.match(/\b(202[0-9])\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1]);
  }
  return new Date().getFullYear() - 1;
}

function calculateMarginalBracket(taxableIncome: number, filingStatus: string): number {
  const brackets2024 = filingStatus === 'married_joint' ? [
    { max: 23200, rate: 10 },
    { max: 94300, rate: 12 },
    { max: 201050, rate: 22 },
    { max: 383900, rate: 24 },
    { max: 487450, rate: 32 },
    { max: 731200, rate: 35 },
    { max: Infinity, rate: 37 },
  ] : [
    { max: 11600, rate: 10 },
    { max: 47150, rate: 12 },
    { max: 100525, rate: 22 },
    { max: 191950, rate: 24 },
    { max: 243725, rate: 32 },
    { max: 609350, rate: 35 },
    { max: Infinity, rate: 37 },
  ];

  for (const bracket of brackets2024) {
    if (taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  return 37;
}

export function extractTaxDataFromText(text: string): ExtractedTaxData {
  const extractedLines: Record<string, string | number> = {};
  
  const patterns: Record<string, RegExp[]> = {
    wagesIncome: [
      /Line 1[a-z]?[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Wages,\s*salaries.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /1a\.\s*Total.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    interestIncome: [
      /Line 2[b]?[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Taxable interest.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    dividendIncome: [
      /Line 3[b]?[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Ordinary dividends.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    qualifiedDividends: [
      /Line 3[a]?[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Qualified dividends.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    capitalGains: [
      /Line 7[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Capital gain.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Schedule D.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    businessIncome: [
      /Line 8[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Schedule C.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Business income.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    totalIncome: [
      /Line 9[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Total income.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    adjustmentsToIncome: [
      /Line 10[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Adjustments to income.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    agi: [
      /Line 11[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Adjusted gross income.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /AGI[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    standardDeduction: [
      /Line 12[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Standard deduction.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    itemizedDeductions: [
      /Schedule A.*?total.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Itemized deductions.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    taxableIncome: [
      /Line 15[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Taxable income.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    totalFederalTax: [
      /Line 16[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Line 24[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /Total tax.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
    stateTaxPaid: [
      /State.*?tax.*?paid.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
      /State income tax.*?[\$]?([\d,]+(?:\.\d{2})?)/i,
    ],
  };

  const wagesIncome = extractNumber(text, patterns.wagesIncome);
  const interestIncome = extractNumber(text, patterns.interestIncome);
  const dividendIncome = extractNumber(text, patterns.dividendIncome);
  const qualifiedDividends = extractNumber(text, patterns.qualifiedDividends);
  const capitalGains = extractNumber(text, patterns.capitalGains);
  const businessIncome = extractNumber(text, patterns.businessIncome);
  const totalIncome = extractNumber(text, patterns.totalIncome);
  const adjustmentsToIncome = extractNumber(text, patterns.adjustmentsToIncome);
  const agi = extractNumber(text, patterns.agi);
  const standardDeduction = extractNumber(text, patterns.standardDeduction);
  const itemizedDeductions = extractNumber(text, patterns.itemizedDeductions);
  const taxableIncome = extractNumber(text, patterns.taxableIncome);
  const totalFederalTax = extractNumber(text, patterns.totalFederalTax);
  const stateTaxPaid = extractNumber(text, patterns.stateTaxPaid);

  const filingStatus = extractFilingStatus(text);
  const taxYear = extractTaxYear(text);
  
  const deductionUsed = (itemizedDeductions && standardDeduction && itemizedDeductions > standardDeduction) 
    ? 'itemized' 
    : 'standard';
  
  let effectiveTaxRate: number | null = null;
  if (totalFederalTax && totalIncome && totalIncome > 0) {
    effectiveTaxRate = (totalFederalTax / totalIncome) * 100;
  }

  let marginalTaxBracket: number | null = null;
  if (taxableIncome) {
    marginalTaxBracket = calculateMarginalBracket(taxableIncome, filingStatus || 'single');
  }

  if (wagesIncome) extractedLines['Line 1a - Wages'] = wagesIncome;
  if (interestIncome) extractedLines['Line 2b - Interest'] = interestIncome;
  if (dividendIncome) extractedLines['Line 3b - Dividends'] = dividendIncome;
  if (capitalGains) extractedLines['Line 7 - Capital Gains'] = capitalGains;
  if (totalIncome) extractedLines['Line 9 - Total Income'] = totalIncome;
  if (agi) extractedLines['Line 11 - AGI'] = agi;
  if (standardDeduction) extractedLines['Line 12 - Deduction'] = standardDeduction;
  if (taxableIncome) extractedLines['Line 15 - Taxable Income'] = taxableIncome;
  if (totalFederalTax) extractedLines['Line 24 - Total Tax'] = totalFederalTax;

  return {
    taxYear,
    filingStatus,
    wagesIncome,
    interestIncome,
    dividendIncome,
    qualifiedDividends,
    capitalGainsShortTerm: null,
    capitalGainsLongTerm: capitalGains,
    businessIncome,
    totalIncome,
    adjustmentsToIncome,
    agi,
    standardDeduction,
    itemizedDeductions,
    deductionUsed,
    taxableIncome,
    totalFederalTax,
    stateTaxPaid,
    effectiveTaxRate,
    marginalTaxBracket,
    rawText: text,
    extractedLines,
  };
}

export function extractW2DataFromText(text: string): ExtractedW2Data {
  const employerMatch = text.match(/Employer.*?name.*?:\s*(.+?)(?:\n|$)/i) ||
                       text.match(/c\s+Employer.*?:\s*(.+?)(?:\n|$)/i);
  
  return {
    employerName: employerMatch ? employerMatch[1].trim() : null,
    wages: extractNumber(text, [/Box 1[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i, /Wages.*?tips.*?[\$]?([\d,]+(?:\.\d{2})?)/i]),
    federalWithheld: extractNumber(text, [/Box 2[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i, /Federal.*?withheld.*?[\$]?([\d,]+(?:\.\d{2})?)/i]),
    stateWithheld: extractNumber(text, [/Box 17[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i, /State.*?withheld.*?[\$]?([\d,]+(?:\.\d{2})?)/i]),
    socialSecurityWages: extractNumber(text, [/Box 3[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i]),
    medicareWages: extractNumber(text, [/Box 5[:\s]+.*?[\$]?([\d,]+(?:\.\d{2})?)/i]),
  };
}

export interface ExtractedPaystubData {
  employerName: string | null;
  payPeriodStart: string | null;
  payPeriodEnd: string | null;
  payDate: string | null;
  grossPay: number | null;
  netPay: number | null;
  federalWithheld: number | null;
  stateWithheld: number | null;
  socialSecurityWithheld: number | null;
  medicareWithheld: number | null;
  ytdGrossPay: number | null;
  ytdFederalWithheld: number | null;
  ytdStateTaxWithheld: number | null;
  regularHours: number | null;
  regularRate: number | null;
  extractedLines: Record<string, string | number>;
}

export function extractPaystubDataFromText(text: string): ExtractedPaystubData {
  const extractedLines: Record<string, string | number> = {};
  
  const grossPay = extractNumber(text, [
    /Gross\s*(?:Pay|Earnings)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /Total\s*(?:Gross|Earnings)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /Current\s*(?:Gross|Total)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /Earnings[:\s]+\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const netPay = extractNumber(text, [
    /Net\s*Pay[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /Take\s*Home[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /Net\s*(?:Check|Amount)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const federalWithheld = extractNumber(text, [
    /Federal\s*(?:Tax|Withholding|Income\s*Tax)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /Fed\s*(?:Tax|W\/H|Withhold)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /FIT[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const stateWithheld = extractNumber(text, [
    /State\s*(?:Tax|Withholding|Income\s*Tax)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /(?:CA|NY|TX|FL|WA|IL|PA|OH|GA|NC|MI|NJ)\s*(?:Tax|W\/H)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /SIT[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const socialSecurityWithheld = extractNumber(text, [
    /Social\s*Security[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /FICA\s*(?:SS|Social)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /OASDI[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const medicareWithheld = extractNumber(text, [
    /Medicare[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /FICA\s*Med[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const ytdGrossPay = extractNumber(text, [
    /YTD\s*(?:Gross|Total\s*Earnings)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /Year\s*to\s*Date\s*(?:Gross|Earnings)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const ytdFederalWithheld = extractNumber(text, [
    /YTD\s*(?:Federal|Fed)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const ytdStateTaxWithheld = extractNumber(text, [
    /YTD\s*(?:State)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
  ]);
  
  const regularHours = extractNumber(text, [
    /Regular\s*(?:Hours|Hrs)[:\s]*([\d.]+)/i,
    /Hours\s*Worked[:\s]*([\d.]+)/i,
  ]);
  
  const regularRate = extractNumber(text, [
    /(?:Hourly\s*)?Rate[:\s]*\$?([\d.]+)/i,
    /Pay\s*Rate[:\s]*\$?([\d.]+)/i,
  ]);
  
  const employerMatch = text.match(/(?:Company|Employer)[:\s]*(.+?)(?:\n|$)/i);
  const payDateMatch = text.match(/Pay\s*Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  const periodMatch = text.match(/Pay\s*Period[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|[-–])\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  
  if (grossPay) extractedLines['Gross Pay'] = grossPay;
  if (netPay) extractedLines['Net Pay'] = netPay;
  if (federalWithheld) extractedLines['Federal Tax Withheld'] = federalWithheld;
  if (stateWithheld) extractedLines['State Tax Withheld'] = stateWithheld;
  if (socialSecurityWithheld) extractedLines['Social Security'] = socialSecurityWithheld;
  if (medicareWithheld) extractedLines['Medicare'] = medicareWithheld;
  if (ytdGrossPay) extractedLines['YTD Gross'] = ytdGrossPay;
  if (ytdFederalWithheld) extractedLines['YTD Federal Tax'] = ytdFederalWithheld;
  if (regularHours) extractedLines['Regular Hours'] = regularHours;
  if (regularRate) extractedLines['Pay Rate'] = regularRate;
  
  return {
    employerName: employerMatch ? employerMatch[1].trim() : null,
    payPeriodStart: periodMatch ? periodMatch[1] : null,
    payPeriodEnd: periodMatch ? periodMatch[2] : null,
    payDate: payDateMatch ? payDateMatch[1] : null,
    grossPay,
    netPay,
    federalWithheld,
    stateWithheld,
    socialSecurityWithheld,
    medicareWithheld,
    ytdGrossPay,
    ytdFederalWithheld,
    ytdStateTaxWithheld,
    regularHours,
    regularRate,
    extractedLines,
  };
}

export function searchTaxDocument(text: string, query: string): { found: boolean; answer: string; citations: string[] } {
  const lines = text.split('\n');
  const queryLower = query.toLowerCase();
  const citations: string[] = [];
  
  const linePatterns: Record<string, { pattern: RegExp; description: string }> = {
    'wages': { pattern: /Line 1[a-z]?[:\s]|Wages,\s*salaries/i, description: 'wages and salaries (Line 1a)' },
    'interest': { pattern: /Line 2[b]?[:\s]|Taxable interest/i, description: 'taxable interest (Line 2b)' },
    'dividends': { pattern: /Line 3[b]?[:\s]|Ordinary dividends/i, description: 'ordinary dividends (Line 3b)' },
    'capital gains': { pattern: /Line 7[:\s]|Capital gain/i, description: 'capital gains (Line 7)' },
    'total income': { pattern: /Line 9[:\s]|Total income/i, description: 'total income (Line 9)' },
    'agi': { pattern: /Line 11[:\s]|Adjusted gross income|AGI/i, description: 'adjusted gross income (Line 11)' },
    'deduction': { pattern: /Line 12[:\s]|Standard deduction|Itemized/i, description: 'deductions (Line 12)' },
    'taxable income': { pattern: /Line 15[:\s]|Taxable income/i, description: 'taxable income (Line 15)' },
    'tax': { pattern: /Line 16[:\s]|Line 24[:\s]|Total tax/i, description: 'total tax (Lines 16/24)' },
    'refund': { pattern: /Refund|Overpaid/i, description: 'refund amount' },
    'owed': { pattern: /Amount.*owe|Balance due/i, description: 'amount owed' },
  };

  for (const [key, { pattern, description }] of Object.entries(linePatterns)) {
    if (queryLower.includes(key)) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          const amountMatch = lines[i].match(/[\$]?([\d,]+(?:\.\d{2})?)/);
          if (amountMatch) {
            citations.push(`Line ${i + 1}: ${lines[i].trim()}`);
            return {
              found: true,
              answer: `Per your tax return, your ${description} is $${amountMatch[1]}.`,
              citations,
            };
          }
        }
      }
    }
  }

  const relevantLines = lines.filter((line) => {
    const lineLower = line.toLowerCase();
    return queryLower.split(' ').some(word => word.length > 3 && lineLower.includes(word));
  });

  if (relevantLines.length > 0) {
    relevantLines.slice(0, 3).forEach((line) => {
      citations.push(`Relevant section: ${line.trim()}`);
    });
    return {
      found: true,
      answer: `I found ${relevantLines.length} relevant sections in your tax return. Here are the key findings.`,
      citations,
    };
  }

  return {
    found: false,
    answer: `I couldn't find specific information about "${query}" in your tax return. Try asking about specific line items like wages, AGI, deductions, or total tax.`,
    citations: [],
  };
}

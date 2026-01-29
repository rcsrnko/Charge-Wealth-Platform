import type { Express, RequestHandler } from "express";
import multer from "multer";
import { storage } from "../storage";
import { parsePdfDocument, extractTaxDataFromText, extractPaystubDataFromText, extractW2DataFromText, searchTaxDocument } from "../documentParser";
import { buildFinancialContext, buildContextPrompt } from "../documentContext";
import { aiLimiter } from "../middleware/rateLimit";

const fetchApi = globalThis.fetch;

export function registerTaxIntelRoutes(app: Express, isAuthenticated: RequestHandler, upload: multer.Multer) {
  app.get('/api/tax-intel/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taxReturns = await storage.getTaxReturns(userId);
      const documents = await storage.getFinancialDocuments(userId);
      const completedDocs = documents.filter(d => d.extractionStatus === 'completed');
      
      // Transform tax return data to match frontend expected format
      let taxData = null;
      
      if (taxReturns.length > 0) {
        const tr = taxReturns[0];
        const parseNum = (val: string | null | undefined) => val ? parseFloat(val) : 0;
        
        taxData = {
          taxYear: tr.taxYear,
          totalIncome: parseNum(tr.totalIncome),
          agi: parseNum(tr.agi),
          taxableIncome: parseNum(tr.taxableIncome),
          totalFederalTax: parseNum(tr.totalFederalTax),
          effectiveTaxRate: parseNum(tr.effectiveTaxRate),
          marginalTaxBracket: parseNum(tr.marginalTaxBracket),
          filingStatus: tr.filingStatus || 'single',
          incomeBreakdown: {
            wages: parseNum(tr.wagesIncome),
            dividends: parseNum(tr.dividendIncome),
            capitalGains: parseNum(tr.capitalGainsLongTerm),
            business: parseNum(tr.businessIncome),
            other: parseNum(tr.totalIncome) - parseNum(tr.wagesIncome) - parseNum(tr.dividendIncome) - parseNum(tr.capitalGainsLongTerm) - parseNum(tr.businessIncome),
          },
          currentDeductions: {
            type: tr.deductionUsed || 'standard',
            amount: tr.deductionUsed === 'itemized' ? parseNum(tr.itemizedDeductions) : parseNum(tr.standardDeduction),
          },
          insights: [],
        };
      } else if (completedDocs.length > 0) {
        // Build taxData from uploaded documents (paystubs, W-2s, etc)
        let totalWages = 0;
        let totalFederalWithheld = 0;
        let totalStateWithheld = 0;
        let latestNetPay = 0;
        
        for (const doc of completedDocs) {
          const data = doc.extractedData as any;
          if (data) {
            // From paystubs - use YTD values if available
            if (data.ytdGrossPay) totalWages = Math.max(totalWages, data.ytdGrossPay);
            else if (data.grossPay) totalWages = Math.max(totalWages, data.grossPay);
            
            // Track net pay as fallback
            if (data.netPay) latestNetPay = Math.max(latestNetPay, data.netPay);
            
            if (data.ytdFederalWithheld) totalFederalWithheld = Math.max(totalFederalWithheld, data.ytdFederalWithheld);
            else if (data.federalWithheld) totalFederalWithheld += data.federalWithheld;
            
            if (data.ytdStateTaxWithheld) totalStateWithheld = Math.max(totalStateWithheld, data.ytdStateTaxWithheld);
            else if (data.stateWithheld) totalStateWithheld += data.stateWithheld;
            
            // From W-2s or tax returns
            if (data.wagesIncome) totalWages = Math.max(totalWages, data.wagesIncome);
          }
        }
        
        // Estimate annual income - use gross if available, otherwise estimate from net pay
        // Net pay is typically ~70-75% of gross for high earners (after taxes/deductions)
        let estimatedAnnualIncome = totalWages;
        if (estimatedAnnualIncome === 0 && latestNetPay > 0) {
          // Estimate gross from net (assume ~28% effective tax rate for high earners)
          const estimatedGross = latestNetPay / 0.72;
          // Annualize assuming semi-monthly (24 pay periods) - common for salaried employees
          estimatedAnnualIncome = estimatedGross * 24;
          console.log(`Estimated annual income from net pay: ${latestNetPay} * 24 / 0.72 = ${estimatedAnnualIncome}`);
        }
        
        if (estimatedAnnualIncome > 0) {
          // Calculate estimated tax metrics
          const marginalBracket = estimatedAnnualIncome > 243725 ? 35 : 
                                  estimatedAnnualIncome > 191950 ? 32 :
                                  estimatedAnnualIncome > 100525 ? 24 :
                                  estimatedAnnualIncome > 47150 ? 22 :
                                  estimatedAnnualIncome > 11600 ? 12 : 10;
          
          const estimatedTax = totalFederalWithheld > 0 ? totalFederalWithheld : estimatedAnnualIncome * 0.22;
          const effectiveRate = estimatedAnnualIncome > 0 ? (estimatedTax / estimatedAnnualIncome) * 100 : 0;
          
          taxData = {
            taxYear: new Date().getFullYear(),
            totalIncome: estimatedAnnualIncome,
            agi: estimatedAnnualIncome,
            taxableIncome: Math.max(0, estimatedAnnualIncome - 14600), // Standard deduction
            totalFederalTax: estimatedTax,
            effectiveTaxRate: effectiveRate,
            marginalTaxBracket: marginalBracket,
            filingStatus: 'single',
            incomeBreakdown: {
              wages: estimatedAnnualIncome,
              dividends: 0,
              capitalGains: 0,
              business: 0,
              other: 0,
            },
            currentDeductions: {
              type: 'standard',
              amount: 14600,
            },
            insights: [],
            isEstimated: true, // Flag to indicate this is estimated from paystubs
          };
        }
      }
      
      res.json({ 
        taxData,
        taxReturns,
        documentCount: documents.length,
        hasAnalyzedDocuments: completedDocs.length > 0,
      });
    } catch (error) {
      console.error("Error fetching tax data:", error);
      res.status(500).json({ message: "Failed to fetch tax data" });
    }
  });

  app.get('/api/tax-intel/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getFinancialDocuments(userId);
      
      res.json({
        documents: documents.map(doc => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt,
          status: doc.extractionStatus,
        }))
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/tax-intel/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      console.log('Upload request received:', {
        userId,
        hasFile: !!file,
        fileName: file?.originalname,
        fileSize: file?.size,
        mimeType: file?.mimetype
      });
      
      if (!file) {
        return res.status(400).json({ 
          message: "No file uploaded. Please select a file and try again.",
          code: "NO_FILE"
        });
      }

      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          message: "File too large. Maximum size is 10MB.",
          code: "FILE_TOO_LARGE"
        });
      }

      const documentType = req.body.documentType || 'tax_return';
      const documentYear = req.body.documentYear ? parseInt(req.body.documentYear) : new Date().getFullYear() - 1;

      const docRecord = await storage.createFinancialDocument({
        userId,
        documentType,
        documentYear,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        extractionStatus: 'processing',
      });

      let extractedData: any = {};
      let rawText = '';

      try {
        if (file.mimetype === 'application/pdf') {
          rawText = await parsePdfDocument(file.buffer);
          
          // Use appropriate parser based on document type
          if (documentType === 'paystub') {
            extractedData = extractPaystubDataFromText(rawText);
            console.log('Paystub extraction result:', extractedData);
          } else if (documentType === 'w2') {
            extractedData = extractW2DataFromText(rawText);
            console.log('W-2 extraction result:', extractedData);
          } else {
            // Default to tax return parser for 1040, 1099, etc
            extractedData = extractTaxDataFromText(rawText);
            console.log('Tax return extraction result:', {
              taxYear: extractedData.taxYear,
              totalIncome: extractedData.totalIncome,
              extractedLinesCount: Object.keys(extractedData.extractedLines || {}).length
            });
          }
        } else {
          return res.status(400).json({ 
            message: "Image OCR support coming soon. Please upload a PDF for now." 
          });
        }

        await storage.updateFinancialDocument(docRecord.id, {
          extractedData: { ...extractedData, rawText: rawText.substring(0, 10000) },
          extractionStatus: 'completed',
        });

        if (documentType === 'tax_return' && extractedData.totalIncome) {
          await storage.createTaxReturn({
            userId,
            documentId: docRecord.id,
            taxYear: extractedData.taxYear || documentYear,
            wagesIncome: extractedData.wagesIncome?.toString(),
            interestIncome: extractedData.interestIncome?.toString(),
            dividendIncome: extractedData.dividendIncome?.toString(),
            qualifiedDividends: extractedData.qualifiedDividends?.toString(),
            capitalGainsLongTerm: extractedData.capitalGainsLongTerm?.toString(),
            businessIncome: extractedData.businessIncome?.toString(),
            totalIncome: extractedData.totalIncome?.toString(),
            adjustmentsToIncome: extractedData.adjustmentsToIncome?.toString(),
            agi: extractedData.agi?.toString(),
            standardDeduction: extractedData.standardDeduction?.toString(),
            itemizedDeductions: extractedData.itemizedDeductions?.toString(),
            deductionUsed: extractedData.deductionUsed,
            taxableIncome: extractedData.taxableIncome?.toString(),
            totalFederalTax: extractedData.totalFederalTax?.toString(),
            stateTaxPaid: extractedData.stateTaxPaid?.toString(),
            effectiveTaxRate: extractedData.effectiveTaxRate?.toString(),
            marginalTaxBracket: extractedData.marginalTaxBracket?.toString(),
            filingStatus: extractedData.filingStatus,
          });
        }

        res.json({
          success: true,
          documentId: docRecord.id,
          extractedData: {
            taxYear: extractedData.taxYear,
            totalIncome: extractedData.totalIncome,
            agi: extractedData.agi,
            taxableIncome: extractedData.taxableIncome,
            totalFederalTax: extractedData.totalFederalTax,
            effectiveTaxRate: extractedData.effectiveTaxRate,
            marginalTaxBracket: extractedData.marginalTaxBracket,
            filingStatus: extractedData.filingStatus,
            extractedLines: extractedData.extractedLines,
          },
          message: "Document parsed successfully. AI now has access to your tax data.",
        });
      } catch (parseError) {
        console.error("Document parsing error:", parseError);
        await storage.updateFinancialDocument(docRecord.id, {
          extractionStatus: 'failed',
        });
        res.status(500).json({ message: "Failed to parse document. Please ensure it's a valid tax return PDF." });
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.post('/api/tax-intel/query', aiLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      const documents = await storage.getFinancialDocuments(userId);
      const completedDocs = documents.filter(d => d.extractionStatus === 'completed');

      if (completedDocs.length === 0) {
        return res.json({
          answer: "You haven't uploaded any financial documents yet. Upload your tax return, W-2, 1099, or paystub to get started.",
          citations: [],
          hasDocuments: false,
        });
      }

      const latestDoc = completedDocs[0];
      const extractedData = latestDoc.extractedData as any;
      const rawText = extractedData?.rawText || '';
      
      // Combine text from all documents for comprehensive context
      const allDocsText = completedDocs
        .map(d => (d.extractedData as any)?.rawText || '')
        .join('\n\n--- Next Document ---\n\n')
        .substring(0, 15000);

      const searchResult = searchTaxDocument(rawText, question);

      if (searchResult.found) {
        res.json({
          answer: searchResult.answer,
          citations: searchResult.citations,
          hasDocuments: true,
          taxYear: extractedData?.taxYear,
        });
      } else {
        const context = buildContextPrompt(await buildFinancialContext(userId));
        
        const openaiResponse = await fetchApi(`${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { 
                role: 'system', 
                content: `You are a tax document assistant. The user has uploaded financial documents (tax returns, W-2s, 1099s, paystubs). Answer their question using the data provided. Always cite specific values when possible.

${context}

Uploaded documents (${completedDocs.length} total):
${allDocsText}`
              },
              { role: 'user', content: question }
            ],
            max_completion_tokens: 500,
          }),
        });

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const answer = data.choices[0]?.message?.content || "I couldn't find an answer to that question.";
          
          res.json({
            answer,
            citations: [],
            hasDocuments: true,
            taxYear: extractedData?.taxYear,
          });
        } else {
          res.json({
            answer: searchResult.answer,
            citations: [],
            hasDocuments: true,
          });
        }
      }
    } catch (error) {
      console.error("Error querying documents:", error);
      res.status(500).json({ message: "Failed to query documents" });
    }
  });

  app.post('/api/tax-intel/analyze', aiLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { filename, documentType, documentId } = req.body;
      
      const docType = documentType || (filename?.toLowerCase().includes('w2') ? 'w2' : 
                                        filename?.toLowerCase().includes('paystub') ? 'paystub' : '1040');
      
      // CRITICAL: Fetch the actual extracted data from the uploaded document
      const documents = await storage.getFinancialDocuments(userId);
      const latestDoc = documentId 
        ? documents.find(d => d.id === documentId)
        : documents.filter(d => d.extractionStatus === 'completed')[0];
      
      const extractedData = (latestDoc?.extractedData as any) || {};
      
      console.log('Analyze - Using extracted data:', {
        docId: latestDoc?.id,
        docType: latestDoc?.documentType,
        hasGrossPay: !!extractedData.grossPay,
        hasNetPay: !!extractedData.netPay,
        hasFederalWithheld: !!extractedData.federalWithheld,
      });
      
      const profile = await storage.getFinancialProfile(userId);
      
      // Use extracted data if available, otherwise fall back to profile
      const actualGrossPay = extractedData.grossPay || extractedData.ytdGrossPay || null;
      const actualNetPay = extractedData.netPay || null;
      const actualFederalWithheld = extractedData.federalWithheld || extractedData.ytdFederalWithheld || null;
      const actualStateWithheld = extractedData.stateWithheld || extractedData.ytdStateTaxWithheld || null;
      
      // Estimate annual income from paystub data
      let estimatedAnnualIncome = profile?.annualIncome ? parseInt(profile.annualIncome) : 200000;
      if (actualGrossPay && actualGrossPay > 0) {
        // Assume bi-weekly (26 pay periods) if gross is under 15000, otherwise semi-monthly (24)
        const payPeriods = actualGrossPay < 15000 ? 26 : 24;
        estimatedAnnualIncome = Math.round(actualGrossPay * payPeriods);
      }
      
      const userContext = {
        income: estimatedAnnualIncome.toString(),
        state: profile?.stateOfResidence || 'CO',
        filing: profile?.filingStatus || 'single'
      };
      
      // Portfolio context removed - now focused on paycheck optimization
      
      const stateTaxRates: Record<string, { marginal: number, name: string, hasLocalTax: boolean }> = {
        'CA': { marginal: 13.3, name: 'California', hasLocalTax: false },
        'NY': { marginal: 10.9, name: 'New York', hasLocalTax: true },
        'NJ': { marginal: 10.75, name: 'New Jersey', hasLocalTax: false },
        'TX': { marginal: 0, name: 'Texas', hasLocalTax: false },
        'FL': { marginal: 0, name: 'Florida', hasLocalTax: false },
        'WA': { marginal: 0, name: 'Washington', hasLocalTax: false },
        'NV': { marginal: 0, name: 'Nevada', hasLocalTax: false },
        'IL': { marginal: 4.95, name: 'Illinois', hasLocalTax: true },
        'PA': { marginal: 3.07, name: 'Pennsylvania', hasLocalTax: true },
        'MA': { marginal: 9.0, name: 'Massachusetts', hasLocalTax: false },
        'CT': { marginal: 6.99, name: 'Connecticut', hasLocalTax: false },
        'CO': { marginal: 4.4, name: 'Colorado', hasLocalTax: false },
        'AZ': { marginal: 2.5, name: 'Arizona', hasLocalTax: false },
        'GA': { marginal: 5.49, name: 'Georgia', hasLocalTax: false },
        'NC': { marginal: 4.75, name: 'North Carolina', hasLocalTax: false },
        'VA': { marginal: 5.75, name: 'Virginia', hasLocalTax: false },
        'MD': { marginal: 5.75, name: 'Maryland', hasLocalTax: true },
        'OR': { marginal: 9.9, name: 'Oregon', hasLocalTax: true },
        'MN': { marginal: 9.85, name: 'Minnesota', hasLocalTax: false },
        'HI': { marginal: 11.0, name: 'Hawaii', hasLocalTax: false },
      };
      
      const stateInfo = stateTaxRates[userContext.state] || { marginal: 5.0, name: userContext.state, hasLocalTax: false };
      
      // Get raw text from document for AI fallback
      const rawDocText = extractedData.rawText || '';
      const hasStructuredData = actualGrossPay && actualGrossPay > 0;
      
      // Build actual paycheck data string for the AI
      const actualPaycheckData = hasStructuredData ? `
ACTUAL DATA FROM UPLOADED DOCUMENT:
- Gross Pay (per paycheck): $${actualGrossPay?.toLocaleString() || 'unknown'}
- Net Pay (per paycheck): $${actualNetPay?.toLocaleString() || 'unknown'}
- Federal Tax Withheld: $${actualFederalWithheld?.toLocaleString() || 'unknown'}
- State Tax Withheld: $${actualStateWithheld?.toLocaleString() || 'unknown'}
- 401k Contribution: $${extractedData.retirement401k?.toLocaleString() || extractedData.preTaxDeductions?.retirement401k?.toLocaleString() || 'not detected'}
- HSA Contribution: $${extractedData.hsaContribution?.toLocaleString() || extractedData.preTaxDeductions?.hsa?.toLocaleString() || 'not detected'}
- Estimated Annual Income: $${estimatedAnnualIncome.toLocaleString()}

USE THESE ACTUAL NUMBERS in your analysis. Do not make up different values.
` : `
STRUCTURED EXTRACTION FAILED - Please extract data from the raw document text below.
Look for: gross pay, net pay, federal withholding, state withholding, 401k deductions, HSA deductions.
Estimated Annual Income (from profile): $${userContext.income}

RAW DOCUMENT TEXT (first 3000 chars):
${rawDocText.substring(0, 3000)}
`;

      // Determine pay periods (bi-weekly = 26, semi-monthly = 24)
      const payPeriods = actualGrossPay && actualGrossPay < 8000 ? 26 : 24;
      
      const systemPrompt = `You are a paycheck optimization specialist. The user uploaded their W-2 or paystub. Your ONLY job: help them keep more of each paycheck.

DOCUMENT TYPE: ${docType.toUpperCase()}
USER STATE: ${stateInfo.name} (${userContext.state})
FILING STATUS: ${userContext.filing}
PAY FREQUENCY: ${payPeriods === 26 ? 'Bi-weekly (26 paychecks/year)' : 'Semi-monthly (24 paychecks/year)'}
${actualPaycheckData}

CRITICAL: All currentAmount and suggestedAmount values MUST be PER PAYCHECK amounts, not annual amounts!
- 401k annual limit is $23,500 = $${Math.round(23500/payPeriods)} per paycheck (${payPeriods} pay periods)
- HSA annual limit is $4,150 individual = $${Math.round(4150/payPeriods)} per paycheck
- FSA annual limit is $3,200 = $${Math.round(3200/payPeriods)} per paycheck

Based on this data, identify:
1. Current withholding (federal, state, FICA)
2. Pre-tax deductions they're using (401k, HSA, FSA, etc.)
3. Pre-tax deductions they're NOT using but could

Return JSON:
{
  "documentType": "${docType}",
  "taxYear": 2024,
  "currentPaycheck": {
    "grossPay": [number - from uploaded doc],
    "netPay": [number - from uploaded doc],
    "federalWithheld": [number],
    "stateWithheld": [number],
    "fica": [number],
    "preTaxDeductions": {
      "retirement401k": [number per paycheck],
      "hsa": [number per paycheck],
      "fsa": [number per paycheck],
      "other": [number per paycheck]
    }
  },
  "optimizations": [
    {
      "action": "[Clear action title - e.g., 'Increase 401k contribution']",
      "currentAmount": [MUST be per-paycheck amount, e.g., 500 not 13000],
      "suggestedAmount": [MUST be per-paycheck amount, e.g., 904 not 23500],
      "extraPerPaycheck": [difference between suggested and current],
      "taxSavingsPerYear": [annual tax savings from this optimization],
      "howToFix": "[Exact step-by-step instructions]",
      "priority": "high|medium|low"
    }
  ],
  "totalExtraPerYear": [sum of all taxSavingsPerYear],
  "summaryText": "[e.g., 'By maxing your 401k and starting an HSA, you could save $X per year in taxes.']",
  "totalIncome": ${estimatedAnnualIncome},
  "effectiveTaxRate": [calculated effective rate as percentage, e.g., 22.0],
  "marginalTaxBracket": [federal marginal bracket, e.g., 32 or 35]
}

COMMON OPTIMIZATIONS TO CHECK:
1. 401k: Max is $23,500/year = $${Math.round(23500/payPeriods)}/paycheck. If current contribution is less, suggest increasing.
2. HSA: Max is $4,150/year = $${Math.round(4150/payPeriods)}/paycheck (if on HDHP). Tax savings = contribution × marginal rate.
3. FSA: Max is $3,200/year = $${Math.round(3200/payPeriods)}/paycheck for healthcare.
4. W-4 withholding: If overwithholding, suggest adjusting to get more per paycheck.

RULES:
- ALL amounts in currentAmount/suggestedAmount MUST be per-paycheck, NOT annual
- taxSavingsPerYear = (suggestedAmount - currentAmount) × ${payPeriods} × marginalRate
- Be specific with dollar amounts
- Prioritize by impact (biggest savings first)`;

      const openaiResponse = await fetchApi(`${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate tax metrics and insights for analysis.' }
          ],
          max_completion_tokens: 1000,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let taxData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          taxData = JSON.parse(jsonMatch[0]);
          
          // VALIDATION: Fix any per-paycheck amounts that look like annual amounts
          if (taxData.optimizations && Array.isArray(taxData.optimizations)) {
            const annualLimits: Record<string, number> = {
              '401k': 23500,
              '401': 23500,
              'hsa': 4150,
              'fsa': 3200,
              'ira': 7000,
            };
            
            taxData.optimizations = taxData.optimizations.map((opt: any) => {
              // Check if suggestedAmount looks like an annual amount
              for (const [keyword, annualLimit] of Object.entries(annualLimits)) {
                if (opt.action?.toLowerCase().includes(keyword)) {
                  // If suggestedAmount is close to annual limit, convert to per-paycheck
                  if (opt.suggestedAmount >= annualLimit * 0.8 && opt.suggestedAmount <= annualLimit * 1.2) {
                    console.log(`Fixing ${opt.action}: ${opt.suggestedAmount} looks like annual, converting to per-paycheck`);
                    opt.suggestedAmount = Math.round(annualLimit / payPeriods);
                  }
                  // Same check for currentAmount
                  if (opt.currentAmount >= annualLimit * 0.8 && opt.currentAmount <= annualLimit * 1.2) {
                    opt.currentAmount = Math.round(annualLimit / payPeriods);
                  }
                  break;
                }
              }
              
              // Recalculate tax savings if amounts were fixed
              const marginalRate = taxData.marginalTaxBracket ? taxData.marginalTaxBracket / 100 : 0.32;
              const annualContributionIncrease = (opt.suggestedAmount - opt.currentAmount) * payPeriods;
              opt.taxSavingsPerYear = Math.round(annualContributionIncrease * marginalRate);
              opt.extraPerPaycheck = opt.suggestedAmount - opt.currentAmount;
              
              return opt;
            });
            
            // Recalculate total
            taxData.totalExtraPerYear = taxData.optimizations.reduce(
              (sum: number, opt: any) => sum + (opt.taxSavingsPerYear || 0), 
              0
            );
          }
        }
      } catch (parseErr) {
        console.error("Failed to parse AI response as JSON:", parseErr);
      }
      
      // If no valid taxData from AI, create fallback based on profile
      if (!taxData) {
        const estimatedIncome = parseInt(userContext.income) || 200000;
        const estimatedTax = Math.round(estimatedIncome * 0.22);
        taxData = {
          taxYear: 2024,
          totalIncome: estimatedIncome,
          agi: Math.round(estimatedIncome * 0.9),
          taxableIncome: Math.round(estimatedIncome * 0.78),
          totalFederalTax: estimatedTax,
          effectiveTaxRate: 22,
          marginalTaxBracket: 24,
          filingStatus: userContext.filing || "single",
          incomeBreakdown: {
            wages: estimatedIncome,
            dividends: 0,
            capitalGains: 0,
            business: 0,
            other: 0
          },
          insights: [
            {
              type: "upload_more",
              severity: "info",
              title: "Upload your paystub for personalized insights",
              description: "We couldn't fully extract data from your document. Try uploading a clearer PDF or a recent paystub to get specific optimization recommendations.",
              potentialImpact: 0
            }
          ],
          optimizations: []
        };
      }

      await storage.createTaxReturn({
        userId,
        taxYear: taxData.taxYear,
        totalIncome: taxData.totalIncome.toString(),
        agi: taxData.agi.toString(),
        totalFederalTax: taxData.totalFederalTax.toString(),
        filingStatus: taxData.filingStatus.toLowerCase().replace(/ /g, '_'),
      });

      res.json({ taxData });
    } catch (error) {
      console.error("Error analyzing tax return:", error);
      res.status(500).json({ message: "Failed to analyze tax return" });
    }
  });

  app.get('/api/tax-intel/scenarios', isAuthenticated, async (_req: any, res) => {
    try {
      res.json({ scenarios: [] });
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ message: "Failed to fetch scenarios" });
    }
  });

  app.post('/api/tax-intel/run-scenario', aiLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const { scenarioType, inputs } = req.body;

      const scenarioNames: Record<string, string> = {
        'gain_realization': 'Capital Gain Realization',
        'charitable_giving': 'Charitable Giving Strategy',
        'retirement_contribution': 'Retirement Contribution',
        'income_change': 'Income Change Impact',
      };

      const systemPrompt = `Calculate the tax impact of a ${scenarioType} scenario.

Scenario inputs: ${JSON.stringify(inputs)}

Assume a baseline of:
- AGI: $205,000
- Current federal tax: $35,500
- Marginal bracket: 24%
- Filing status: Married Filing Jointly

Calculate the impact on:
1. New total federal tax
2. Tax change (positive = more tax, negative = savings)
3. New effective tax rate

Return JSON: { "newTax": number, "taxDelta": number, "effectiveRate": number }`;

      const openaiResponse = await fetchApi(`${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Calculate the tax impact.' }
          ],
          max_completion_tokens: 300,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let results;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        results = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        results = { newTax: 36500, taxDelta: 1000, effectiveRate: 17.8 };
      }

      const scenario = {
        id: Date.now(),
        name: scenarioNames[scenarioType] || 'Custom Scenario',
        type: scenarioType,
        inputs,
        results,
      };

      res.json({ scenario });
    } catch (error) {
      console.error("Error running scenario:", error);
      res.status(500).json({ message: "Failed to run scenario" });
    }
  });
}

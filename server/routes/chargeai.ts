import type { Express, RequestHandler } from "express";
import { storage } from "../storage";
import { buildFinancialContext, buildContextPrompt } from "../documentContext";
import { aiLimiter, expensiveLimiter } from "../middleware/rateLimit";

const fetchApi = globalThis.fetch;

// Simple in-memory cache for proactive analysis (24h TTL)
const proactiveAnalysisCache = new Map<string, { analysis: any; generatedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function registerChargeAIRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get('/api/charge-ai/context', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const profile = await storage.getFinancialProfile(userId);
      const taxReturnsData = await storage.getTaxReturns(userId);
      const positions = await storage.getPortfolioPositions(userId);
      const liquidityProfile = await storage.getLiquidityProfile(userId);
      const documents = await storage.getFinancialDocuments(userId);
      
      const hasTaxData = taxReturnsData.length > 0;
      const hasPositions = positions.length > 0;
      const hasProfile = !!profile && (profile.annualIncome || profile.filingStatus);
      const hasLiquidity = !!liquidityProfile;
      const hasAnalyzedDocuments = documents.some(d => d.extractionStatus === 'completed');
      
      res.json({
        hasTaxData,
        hasPositions,
        hasProfile,
        hasLiquidity,
        hasAnalyzedDocuments,
        documentCount: documents.length,
        taxYears: taxReturnsData.map(t => t.taxYear),
        positionCount: positions.length,
        lastUpdated: new Date().toISOString(),
        profile: profile ? {
          annualIncome: profile.annualIncome ? Number(profile.annualIncome) : null,
          filingStatus: profile.filingStatus,
          stateOfResidence: profile.stateOfResidence,
          primaryGoal: profile.primaryGoal,
          monthlyExpenses: liquidityProfile?.monthlyEssentialExpenses ? Number(liquidityProfile.monthlyEssentialExpenses) : null,
          currentCash: liquidityProfile?.currentCash ? Number(liquidityProfile.currentCash) : null,
          targetReserveMonths: liquidityProfile?.targetReserveMonths || 6,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching context:", error);
      res.status(500).json({ message: "Failed to fetch context" });
    }
  });

  app.post('/api/charge-ai/chat', aiLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, conversationHistory } = req.body;

      const financialContext = await buildFinancialContext(userId);
      const dataContext = buildContextPrompt(financialContext);

      const liquidityProfile = await storage.getLiquidityProfile(userId);
      
      let additionalContext = '';
      if (liquidityProfile) {
        additionalContext += `\n\nCASH FLOW/LIQUIDITY:`;
        additionalContext += `\n- Monthly Expenses: $${Number(liquidityProfile.monthlyEssentialExpenses).toLocaleString()}`;
        additionalContext += `\n- Current Cash: $${Number(liquidityProfile.currentCash).toLocaleString()}`;
        additionalContext += `\n- Target Reserve: ${liquidityProfile.targetReserveMonths} months`;
      }

      const systemPrompt = `You are Charge AI, a private decision-support CFO for high-net-worth individuals. You are NOT a generic chatbot.

IDENTITY & ROLE:
- You function as a decision-support CFO, helping users think through financial decisions
- You reason ONLY from the user's actual uploaded data - NEVER make assumptions about their financial situation
- You explain conclusions using clear math, explicit assumptions, and quantified tradeoffs
- You proactively identify second-order consequences: tax impact, liquidity stress, concentration risk, timing risk

CRITICAL DATA REQUIREMENT:
- If a user asks a question that requires specific financial data (income, tax brackets, portfolio values, etc.) and that data is NOT PROVIDED, you MUST:
  1. Clearly state what data is missing
  2. Explain why that data is needed for an accurate answer
  3. Direct them to update their profile or upload the required information
  4. DO NOT provide calculations using assumed/hypothetical numbers
  5. DO NOT say "assuming you earn $X" or "if your income is $Y" - this is NOT allowed

WHAT YOU CAN ANSWER WITHOUT DATA:
- General educational questions about tax concepts, investment principles, financial planning strategies
- Explanations of how something works (e.g., "How does capital gains tax work?")
- Framework-level guidance (e.g., "What factors should I consider when...")

WHAT REQUIRES DATA:
- Any specific tax calculation ("How much tax would I pay on...")
- Any portfolio analysis ("Should I sell this position...")
- Any income-based recommendation ("Am I maxing out my 401k contribution...")
- Any cash flow or liquidity analysis

COMMUNICATION STYLE:
- Professional, direct, and substantive
- Use specific numbers ONLY from their actual data
- Structure complex responses with clear sections
- Never provide wishy-washy general advice when specifics are needed

${dataContext}
${additionalContext}

OUTPUT FORMAT FOR COMPLEX ANALYSIS (only when data is available):
1. Summary recommendation (1-2 sentences)
2. Key data points used from their profile
3. The math/analysis
4. Tradeoffs to consider
5. Second-order effects (tax, liquidity, etc.)
6. Questions to explore further`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []),
        { role: 'user', content: message }
      ];

      const openaiResponse = await fetchApi(`${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_completion_tokens: 1000,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      res.json({ 
        response: assistantMessage,
        citations: []
      });
    } catch (error) {
      console.error("Error in Charge AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.post('/api/charge-ai/generate-memo', aiLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const { messages } = req.body;

      const systemPrompt = `Based on the conversation provided, generate a concise planning memo. The memo should:
1. Have a clear, specific title summarizing the decision or analysis
2. Include a 2-3 sentence summary of the key conclusion
3. List the key assumptions made
4. Note any important tradeoffs discussed
5. Include action items or next steps

Format the output as JSON with these fields: title, summary, keyFindings (array), assumptions (array), tradeoffs (array)`;

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
            { role: 'user', content: `Generate a planning memo from this conversation: ${JSON.stringify(messages)}` }
          ],
          max_completion_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let memo: any = null;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          memo = JSON.parse(jsonMatch[0]);
        } catch {
          // JSON parse failed
        }
      }
      
      if (!memo || !memo.title) {
        const lines = content.split('\n').filter((l: string) => l.trim());
        const firstLine = lines[0] || 'Planning Session Summary';
        const title = firstLine.replace(/^#+\s*/, '').replace(/\*+/g, '').slice(0, 100);
        
        memo = {
          title: title || 'Planning Session Summary',
          summary: content.slice(0, 300),
          keyFindings: [],
          assumptions: [],
          tradeoffs: [],
        };
      }

      memo.id = Date.now();
      memo.createdAt = new Date().toISOString();

      res.json({ memo });
    } catch (error) {
      console.error("Error generating memo:", error);
      res.status(500).json({ message: "Failed to generate memo" });
    }
  });

  app.get('/api/charge-ai/memos', isAuthenticated, async (_req: any, res) => {
    try {
      res.json({ memos: [] });
    } catch (error) {
      console.error("Error fetching memos:", error);
      res.status(500).json({ message: "Failed to fetch memos" });
    }
  });

  // Get chat history
  app.get('/api/charge-ai/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getChatSession(userId);
      
      if (session) {
        res.json({ 
          messages: session.messages || [],
          sessionId: session.id,
          lastUpdated: session.updatedAt
        });
      } else {
        res.json({ messages: [], sessionId: null });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Save chat history
  app.post('/api/charge-ai/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messages } = req.body;
      
      const existingSession = await storage.getChatSession(userId);
      
      if (existingSession) {
        await storage.updateChatSession(existingSession.id, messages);
      } else {
        await storage.createChatSession({ userId, messages });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving chat history:", error);
      res.status(500).json({ message: "Failed to save chat history" });
    }
  });

  // Clear chat history
  app.delete('/api/charge-ai/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingSession = await storage.getChatSession(userId);
      
      if (existingSession) {
        await storage.updateChatSession(existingSession.id, []);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });

  // Get consolidated financial data (for "My Financial Data" panel)
  app.get('/api/charge-ai/my-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [profile, positions, taxReturns, liquidity, documents] = await Promise.all([
        storage.getFinancialProfile(userId),
        storage.getPortfolioPositions(userId),
        storage.getTaxReturns(userId),
        storage.getLiquidityProfile(userId),
        storage.getFinancialDocuments(userId)
      ]);
      
      const portfolioValue = positions?.reduce((sum, p) => sum + (parseFloat(String(p.currentValue)) || 0), 0) || 0;
      
      res.json({
        profile: profile ? {
          annualIncome: profile.annualIncome ? Number(profile.annualIncome) : null,
          incomeType: profile.incomeType,
          filingStatus: profile.filingStatus,
          stateOfResidence: profile.stateOfResidence,
          dependents: profile.dependents,
          primaryGoal: profile.primaryGoal,
          riskTolerance: profile.riskTolerance,
        } : null,
        portfolio: {
          totalValue: portfolioValue,
          positionCount: positions?.length || 0,
          positions: positions?.map(p => ({
            symbol: p.symbol,
            shares: p.shares,
            currentValue: p.currentValue,
          })) || []
        },
        tax: taxReturns?.[0] ? {
          year: taxReturns[0].taxYear,
          agi: taxReturns[0].agi ? Number(taxReturns[0].agi) : null,
          totalTax: taxReturns[0].totalFederalTax ? Number(taxReturns[0].totalFederalTax) : null,
          filingStatus: taxReturns[0].filingStatus,
        } : null,
        liquidity: liquidity ? {
          monthlyExpenses: liquidity.monthlyEssentialExpenses ? Number(liquidity.monthlyEssentialExpenses) : null,
          currentCash: liquidity.currentCash ? Number(liquidity.currentCash) : null,
          targetReserveMonths: liquidity.targetReserveMonths,
        } : null,
        documents: documents?.map(d => ({
          id: d.id,
          type: d.documentType,
          fileName: d.fileName,
          status: d.extractionStatus,
          uploadedAt: d.uploadedAt,
        })) || [],
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
      res.status(500).json({ message: "Failed to fetch financial data" });
    }
  });

  app.get('/api/charge-ai/proactive-analysis', expensiveLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const forceRefresh = req.query.refresh === 'true';
      
      // Check cache first (unless force refresh)
      const cached = proactiveAnalysisCache.get(userId);
      if (cached && !forceRefresh && (Date.now() - cached.generatedAt < CACHE_TTL_MS)) {
        return res.json({
          hasAnalysis: true,
          analysis: cached.analysis,
          generatedAt: new Date(cached.generatedAt).toISOString(),
          cached: true
        });
      }
      
      const [profile, positions, taxReturns, liquidity] = await Promise.all([
        storage.getFinancialProfile(userId),
        storage.getPortfolioPositions(userId),
        storage.getTaxReturns(userId),
        storage.getLiquidityProfile(userId)
      ]);
      
      const hasData = profile || (positions && positions.length > 0) || (taxReturns && taxReturns.length > 0);
      
      if (!hasData) {
        return res.json({
          hasAnalysis: false,
          message: "Complete your profile to receive personalized insights"
        });
      }
      
      const portfolioValue = positions?.reduce((sum, p) => sum + (parseFloat(String(p.currentValue)) || 0), 0) || 0;
      const holdings = positions?.map(p => `${p.symbol}: $${p.currentValue}`).join(', ') || 'None';
      const taxInfo = taxReturns?.[0] ? `AGI: $${taxReturns[0].agi}, Tax: $${taxReturns[0].totalFederalTax}` : 'No tax data';
      
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const currentYear = currentDate.getFullYear();
      
      const systemPrompt = `You are a no-nonsense CFO. Cut the fluff. Lead with money. Be direct.

DATE: ${dateStr} | TAX YEAR: ${currentYear}

USER DATA:
- Income: $${profile?.annualIncome || 'unknown'} | State: ${profile?.stateOfResidence || 'unknown'} | Goal: ${profile?.primaryGoal || 'wealth building'}
- Portfolio: $${portfolioValue.toLocaleString()} (${holdings})
- Tax: ${taxInfo}
- Monthly burn: $${liquidity?.monthlyEssentialExpenses || 'unknown'}

Generate JSON. TONE: Confident, direct, zero filler. Never say "Hi there" or "let's tackle things strategically." Lead with the dollar impact.

{
  "greeting": "[ONE sentence. Lead with what they're leaving on the table or what needs attention. Example: 'You're leaving $6k-12k on the table this year. Here's how to fix that.']",
  "urgentActions": [
    {
      "title": "[Action verb + specific thing. Example: 'Max your 401(k)' not 'Evaluate Opportunities for Retirement Account Contributions']",
      "why": "[1-2 sentences max. Plain English. No jargon.]",
      "impact": "[Dollar range. Be specific. Example: '$5k-8k federal tax savings']",
      "deadline": "[Date or 'Now' or 'Before Dec 31']",
      "steps": ["[Short action. 5-10 words max per step]"]
    }
  ],
  "weeklyCheckIn": {
    "portfolioStatus": "[1 sentence. Include a number.]",
    "taxStatus": "[1 sentence. What's the opportunity or risk?]",
    "cashFlowStatus": "[1 sentence. Are they good or not?]"
  },
  "bigPictureInsight": "[2 sentences MAX. The one thing that matters most given their situation. Be blunt.]",
  "questionsToConsider": ["[Skip this - leave empty array]"],
  "nextSteps": {
    "thisWeek": "[One specific action, 10 words max]",
    "thisMonth": "[One specific action, 10 words max]",
    "thisQuarter": "[One specific action, 10 words max]"
  }
}

RULES:
- NEVER use "Hi there", "Let's", "strategically", "align with your priorities"
- NEVER explain what something is - they know. Just tell them what to DO.
- Action titles: verb first, specific, under 8 words
- Steps: 3 max, each under 10 words
- Lead every section with the most important thing
- If you don't have data for something, skip it entirely`;

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
            { role: 'user', content: 'Generate proactive CFO insights for this user' }
          ],
          max_completion_tokens: 1500,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let analysis;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        analysis = null;
      }

      // Cache the result
      if (analysis) {
        proactiveAnalysisCache.set(userId, {
          analysis,
          generatedAt: Date.now()
        });
      }

      res.json({ 
        hasAnalysis: !!analysis, 
        analysis,
        generatedAt: new Date().toISOString(),
        cached: false
      });
    } catch (error) {
      console.error("Error generating proactive analysis:", error);
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });

  // Invalidate cache when user updates their data
  app.post('/api/charge-ai/invalidate-cache', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    proactiveAnalysisCache.delete(userId);
    res.json({ success: true });
  });

  app.post('/api/charge-ai/generate-recap', expensiveLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period } = req.body;
      
      const [user, profile, positions] = await Promise.all([
        storage.getUser(userId),
        storage.getFinancialProfile(userId),
        storage.getPortfolioPositions(userId)
      ]);
      
      const portfolioValue = positions?.reduce((sum, p) => sum + (parseFloat(String(p.currentValue)) || 0), 0) || 0;
      const holdings = positions?.map(p => `${p.symbol}: $${p.currentValue}`).join(', ') || 'None';
      
      const systemPrompt = `Generate a ${period} financial recap email for a high-net-worth individual. This should be a comprehensive summary they can read in 3 minutes.

USER DATA:
- Name: ${user?.firstName || 'there'}
- Income: $${profile?.annualIncome || 'unknown'}
- Portfolio: $${portfolioValue.toLocaleString()}
- Holdings: ${holdings}
- Goal: ${profile?.primaryGoal || 'wealth building'}

Generate a JSON response:
{
  "subject": "[Compelling email subject line]",
  "greeting": "[Personal greeting]",
  "executiveSummary": "[3-4 sentences - the TL;DR of their financial week/month]",
  "portfolioSection": {
    "headline": "[Portfolio performance headline]",
    "details": "[2-3 sentences on portfolio status]",
    "action": "[One specific action to consider]"
  },
  "taxSection": {
    "headline": "[Tax-related headline]",
    "details": "[2-3 sentences on tax opportunities]",
    "action": "[One specific action to consider]"
  },
  "upcomingDeadlines": [
    {
      "date": "[Date]",
      "item": "[What's due]",
      "action": "[What to do]"
    }
  ],
  "weekAheadFocus": "[What they should focus on in the coming ${period === 'weekly' ? 'week' : 'month'}]",
  "motivationalClose": "[Encouraging closing that reinforces their progress]",
  "ctaButton": {
    "text": "[Button text like 'Review Your Dashboard']",
    "action": "[What clicking does]"
  }
}

Write in a professional but warm tone. Be specific with numbers. Make it feel like a personal CFO update.`;

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
            { role: 'user', content: `Generate the ${period} recap email` }
          ],
          max_completion_tokens: 1200,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let recap;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        recap = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        recap = null;
      }

      res.json({ 
        recap,
        userEmail: user?.email,
        period,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error generating recap:", error);
      res.status(500).json({ message: "Failed to generate recap" });
    }
  });
}

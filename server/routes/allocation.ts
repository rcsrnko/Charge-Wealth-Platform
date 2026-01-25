import type { Express, RequestHandler } from "express";
import { storage } from "../storage";
import { getMultipleQuotes, getHistoricalPrices } from "../marketDataService";

const fetchApi = globalThis.fetch;

export function registerAllocationRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get('/api/allocation/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const positions = await storage.getPortfolioPositions(userId);
      
      if (!positions || positions.length === 0) {
        return res.json({
          portfolio: {
            totalValue: 0,
            positions: [],
            allocation: { equity: 0, fixedIncome: 0, cash: 0, alternatives: 0 },
            riskMetrics: { concentrationRisk: 0, topHoldingWeight: 0, taxExposure: 0 },
            lastUpdated: new Date(),
          }
        });
      }

      const symbols = positions.map(p => p.symbol);
      const quotes = await getMultipleQuotes(symbols);
      
      const enrichedPositions = await Promise.all(positions.map(async (position) => {
        const quote = quotes.get(position.symbol);
        const shares = parseFloat(String(position.shares)) || 0;
        const costBasis = parseFloat(String(position.costBasis)) || 0;
        
        let currentPrice = quote?.price || parseFloat(String(position.currentPrice)) || costBasis;
        let currentValue = shares * currentPrice;
        let unrealizedGain = currentValue - (costBasis * shares);
        let unrealizedGainPercent = costBasis > 0 ? ((currentPrice - costBasis) / costBasis) * 100 : 0;
        
        if (quote) {
          await storage.updatePortfolioPositionPrice(
            position.id,
            userId,
            currentPrice,
            currentValue,
            unrealizedGain,
            unrealizedGainPercent
          );
        }
        
        return {
          ...position,
          currentPrice,
          currentValue,
          unrealizedGain,
          unrealizedGainPercent,
          priceChange: quote?.change || 0,
          priceChangePercent: quote?.changePercent || 0,
          volume: quote?.volume || 0,
          dayHigh: quote?.high || 0,
          dayLow: quote?.low || 0,
          source: quote?.source || 'cached',
          lastUpdated: quote?.lastUpdated || position.lastUpdated,
        };
      }));

      const totalValue = enrichedPositions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
      
      const allocation = {
        equity: 0,
        fixedIncome: 0,
        cash: 0,
        alternatives: 0,
      };
      
      enrichedPositions.forEach(p => {
        const weight = totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0;
        const assetClass = p.assetClass || 'equity';
        if (assetClass === 'equity') allocation.equity += weight;
        else if (assetClass === 'fixed_income') allocation.fixedIncome += weight;
        else if (assetClass === 'cash') allocation.cash += weight;
        else allocation.alternatives += weight;
      });

      const sortedByValue = [...enrichedPositions].sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
      const topHoldingWeight = totalValue > 0 && sortedByValue[0] 
        ? (sortedByValue[0].currentValue / totalValue) * 100 
        : 0;
      
      const top3Weight = totalValue > 0
        ? sortedByValue.slice(0, 3).reduce((sum, p) => sum + (p.currentValue || 0), 0) / totalValue * 100
        : 0;

      const totalUnrealizedGain = enrichedPositions.reduce((sum, p) => sum + (p.unrealizedGain || 0), 0);
      
      res.json({
        portfolio: {
          totalValue,
          totalUnrealizedGain,
          positions: enrichedPositions,
          allocation,
          riskMetrics: {
            concentrationRisk: top3Weight > 50 ? 'high' : top3Weight > 30 ? 'medium' : 'low',
            topHoldingWeight,
            top3Weight,
            taxExposure: totalUnrealizedGain > 0 ? totalUnrealizedGain * 0.20 : 0,
          },
          lastUpdated: new Date(),
        }
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.get('/api/allocation/history/:symbol', isAuthenticated, async (req: any, res) => {
    try {
      const { symbol } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      
      const history = await getHistoricalPrices(symbol, days);
      res.json({ symbol, days, history });
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  app.post('/api/allocation/positions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { symbol, shares, costBasis } = req.body;
      
      if (!symbol || !shares) {
        return res.status(400).json({ message: "Symbol and shares are required" });
      }
      
      const position = await storage.createPortfolioPosition({
        userId,
        symbol: symbol.toUpperCase(),
        shares: parseFloat(shares),
        costBasis: costBasis ? parseFloat(costBasis) : null,
        accountType: 'brokerage',
        purchaseDate: new Date(),
      });
      
      res.json({ success: true, position });
    } catch (error) {
      console.error("Error adding position:", error);
      res.status(500).json({ message: "Failed to add position" });
    }
  });

  app.post('/api/allocation/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { symbol } = req.body;
      
      const [profile, positions] = await Promise.all([
        storage.getFinancialProfile(userId),
        storage.getPortfolioPositions(userId)
      ]);
      
      const portfolioContext = positions?.map(p => `${p.symbol}: ${p.shares} shares @ $${p.costBasis}`).join(', ') || 'No positions yet';
      const profileContext = profile ? `Income: $${profile.annualIncome}, Goal: ${profile.primaryGoal}, Risk: ${profile.riskTolerance || 'moderate'}` : 'No profile data';

      const systemPrompt = `You are a CFA-level portfolio analyst providing detailed analysis with actionable insights.

USER CONTEXT:
- Profile: ${profileContext}
- Current Portfolio: ${portfolioContext}

CRITICAL: You are providing educational analysis, NOT investment advice. Help the user understand their position deeply.

Generate a JSON response:
{
  "symbol": "${symbol}",
  "thesis": "[3-4 paragraph detailed thesis covering: what this company/asset does, competitive positioning, recent performance trends, and how it fits in the user's portfolio context]",
  "detailedAnalysis": {
    "fundamentals": "[Key metrics: P/E, revenue growth, profit margins if applicable]",
    "technicals": "[Recent price action, support/resistance levels, momentum]",
    "sectorOutlook": "[Industry trends and headwinds/tailwinds]",
    "catalysts": "[Upcoming events that could move the price - earnings, product launches, etc.]"
  },
  "riskFactors": [
    { "factor": "[risk name]", "severity": "high|medium|low", "description": "[specific explanation with numbers if possible]" }
  ],
  "taxConsiderations": {
    "holdingPeriod": "Long-term (>1 year)" or "Short-term",
    "unrealizedGain": [estimated number],
    "taxImpact": "[specific tax implications including strategies to minimize]",
    "harvestingOpportunity": "[true/false and explanation if losses can be harvested]"
  },
  "profileFitScore": [1-100 score based on user's goals and risk tolerance],
  "profileFitNotes": "[specific explanation referencing user's stated goals]",
  "recommendations": {
    "action": "hold|trim|accumulate|exit",
    "reasoning": "[2-3 sentences explaining the rationale based on user's situation]",
    "targetAllocation": "[suggested % of portfolio for this position]"
  }
}

Be specific, use real data patterns, and connect analysis to the user's actual situation.`;

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
            { role: 'user', content: `Generate investment thesis for ${symbol}` }
          ],
          max_completion_tokens: 800,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let thesis;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        thesis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        thesis = {
          symbol,
          thesis: "Unable to generate thesis at this time. Please try again.",
          riskFactors: [],
          taxConsiderations: { holdingPeriod: "Unknown", unrealizedGain: 0, taxImpact: "Unknown" },
          profileFitScore: 50,
          profileFitNotes: "Unable to assess fit without more data."
        };
      }

      res.json({ thesis });
    } catch (error) {
      console.error("Error analyzing position:", error);
      res.status(500).json({ message: "Failed to analyze position" });
    }
  });

  app.post('/api/allocation/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [profile, positions] = await Promise.all([
        storage.getFinancialProfile(userId),
        storage.getPortfolioPositions(userId)
      ]);
      
      const portfolioValue = positions?.reduce((sum, p) => sum + (parseFloat(String(p.currentValue)) || 0), 0) || 0;
      const currentHoldings = positions?.map(p => {
        const value = parseFloat(String(p.currentValue)) || 0;
        const pct = portfolioValue > 0 ? (value / portfolioValue * 100).toFixed(1) : '0';
        return `${p.symbol}: $${value} (${pct}%)`;
      }).join('\n') || 'No current positions';
      
      const profileContext = profile ? {
        income: profile.annualIncome,
        goal: profile.primaryGoal || 'wealth building',
        risk: 'moderate',
        horizon: '10+ years'
      } : { income: 'unknown', goal: 'wealth building', risk: 'moderate', horizon: '10+ years' };

      const systemPrompt = `You are a portfolio strategist helping a high-net-worth individual optimize their portfolio. Based on their current situation, suggest specific investments to consider.

USER PROFILE:
- Annual Income: $${profileContext.income}
- Primary Goal: ${profileContext.goal}
- Risk Tolerance: ${profileContext.risk}
- Time Horizon: ${profileContext.horizon}
- Portfolio Value: $${portfolioValue.toLocaleString()}

CURRENT HOLDINGS:
${currentHoldings}

TASK: Suggest 5-7 specific investments (stocks, ETFs, or crypto) that could improve their portfolio. Consider:
1. Diversification gaps
2. Their stated goals and risk tolerance
3. Current market conditions
4. Tax efficiency
5. Sector balance

Generate a JSON response:
{
  "portfolioAssessment": {
    "strengths": ["[2-3 things they're doing well]"],
    "gaps": ["[2-3 areas for improvement]"],
    "riskLevel": "conservative|moderate|aggressive",
    "diversificationScore": [1-100]
  },
  "recommendations": [
    {
      "symbol": "[ticker symbol]",
      "name": "[company/fund name]",
      "type": "stock|etf|crypto|bond",
      "suggestedAllocation": "[X-Y% of portfolio]",
      "rationale": "[2-3 sentences explaining why this fits their situation - written in plain English]",
      "riskLevel": "low|medium|high",
      "expectedReturn": "[realistic range like 8-12% annually]",
      "taxEfficiency": "high|medium|low",
      "actionableSteps": ["[specific step 1]", "[specific step 2]"]
    }
  ],
  "overallStrategy": "[2-3 paragraph summary of the recommended approach, written conversationally as if explaining to a friend]"
}

IMPORTANT: 
- Use plain English, no jargon
- Be specific with ticker symbols
- Include a mix of asset types appropriate for their risk level
- Explain WHY each recommendation makes sense for THIS user`; 

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
            { role: 'user', content: 'Generate personalized portfolio recommendations' }
          ],
          max_completion_tokens: 2000,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let recommendations;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        recommendations = {
          portfolioAssessment: { strengths: [], gaps: ["Unable to analyze"], riskLevel: "moderate", diversificationScore: 50 },
          recommendations: [],
          overallStrategy: "Unable to generate recommendations at this time. Please try again."
        };
      }

      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.get('/api/price-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getPriceAlerts(userId);
      res.json({ alerts });
    } catch (error) {
      console.error("Error fetching price alerts:", error);
      res.status(500).json({ message: "Failed to fetch price alerts" });
    }
  });

  app.post('/api/price-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { symbol, alertType, targetPrice, percentThreshold } = req.body;
      
      if (!symbol || !alertType) {
        return res.status(400).json({ message: "Symbol and alert type are required" });
      }
      
      if (alertType === 'price_above' || alertType === 'price_below') {
        if (!targetPrice) {
          return res.status(400).json({ message: "Target price is required for price alerts" });
        }
      }
      
      if (alertType === 'percent_change' && !percentThreshold) {
        return res.status(400).json({ message: "Percent threshold is required for percent change alerts" });
      }
      
      const alert = await storage.createPriceAlert({
        userId,
        symbol: symbol.toUpperCase(),
        alertType,
        targetPrice: targetPrice ? targetPrice.toString() : null,
        percentThreshold: percentThreshold ? percentThreshold.toString() : null,
      });
      
      res.json({ success: true, alert });
    } catch (error) {
      console.error("Error creating price alert:", error);
      res.status(500).json({ message: "Failed to create price alert" });
    }
  });

  app.patch('/api/price-alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alertId = parseInt(req.params.id);
      const updates = req.body;
      
      const alert = await storage.updatePriceAlert(alertId, userId, updates);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json({ success: true, alert });
    } catch (error) {
      console.error("Error updating price alert:", error);
      res.status(500).json({ message: "Failed to update price alert" });
    }
  });

  app.delete('/api/price-alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alertId = parseInt(req.params.id);
      
      await storage.deletePriceAlert(alertId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting price alert:", error);
      res.status(500).json({ message: "Failed to delete price alert" });
    }
  });
}

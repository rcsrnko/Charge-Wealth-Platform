import type { Express, RequestHandler } from "express";
import { storage } from "../storage";

const fetchApi = globalThis.fetch;

export function registerCfoRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get('/api/cfo/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendations = await storage.getCfoRecommendations(userId);
      const totalPoints = await storage.getTotalPointsEarned(userId);
      const completedCount = await storage.getCompletedRecommendationsCount(userId);
      
      res.json({ 
        recommendations,
        stats: {
          totalPoints,
          completedCount,
          pendingCount: recommendations.filter((r: any) => r.status === 'pending').length
        }
      });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post('/api/cfo/generate-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [profile, positions, taxReturns] = await Promise.all([
        storage.getFinancialProfile(userId),
        storage.getPortfolioPositions(userId),
        storage.getTaxReturns(userId)
      ]);
      
      const income = parseFloat(String(profile?.annualIncome || 200000));
      const state = profile?.stateOfResidence || 'CA';
      const filingStatus = profile?.filingStatus || 'single';
      const portfolioValue = positions?.reduce((sum, p) => sum + (parseFloat(String(p.currentValue)) || 0), 0) || 0;
      const latestTax = taxReturns?.[0];
      
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const currentYear = currentDate.getFullYear();
      
      const systemPrompt = `You are a CFP (Certified Financial Planner) providing vetted, actionable recommendations.

CURRENT DATE: ${dateStr}
CURRENT TAX YEAR: ${currentYear}

USER PROFILE:
- Annual Income: $${income.toLocaleString()}
- State: ${state}
- Filing Status: ${filingStatus}
- Portfolio Value: $${portfolioValue.toLocaleString()}
- Has Tax Data: ${!!latestTax}
- Effective Tax Rate: ${latestTax?.effectiveTaxRate || 'unknown'}%

Generate 3-5 CFP-vetted recommendations based on their situation. Each must be:
1. Specific and actionable (not vague advice)
2. Appropriate for their income level
3. Prioritized by impact

Return JSON:
{
  "recommendations": [
    {
      "category": "tax|investment|savings|insurance|estate|debt",
      "strategy": "strategy_code like 401k_max, backdoor_roth, tax_loss_harvest, emergency_fund, umbrella_insurance",
      "title": "Action-oriented title",
      "description": "2-3 sentences explaining exactly what to do and why",
      "cfpRationale": "Why a CFP would recommend this - the professional reasoning",
      "estimatedSavings": [number in dollars if applicable],
      "complexity": "simple|moderate|complex",
      "timeHorizon": "immediate|this_year|multi_year",
      "priority": "urgent|high|medium|low",
      "pointValue": [10-50 based on impact and effort]
    }
  ]
}

CFP PRIORITY ORDER:
1. Tax-advantaged accounts (401k max, HSA, backdoor Roth)
2. Emergency fund (3-6 months expenses)
3. Insurance gaps (umbrella, disability)
4. Estate planning basics (beneficiaries, basic will)
5. Investment optimization (tax-loss harvesting, rebalancing)`;

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
            { role: 'user', content: 'Generate personalized CFP recommendations' }
          ],
          max_completion_tokens: 800,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content || '';
      
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        parsed = null;
      }

      if (parsed?.recommendations) {
        const savedRecs = [];
        for (const rec of parsed.recommendations) {
          const saved = await storage.createCfoRecommendation({
            userId,
            category: rec.category,
            strategy: rec.strategy,
            title: rec.title,
            description: rec.description,
            cfpRationale: rec.cfpRationale,
            estimatedSavings: rec.estimatedSavings?.toString(),
            complexity: rec.complexity,
            timeHorizon: rec.timeHorizon,
            priority: rec.priority,
            pointValue: rec.pointValue || 10,
            generatedFrom: 'proactive_analysis'
          });
          savedRecs.push(saved);
        }
        
        res.json({ recommendations: savedRecs });
      } else {
        res.json({ recommendations: [] });
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.patch('/api/cfo/recommendations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status, dismissedReason } = req.body;
      
      const updates: any = { status };
      if (status === 'completed') {
        updates.completedAt = new Date();
      }
      if (dismissedReason) {
        updates.dismissedReason = dismissedReason;
      }
      
      const updated = await storage.updateCfoRecommendation(parseInt(id), userId, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      
      let pointsEarned = 0;
      if (status === 'completed') {
        pointsEarned = await storage.getTotalPointsEarned(userId);
      }
      
      res.json({ recommendation: updated, totalPointsEarned: pointsEarned });
    } catch (error) {
      console.error("Error updating recommendation:", error);
      res.status(500).json({ message: "Failed to update recommendation" });
    }
  });

  app.get('/api/cfo/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [recommendations, achievements, totalPoints] = await Promise.all([
        storage.getCfoRecommendations(userId),
        storage.getUserAchievements(userId),
        storage.getTotalPointsEarned(userId)
      ]);
      
      const completedCount = recommendations.filter((r: any) => r.status === 'completed').length;
      const pendingCount = recommendations.filter((r: any) => r.status === 'pending').length;
      const inProgressCount = recommendations.filter((r: any) => r.status === 'in_progress').length;
      
      const level = Math.floor(totalPoints / 100) + 1;
      const nextLevelPoints = level * 100;
      
      res.json({
        points: totalPoints,
        level,
        nextLevelPoints,
        progressToNextLevel: ((totalPoints % 100) / 100) * 100,
        recommendations: {
          completed: completedCount,
          pending: pendingCount,
          inProgress: inProgressCount,
          total: recommendations.length
        },
        achievements: achievements.map((a: any) => ({
          type: a.achievementType,
          title: a.title,
          earnedAt: a.earnedAt
        })),
        streakDays: 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
}

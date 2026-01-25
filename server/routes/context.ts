import type { Express, RequestHandler } from "express";
import { storage } from "../storage";
import { buildFinancialContext, buildContextPrompt } from "../documentContext";

export function registerContextRoutes(app: Express, isAuthenticated: RequestHandler) {
  
  app.get('/api/unified-context', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [
        profile,
        taxReturns,
        positions,
        documents,
        liquidityProfile,
        priceAlerts
      ] = await Promise.all([
        storage.getFinancialProfile(userId),
        storage.getTaxReturns(userId),
        storage.getPortfolioPositions(userId),
        storage.getFinancialDocuments(userId),
        storage.getLiquidityProfile(userId),
        storage.getPriceAlerts(userId)
      ]);
      
      const portfolioValue = positions?.reduce((sum, p) => 
        sum + (parseFloat(String(p.currentValue)) || 0), 0) || 0;
      
      const totalUnrealizedGain = positions?.reduce((sum, p) => 
        sum + (parseFloat(String(p.unrealizedGain)) || 0), 0) || 0;
      
      const latestTaxReturn = taxReturns?.[0];
      const marginalBracket = latestTaxReturn?.marginalTaxBracket 
        ? parseFloat(latestTaxReturn.marginalTaxBracket) 
        : null;
      
      const opportunities: Array<{
        type: string;
        title: string;
        description: string;
        impact: number;
        affectedPositions?: string[];
        priority: string;
      }> = [];
      
      if (marginalBracket && positions) {
        const losingPositions = positions.filter(p => 
          (parseFloat(String(p.unrealizedGain)) || 0) < 0
        );
        const totalLosses = losingPositions.reduce((sum, p) => 
          sum + Math.abs(parseFloat(String(p.unrealizedGain)) || 0), 0);
        
        if (totalLosses > 0) {
          const taxSavings = totalLosses * (marginalBracket / 100);
          opportunities.push({
            type: 'tax_loss_harvest',
            title: 'Tax-Loss Harvesting Available',
            description: `You have ${losingPositions.length} positions with losses totaling $${totalLosses.toLocaleString()}. Harvesting these could save ~$${taxSavings.toFixed(0)} in taxes.`,
            impact: taxSavings,
            affectedPositions: losingPositions.map(p => p.symbol),
            priority: 'high'
          });
        }
      }
      
      if (marginalBracket && profile?.annualIncome) {
        const income = parseFloat(String(profile.annualIncome)) || 0;
        const max401k = 23000;
        const potentialSavings = max401k * (marginalBracket / 100);
        
        opportunities.push({
          type: 'retirement_contribution',
          title: 'Maximize 401(k) Contributions',
          description: `At your ${marginalBracket}% marginal rate, maxing your 401(k) at $${max401k.toLocaleString()} saves $${potentialSavings.toFixed(0)} in taxes.`,
          impact: potentialSavings,
          priority: income > 150000 ? 'high' : 'medium'
        });
      }
      
      if (positions && positions.length > 0 && portfolioValue > 0) {
        const sortedByValue = [...positions].sort((a, b) => 
          (parseFloat(String(b.currentValue)) || 0) - (parseFloat(String(a.currentValue)) || 0)
        );
        const topHolding = sortedByValue[0];
        const topWeight = (parseFloat(String(topHolding.currentValue)) || 0) / portfolioValue * 100;
        
        if (topWeight > 25) {
          opportunities.push({
            type: 'concentration_risk',
            title: `High Concentration in ${topHolding.symbol}`,
            description: `${topHolding.symbol} is ${topWeight.toFixed(1)}% of your portfolio. Consider rebalancing to reduce single-stock risk.`,
            impact: parseFloat(String(topHolding.currentValue)) || 0,
            priority: topWeight > 40 ? 'high' : 'medium'
          });
        }
      }

      const completedDocs = documents?.filter(d => d.extractionStatus === 'completed') || [];
      let estimatedFromDocs = null;
      
      if (!taxReturns?.length && completedDocs.length > 0) {
        let totalWages = 0;
        let latestNetPay = 0;
        
        for (const doc of completedDocs) {
          const data = doc.extractedData as any;
          if (data) {
            if (data.ytdGrossPay) totalWages = Math.max(totalWages, data.ytdGrossPay);
            else if (data.grossPay) totalWages = Math.max(totalWages, data.grossPay);
            if (data.netPay) latestNetPay = Math.max(latestNetPay, data.netPay);
            if (data.wagesIncome) totalWages = Math.max(totalWages, data.wagesIncome);
          }
        }
        
        let estimatedAnnualIncome = totalWages;
        if (estimatedAnnualIncome === 0 && latestNetPay > 0) {
          estimatedAnnualIncome = (latestNetPay / 0.72) * 24;
        }
        
        if (estimatedAnnualIncome > 0) {
          estimatedFromDocs = {
            estimatedAnnualIncome,
            isEstimated: true
          };
        }
      }

      let contextPrompt = '';
      try {
        const financialContext = await buildFinancialContext(userId);
        contextPrompt = buildContextPrompt(financialContext);
      } catch (e) {
        console.error('Error building context prompt:', e);
      }
      
      res.json({
        profile: profile ? {
          annualIncome: profile.annualIncome,
          filingStatus: profile.filingStatus,
          stateOfResidence: profile.stateOfResidence,
          dependents: profile.dependents,
          netWorth: profile.netWorth,
          riskTolerance: profile.riskTolerance,
          primaryGoal: profile.primaryGoal
        } : null,
        
        tax: latestTaxReturn ? {
          taxYear: latestTaxReturn.taxYear,
          totalIncome: parseFloat(latestTaxReturn.totalIncome || '0'),
          agi: parseFloat(latestTaxReturn.agi || '0'),
          taxableIncome: parseFloat(latestTaxReturn.taxableIncome || '0'),
          totalFederalTax: parseFloat(latestTaxReturn.totalFederalTax || '0'),
          effectiveTaxRate: parseFloat(latestTaxReturn.effectiveTaxRate || '0'),
          marginalTaxBracket: marginalBracket,
          filingStatus: latestTaxReturn.filingStatus,
          deductionUsed: latestTaxReturn.deductionUsed,
          capitalGainsLongTerm: parseFloat(latestTaxReturn.capitalGainsLongTerm || '0'),
          capitalGainsShortTerm: parseFloat(latestTaxReturn.capitalGainsShortTerm || '0')
        } : null,
        
        portfolio: positions && positions.length > 0 ? {
          totalValue: portfolioValue,
          totalUnrealizedGain,
          positionCount: positions.length,
          positions: positions.map(p => ({
            id: p.id,
            symbol: p.symbol,
            shares: parseFloat(String(p.shares)) || 0,
            costBasis: parseFloat(String(p.costBasis)) || 0,
            currentValue: parseFloat(String(p.currentValue)) || 0,
            unrealizedGain: parseFloat(String(p.unrealizedGain)) || 0,
            unrealizedGainPercent: parseFloat(String(p.unrealizedGainPercent)) || 0,
            holdingPeriod: p.holdingPeriod
          }))
        } : null,
        
        liquidity: liquidityProfile ? {
          currentCash: parseFloat(String(liquidityProfile.currentCash)) || 0,
          monthlyExpenses: parseFloat(String(liquidityProfile.monthlyEssentialExpenses)) || 0,
          targetReserveMonths: liquidityProfile.targetReserveMonths
        } : null,
        
        documents: {
          count: documents?.length || 0,
          analyzed: completedDocs.length,
          types: documents?.map(d => d.documentType) || []
        },
        
        alerts: priceAlerts || [],
        opportunities,
        estimatedFromDocs,
        
        status: {
          hasProfile: !!profile && !!(profile.annualIncome || profile.filingStatus),
          hasTaxData: !!(taxReturns && taxReturns.length > 0),
          hasPortfolio: !!(positions && positions.length > 0),
          hasLiquidity: !!liquidityProfile,
          hasAnalyzedDocuments: completedDocs.length > 0
        },
        
        contextPrompt,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching unified context:", error);
      res.status(500).json({ message: "Failed to fetch financial context" });
    }
  });
}

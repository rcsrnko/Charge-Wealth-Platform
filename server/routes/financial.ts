import type { Express, RequestHandler } from "express";
import { storage } from "../storage";

export function registerFinancialRoutes(app: Express, isAuthenticated: RequestHandler) {
  // GET routes for frontend compatibility
  app.get('/api/financial-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFinancialProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching financial profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/tax-returns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taxReturns = await storage.getTaxReturns(userId);
      res.json(taxReturns || []);
    } catch (error) {
      console.error("Error fetching tax returns:", error);
      res.status(500).json({ message: "Failed to fetch tax returns" });
    }
  });

  app.get('/api/portfolio-positions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const positions = await storage.getPortfolioPositions(userId);
      res.json(positions || []);
    } catch (error) {
      console.error("Error fetching portfolio positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.post('/api/financial-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { annualIncome, filingStatus, stateOfResidence, primaryGoal, monthlyExpenses, currentCash, targetReserveMonths } = req.body;

      const income = parseFloat(annualIncome);
      if (!annualIncome || isNaN(income) || income <= 0) {
        return res.status(400).json({ message: "Please enter a valid annual income" });
      }
      if (!filingStatus || !['single', 'married_joint', 'married_separate', 'head_household'].includes(filingStatus)) {
        return res.status(400).json({ message: "Please select a filing status" });
      }
      if (!stateOfResidence || (stateOfResidence.length < 2 && stateOfResidence !== 'OTHER')) {
        return res.status(400).json({ message: "Please enter a valid state code" });
      }
      if (!primaryGoal) {
        return res.status(400).json({ message: "Please select a primary goal" });
      }

      // Build profile data with optional cash flow fields
      const profileData: any = {
        userId,
        annualIncome: income.toString(),
        filingStatus,
        stateOfResidence: stateOfResidence.toUpperCase(),
        primaryGoal,
      };

      // Add cash flow data if provided
      if (monthlyExpenses !== undefined && monthlyExpenses !== null) {
        const expenses = parseFloat(monthlyExpenses);
        if (!isNaN(expenses) && expenses >= 0) {
          profileData.monthlyExpenses = expenses.toString();
        }
      }

      if (currentCash !== undefined && currentCash !== null) {
        const cash = parseFloat(currentCash);
        if (!isNaN(cash) && cash >= 0) {
          profileData.currentCash = cash.toString();
        }
      }

      if (targetReserveMonths !== undefined && targetReserveMonths !== null) {
        const months = parseInt(targetReserveMonths);
        if (!isNaN(months) && months >= 1 && months <= 24) {
          profileData.targetReserveMonths = months;
        }
      }

      const profile = await storage.upsertFinancialProfile(profileData);

      res.json({ success: true, profile });
    } catch (error) {
      console.error("Error saving financial profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.post('/api/tax-returns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { taxYear, totalIncome, agi, federalTax, filingStatus } = req.body;
      
      const year = parseInt(taxYear);
      const income = parseFloat(totalIncome);
      const agiValue = parseFloat(agi);
      const tax = parseFloat(federalTax);
      
      if (!taxYear || isNaN(year) || year < 2020 || year > 2026) {
        return res.status(400).json({ message: "Please select a valid tax year" });
      }
      if (!totalIncome || isNaN(income) || income < 0) {
        return res.status(400).json({ message: "Please enter a valid total income" });
      }
      if (!agi || isNaN(agiValue) || agiValue < 0) {
        return res.status(400).json({ message: "Please enter a valid AGI" });
      }
      if (!federalTax || isNaN(tax) || tax < 0) {
        return res.status(400).json({ message: "Please enter a valid federal tax amount" });
      }
      if (!filingStatus) {
        return res.status(400).json({ message: "Please select a filing status" });
      }
      
      const taxReturn = await storage.createTaxReturn({
        userId,
        taxYear: year,
        totalIncome: income.toString(),
        agi: agiValue.toString(),
        totalFederalTax: tax.toString(),
        filingStatus,
      });
      
      res.json({ success: true, taxReturn });
    } catch (error) {
      console.error("Error saving tax return:", error);
      res.status(500).json({ message: "Failed to save tax data" });
    }
  });

  app.post('/api/portfolio-positions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { symbol, companyName, shares, costBasis, currentValue, accountType } = req.body;
      
      const sharesNum = parseFloat(shares);
      const costBasisNum = parseFloat(costBasis);
      const currentValueNum = parseFloat(currentValue);
      
      if (!symbol || symbol.length < 1 || symbol.length > 10) {
        return res.status(400).json({ message: "Please enter a valid stock symbol" });
      }
      if (!shares || isNaN(sharesNum) || sharesNum <= 0) {
        return res.status(400).json({ message: "Please enter a valid number of shares" });
      }
      if (!costBasis || isNaN(costBasisNum) || costBasisNum < 0) {
        return res.status(400).json({ message: "Please enter a valid cost basis" });
      }
      if (!currentValue || isNaN(currentValueNum) || currentValueNum < 0) {
        return res.status(400).json({ message: "Please enter a valid current value" });
      }
      if (!accountType) {
        return res.status(400).json({ message: "Please select an account type" });
      }
      
      const unrealizedGain = currentValueNum - costBasisNum;
      const unrealizedGainPercent = costBasisNum > 0 ? (unrealizedGain / costBasisNum) * 100 : 0;
      
      const position = await storage.createPortfolioPosition({
        userId,
        symbol: symbol.toUpperCase(),
        companyName: companyName || null,
        shares: sharesNum.toString(),
        costBasis: costBasisNum.toString(),
        currentValue: currentValueNum.toString(),
        unrealizedGain: unrealizedGain.toString(),
        unrealizedGainPercent: unrealizedGainPercent.toFixed(2),
        accountType,
      });
      
      res.json({ success: true, position });
    } catch (error) {
      console.error("Error saving portfolio position:", error);
      res.status(500).json({ message: "Failed to save position" });
    }
  });

  app.post('/api/cash-flow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { monthlyEssentialExpenses, currentCash, targetReserveMonths } = req.body;
      
      const expenses = parseFloat(monthlyEssentialExpenses);
      const cash = parseFloat(currentCash);
      const months = parseInt(targetReserveMonths);
      
      if (!monthlyEssentialExpenses || isNaN(expenses) || expenses <= 0) {
        return res.status(400).json({ message: "Please enter valid monthly expenses" });
      }
      if (!currentCash || isNaN(cash) || cash < 0) {
        return res.status(400).json({ message: "Please enter valid current cash" });
      }
      if (!targetReserveMonths || isNaN(months) || months < 1 || months > 36) {
        return res.status(400).json({ message: "Please select a valid reserve target" });
      }
      
      const profile = await storage.upsertLiquidityProfile({
        userId,
        monthlyEssentialExpenses: expenses.toString(),
        currentCash: cash.toString(),
        targetReserveMonths: months,
      });
      
      res.json({ success: true, profile });
    } catch (error) {
      console.error("Error saving cash flow:", error);
      res.status(500).json({ message: "Failed to save cash flow data" });
    }
  });
}
